import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeriodoPlanilla } from '../../entities/periodo-planilla.entity';
import { PlanillaEmpleado } from '../../entities/planilla-empleado.entity';
import { ConceptoPlanilla } from '../../entities/concepto-planilla.entity';
import { MovimientoPlanilla } from '../../entities/movimiento-planilla.entity';
import { TablaIsr } from '../../entities/tabla-isr.entity';
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
    @InjectRepository(TablaIsr)
    private isrRepository: Repository<TablaIsr>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
    @InjectRepository(BonoResultado)
    private bonoRepository: Repository<BonoResultado>,
    @InjectRepository(RegistroAsistencia)
    private asistenciaRepository: Repository<RegistroAsistencia>,
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async getPeriods() {
    const periodos = await this.periodoRepository.find({
      order: { fecha_inicio: 'DESC' },
    });

    return periodos.map((p) => ({
      periodoId: p.periodoId,
      nombre: p.nombre,
      fecha_inicio: p.fecha_inicio,
      fecha_fin: p.fecha_fin,
      tipo: p.tipo,
      estado: p.estado,
    }));
  }

  async createPeriod(createDto: any, usuarioId: number) {
    const periodo = this.periodoRepository.create({
      ...createDto,
      estado: PeriodoPlanilla.ESTADO_ABIERTO,
    });

    const saved = (await this.periodoRepository.save(periodo)) as unknown as PeriodoPlanilla;

    await this.auditRepository.save({
      usuarioId,
      modulo: 'PAYROLL',
      accion: 'CREATE_PERIOD',
      entidad: 'PERIODO_PLANILLA',
      entidadId: saved.periodoId,
      detalle: `Período creado: ${saved.nombre}`,
    });

    return {
      periodoId: saved.periodoId,
      nombre: saved.nombre,
      estado: saved.estado,
      mensaje: 'Período creado exitosamente',
    };
  }

  async calculatePayroll(periodoId: number, usuarioId: number) {
    const periodo = await this.periodoRepository.findOne({
      where: { periodoId },
    });

    if (!periodo) {
      throw new NotFoundException('Período no encontrado');
    }

    if (periodo.estado !== PeriodoPlanilla.ESTADO_ABIERTO) {
      throw new BadRequestException('El período no está abierto');
    }

    const empleados = await this.empleadoRepository.find({
      where: { activo: true },
    });

    const year = new Date(periodo.fecha_fin).getFullYear();
    const conceptos = await this.conceptoRepository.find({
      where: { activo: true },
    });

    const tablaIsr = await this.isrRepository.find({
      where: { anio: year },
      order: { rangoDesde: 'ASC' },
    });

    const resultados = [];

    for (const emp of empleados) {
      const asistencia = await this.asistenciaRepository.find({
        where: {
          empleadoId: emp.empleadoId,
        },
      });

      const filteredAsistencia = asistencia.filter(
        (a) => a.fecha >= periodo.fecha_inicio && a.fecha <= periodo.fecha_fin,
      );

      const horasTrabajadas = filteredAsistencia.reduce(
        (sum, a) => sum + Number(a.horasTrabajadas || 0),
        0,
      );

      const tarifa = Number(emp.tarifaHora) || 45.5;
      const montoBruto = horasTrabajadas * tarifa;

      const bonos = await this.bonoRepository.find({
        where: {
          empleadoId: emp.empleadoId,
          anio: year,
          elegible: true,
        },
      });

      const totalBonificaciones = 0;

      const baseImponible = montoBruto + totalBonificaciones;
      const isr = this.calculateISR(baseImponible, tablaIsr);

      const igss = baseImponible * 0.0483;
      const totalDeducciones = isr + igss;
      const montoNeto = baseImponible - totalDeducciones;

      const planillaEmpleado = this.planillaEmpleadoRepository.create({
        periodoId,
        empleadoId: emp.empleadoId,
        tarifaHoraUsada: tarifa,
        horasPagables: horasTrabajadas,
        montoBruto,
        totalBonificaciones,
        totalDeducciones,
        montoNeto,
      });

      const savedPlanilla = await this.planillaEmpleadoRepository.save(planillaEmpleado);

      await this.movimientoRepository.save({
        planillaEmpId: savedPlanilla.planillaEmpId,
        conceptoId: conceptos.find((c) => c.codigo === 'SALARIO')?.conceptoId,
        tipo: ConceptoPlanilla.TIPO_INGRESO,
        usuarioIdRegista: usuarioId,
        monto: montoBruto,
        esManual: false,
      });

      if (totalBonificaciones > 0) {
        await this.movimientoRepository.save({
          planillaEmpId: savedPlanilla.planillaEmpId,
          conceptoId: conceptos.find((c) => c.codigo === 'BONOPUNT')?.conceptoId,
          tipo: ConceptoPlanilla.TIPO_INGRESO,
          usuarioIdRegista: usuarioId,
          monto: totalBonificaciones,
          esManual: false,
        });
      }

      await this.movimientoRepository.save({
        planillaEmpId: savedPlanilla.planillaEmpId,
        conceptoId: conceptos.find((c) => c.codigo === 'ISR')?.conceptoId,
        tipo: ConceptoPlanilla.TIPO_DEDUCCION,
        usuarioIdRegista: usuarioId,
        monto: isr,
        esManual: false,
      });

      await this.movimientoRepository.save({
        planillaEmpId: savedPlanilla.planillaEmpId,
        conceptoId: conceptos.find((c) => c.codigo === 'IGSS')?.conceptoId,
        tipo: ConceptoPlanilla.TIPO_DEDUCCION,
        usuarioIdRegista: usuarioId,
        monto: igss,
        esManual: false,
      });

      resultados.push({
        empleadoId: emp.empleadoId,
        nombreCompleto: emp.nombreCompleto,
        horasTrabajadas,
        montoBruto,
        totalBonificaciones,
        totalDeducciones,
        montoNeto,
      });
    }

    await this.auditRepository.save({
      usuarioId,
      modulo: 'PAYROLL',
      accion: 'CALCULATE_PAYROLL',
      entidad: 'PERIODO_PLANILLA',
      entidadId: periodoId,
      detalle: `Cálculo de nómina ejecutado para ${resultados.length} empleados`,
    });

    return {
      mensaje: 'Cálculo ejecutado',
      empleadosProcesados: resultados.length,
      resultados,
    };
  }

  async closePeriod(periodoId: number, usuarioId: number) {
    const periodo = await this.periodoRepository.findOne({
      where: { periodoId },
    });

    if (!periodo) {
      throw new NotFoundException('Período no encontrado');
    }

    if (periodo.estado === PeriodoPlanilla.ESTADO_CERRADO) {
      throw new BadRequestException('El período ya está cerrado');
    }

    periodo.estado = PeriodoPlanilla.ESTADO_CERRADO;
    await this.periodoRepository.save(periodo);

    await this.auditRepository.save({
      usuarioId,
      modulo: 'PAYROLL',
      accion: 'CLOSE_PERIOD',
      entidad: 'PERIODO_PLANILLA',
      entidadId: periodoId,
      detalle: `Período cerrado: ${periodo.nombre}`,
    });

    return { message: 'Período cerrado correctamente' };
  }

  async getMyPaycheck(empleadoId: number, periodoId?: number) {
    let planilla;

    if (periodoId) {
      planilla = await this.planillaEmpleadoRepository.findOne({
        where: { periodoId, empleadoId },
        relations: ['periodo'],
      });
    } else {
      planilla = await this.planillaEmpleadoRepository.findOne({
        where: { empleadoId },
        relations: ['periodo'],
        order: { fechaCalculo: 'DESC' },
      });
    }

    if (!planilla) {
      return { message: 'No se encontró boleta de pago' };
    }

    const movimientos = await this.movimientoRepository.find({
      where: { planillaEmpId: planilla.planillaEmpId },
      relations: ['concepto'],
    });

    return {
      periodo: {
        nombre: planilla.periodo?.nombre,
        fecha_inicio: planilla.periodo?.fecha_inicio,
        fecha_fin: planilla.periodo?.fecha_fin,
      },
      empleadoId: planilla.empleadoId,
      tarifaHora: planilla.tarifaHoraUsada,
      horasPagables: planilla.horasPagables,
      montoBruto: planilla.montoBruto,
      totalBonificaciones: planilla.totalBonificaciones,
      totalDeducciones: planilla.totalDeducciones,
      montoNeto: planilla.montoNeto,
      movimientos: movimientos.map((m) => ({
        concepto: m.concepto?.nombre,
        tipo: m.tipo,
        monto: m.monto,
      })),
    };
  }

  async getMyPeriods(empleadoId: number) {
    const planillas = await this.planillaEmpleadoRepository.find({
      where: { empleadoId },
      relations: ['periodo'],
      order: { fechaCalculo: 'DESC' },
    });

    return planillas
      .filter((p) => p.periodo)
      .map((p) => ({
        periodoId: p.periodo.periodoId,
        nombre: p.periodo.nombre,
        fecha_inicio: p.periodo.fecha_inicio,
        fecha_fin: p.periodo.fecha_fin,
        tipo: p.periodo.tipo,
        estado: p.periodo.estado,
      }));
  }

  async getConcepts() {
    const conceptos = await this.conceptoRepository.find({
      where: { activo: true },
    });

    return conceptos.map((c) => ({
      conceptoId: c.conceptoId,
      codigo: c.codigo,
      nombre: c.nombre,
      tipo: c.tipo,
      modoCalculo: c.modoCalculo,
      baseCalculo: c.baseCalculo,
    }));
  }

  private calculateISR(baseImponible: number, tablaIsr: TablaIsr[]): number {
    for (const tramo of tablaIsr) {
      if (baseImponible >= Number(tramo.rangoDesde) && baseImponible <= Number(tramo.rangoHasta)) {
        return (
          Number(tramo.cuotaFijo) +
          (baseImponible - Number(tramo.rangoDesde)) * (Number(tramo.porcentaje) / 100)
        );
      }
    }
    return 0;
  }
}
