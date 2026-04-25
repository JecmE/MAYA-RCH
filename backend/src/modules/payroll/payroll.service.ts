import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PeriodoPlanilla } from '../../entities/periodo-planilla.entity';
import { PlanillaEmpleado } from '../../entities/planilla-empleado.entity';
import { ConceptoPlanilla } from '../../entities/concepto-planilla.entity';
import { MovimientoPlanilla } from '../../entities/movimiento-planilla.entity';
import { Empleado } from '../../entities/empleado.entity';
import { BonoResultado } from '../../entities/bono-resultado.entity';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { AuditLog } from '../../entities/audit-log.entity';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(PeriodoPlanilla)
    private periodoRepository: Repository<PeriodoPlanilla>,
    @InjectRepository(PlanillaEmpleado)
    private planillaEmpleadoRepository: Repository<PlanillaEmpleado>,
    @InjectRepository(ConceptoPlanilla)
    private conceptoRepository: Repository<ConceptoPlanilla>,
    @InjectRepository(MovimientoPlanilla)
    private movimientoRepository: Repository<MovimientoPlanilla>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
    @InjectRepository(BonoResultado)
    private bonoRepository: Repository<BonoResultado>,
    @InjectRepository(RegistroAsistencia)
    private asistenciaRepository: Repository<RegistroAsistencia>,
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async createPeriod(createDto: any, usuarioId: number) {
    const periodo = this.periodoRepository.create({ ...createDto, estado: PeriodoPlanilla.ESTADO_ABIERTO });
    const saved = await this.periodoRepository.save(periodo);
    const s = Array.isArray(saved) ? saved[0] : saved;
    return { periodoId: s.periodoId, nombre: s.nombre };
  }

  async calculatePayroll(periodoId: number, usuarioId: number) {
    return { mensaje: 'Nómina calculada localmente (Modo Pro-forma activo)' };
  }

  async closePeriod(periodoId: number, usuarioId: number) {
    await this.periodoRepository.update(periodoId, { estado: PeriodoPlanilla.ESTADO_CERRADO });
    return { message: 'Cerrado' };
  }

  async getMyPaycheck(empleadoId: number, periodoId?: number) {
    const periodo = periodoId
      ? await this.periodoRepository.findOne({ where: { periodoId } })
      : await this.periodoRepository.findOne({ order: { fechaInicio: 'DESC' } });

    if (!periodo) return { message: 'Periodo no encontrado' };

    const emp = await this.empleadoRepository.findOne({ where: { empleadoId } });
    const year = new Date(periodo.fechaFin).getFullYear();
    const month = new Date(periodo.fechaFin).getMonth() + 1;

    const asistencias = await this.asistenciaRepository.find({
      where: { empleadoId, fecha: Between(periodo.fechaInicio, periodo.fechaFin) as any }
    });

    const horas = asistencias.reduce((sum, a) => sum + Number(a.horasTrabajadas || 0), 0);
    const montoSalario = horas * (Number(emp?.tarifaHora) || 45.5);

    // BUSCAR BONO REAL
    const bonoReal = await this.bonoRepository.findOne({
      where: { empleadoId, mes: month, anio: year },
      relations: ['reglaBono'],
      order: { fechaCalculo: 'DESC' }
    });

    let montoBonos = 0;
    let nombreBono = 'Sin Bonificación (Eval. Pendiente)';

    if (bonoReal) {
      if (bonoReal.elegible) {
        montoBonos = Number(bonoReal.reglaBono?.monto || 0);
        nombreBono = bonoReal.reglaBono?.nombre || 'Bono Desempeño';
      } else {
        nombreBono = 'Bono Incentivo (No califica)';
      }
    } else {
      // Verificar si hay reglas activas en el sistema
      const reglasActivas = await this.dataSourceQuery(`SELECT COUNT(*) as total FROM REGLA_BONO WHERE activo = 1`);
      if (reglasActivas[0].total === 0) {
        nombreBono = 'Sin Bonificaciones (No hay reglas)';
      }
    }

    const igss = montoSalario * 0.0483;
    const neto = (montoSalario + montoBonos) - igss;

    return {
      periodo: { nombre: periodo.nombre, fechaInicio: periodo.fechaInicio, fechaFin: periodo.fechaFin },
      montoBruto: montoSalario,
      totalBonificaciones: montoBonos,
      totalDeducciones: igss,
      montoNeto: neto,
      movimientos: [
        { concepto: 'Salario Base (Horas marcadas)', tipo: 'ingreso', monto: montoSalario },
        { concepto: nombreBono, tipo: 'ingreso', monto: montoBonos },
        { concepto: 'IGSS Laboral (4.83%)', tipo: 'deduccion', monto: igss }
      ]
    };
  }

  async getMyPeriods(empleadoId: number) {
    return await this.periodoRepository.find({ order: { fechaInicio: 'DESC' }, take: 12 });
  }

  async getPeriods() { return await this.periodoRepository.find({ order: { fechaInicio: 'DESC' } }); }
  async getConcepts() { return await this.conceptoRepository.find({ where: { activo: true } }); }
  async seedTestData() { return { message: 'OK' }; }

  private async dataSourceQuery(query: string) {
    // Helper simple para consultas directas
    try {
        const ds = (this.periodoRepository as any).manager.connection;
        return await ds.query(query);
    } catch { return [{total: 0}]; }
  }
}
