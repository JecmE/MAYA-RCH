import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { PeriodoPlanilla } from '../../entities/periodo-planilla.entity';
import { PlanillaEmpleado } from '../../entities/planilla-empleado.entity';
import { ConceptoPlanilla } from '../../entities/concepto-planilla.entity';
import { MovimientoPlanilla } from '../../entities/movimiento-planilla.entity';
import { Empleado } from '../../entities/empleado.entity';
import { BonoResultado } from '../../entities/bono-resultado.entity';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { ParametroSistema } from '../../entities/parametro-sistema.entity';

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
    @InjectRepository(ParametroSistema)
    private parametroRepository: Repository<ParametroSistema>,
  ) {}

  private async getPayrollParameters() {
    const params = await this.parametroRepository.find({
      where: { clave: In(['igss_laboral', 'igss_patronal', 'bono_decreto']), activo: true }
    });
    const map = new Map(params.map(p => [p.clave, p.valor]));
    return {
      igssLaboral: Number(map.get('igss_laboral') || 4.83) / 100,
      igssPatronal: Number(map.get('igss_patronal') || 12.67) / 100,
      bonoDecreto: Number(map.get('bono_decreto') || 250)
    };
  }

  private calculateIsr(montoGravable: number): number {
    // Escalas de ISR Mensual (Guatemala)
    if (montoGravable <= 5000) return 0;
    if (montoGravable <= 15000) {
        return (montoGravable - 5000) * 0.05;
    }
    // Para más de 15,000: El excedente de 15k paga 7%, y el tramo entre 5k y 15k paga 5%
    const isrTramo2 = (15000 - 5000) * 0.05;
    const isrTramo3 = (montoGravable - 15000) * 0.07;
    return isrTramo2 + isrTramo3;
  }

  async createPeriod(createDto: any, usuarioId: number) {
    const periodo = this.periodoRepository.create({ ...createDto, estado: PeriodoPlanilla.ESTADO_ABIERTO });
    const saved = await this.periodoRepository.save(periodo);
    const s = Array.isArray(saved) ? saved[0] : saved;
    return { periodoId: s.periodoId, nombre: s.nombre };
  }

  async calculatePayroll(periodoId: number, usuarioId: number) {
    const periodo = await this.periodoRepository.findOne({ where: { periodoId } });
    if (!periodo) throw new NotFoundException('Periodo no encontrado');

    const config = await this.getPayrollParameters();
    const empleados = await this.empleadoRepository.find({ where: { activo: true } });
    const resultados = [];

    const dateFin = new Date(periodo.fechaFin);
    const year = dateFin.getFullYear();
    const month = dateFin.getMonth() + 1;

    for (const emp of empleados) {
      const asistencias = await this.asistenciaRepository.find({
        where: { empleadoId: emp.empleadoId, fecha: Between(periodo.fechaInicio, periodo.fechaFin) as any }
      });

      const horas = asistencias.reduce((sum, a) => sum + Number(a.horasTrabajadas || 0), 0);
      const montoSalario = horas * (Number(emp.tarifaHora) || 45.5);

      const bonoReal = await this.bonoRepository.findOne({
        where: { empleadoId: emp.empleadoId, mes: month, anio: year },
        relations: ['reglaBono'],
        order: { fechaCalculo: 'DESC' }
      });

      const montoBonoDesempeno = bonoReal && bonoReal.elegible ? Number(bonoReal.reglaBono?.monto || 0) : 0;
      const montoBonoDecreto = config.bonoDecreto;

      // Deducción IGSS
      const igss = Math.round(montoSalario * config.igssLaboral * 100) / 100;

      // Cálculo de ISR (Simplificado: Salario - IGSS)
      const isr = Math.round(this.calculateIsr(montoSalario - igss) * 100) / 100;

      // Salario Neto
      const neto = (montoSalario + montoBonoDesempeno + montoBonoDecreto) - (igss + isr);

      resultados.push({
        empleadoId: emp.empleadoId,
        nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
        horasTrabajadas: horas,
        montoBruto: montoSalario,
        totalBonificaciones: montoBonoDesempeno + montoBonoDecreto,
        totalDeducciones: igss + isr,
        montoNeto: neto
      });
    }

    return {
      mensaje: 'Cálculo de nómina completado exitosamente (Sincronizado con Parámetros)',
      resultados
    };
  }

  async closePeriod(periodoId: number, usuarioId: number) {
    await this.periodoRepository.update(periodoId, { estado: PeriodoPlanilla.ESTADO_CERRADO });
    return { message: 'Periodo cerrado correctamente. Boletas publicadas.' };
  }

  async getMyPaycheck(empleadoId: number, periodoId?: number) {
    const periodo = periodoId
      ? await this.periodoRepository.findOne({ where: { periodoId } })
      : await this.periodoRepository.findOne({ order: { fechaInicio: 'DESC' } });

    if (!periodo) return { message: 'Periodo no encontrado' };

    const config = await this.getPayrollParameters();
    const emp = await this.empleadoRepository.findOne({ where: { empleadoId } });
    const dateFin = new Date(periodo.fechaFin);
    const year = dateFin.getFullYear();
    const month = dateFin.getMonth() + 1;

    const asistencias = await this.asistenciaRepository.find({
      where: { empleadoId, fecha: Between(periodo.fechaInicio, periodo.fechaFin) as any }
    });

    const horas = asistencias.reduce((sum, a) => sum + Number(a.horasTrabajadas || 0), 0);
    const montoSalario = horas * (Number(emp?.tarifaHora) || 45.5);

    const bonoReal = await this.bonoRepository.findOne({
      where: { empleadoId, mes: month, anio: year },
      relations: ['reglaBono'],
      order: { fechaCalculo: 'DESC' }
    });

    let montoBonoDesempeno = 0;
    let nombreBono = 'Sin Bonificación (Eval. Pendiente)';

    if (bonoReal) {
      if (bonoReal.elegible) {
        montoBonoDesempeno = Number(bonoReal.reglaBono?.monto || 0);
        nombreBono = bonoReal.reglaBono?.nombre || 'Bono Desempeño';
      } else {
        nombreBono = 'Bono Desempeño (No califica)';
      }
    }

    const igss = Math.round(montoSalario * config.igssLaboral * 100) / 100;
    const isr = Math.round(this.calculateIsr(montoSalario - igss) * 100) / 100;
    const neto = (montoSalario + montoBonoDesempeno + config.bonoDecreto) - (igss + isr);

    return {
      periodo: { nombre: periodo.nombre, fechaInicio: periodo.fechaInicio, fechaFin: periodo.fechaFin },
      montoBruto: montoSalario,
      totalBonificaciones: montoBonoDesempeno + config.bonoDecreto,
      totalDeducciones: igss + isr,
      montoNeto: neto,
      movimientos: [
        { concepto: 'Salario Base (Horas marcadas)', tipo: 'ingreso', monto: montoSalario },
        { concepto: 'Bonificación Decreto 37-2001', tipo: 'ingreso', monto: config.bonoDecreto },
        { concepto: nombreBono, tipo: 'ingreso', monto: montoBonoDesempeno },
        { concepto: `IGSS Laboral (${(config.igssLaboral * 100).toFixed(2)}%)`, tipo: 'deduccion', monto: igss },
        { concepto: 'ISR (Retención Mensual)', tipo: 'deduccion', monto: isr }
      ]
    };
  }

  async getMyPeriods(empleadoId: number) {
    return await this.periodoRepository.find({ order: { fechaInicio: 'DESC' }, take: 12 });
  }

  async getPeriods() { return await this.periodoRepository.find({ order: { fechaInicio: 'DESC' } }); }
  async getConcepts() { return await this.conceptoRepository.find({ where: { activo: true } }); }
  async seedTestData() { return { message: 'OK' }; }
}
