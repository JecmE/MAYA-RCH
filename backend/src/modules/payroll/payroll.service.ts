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
      order: { fechaInicio: 'DESC' },
    });

    return periodos.map((p) => ({
      periodoId: p.periodoId,
      nombre: p.nombre,
      fechaInicio: p.fechaInicio,
      fechaFin: p.fechaFin,
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

    // Si el periodo está CERRADO, devolvemos los datos guardados en lugar de calcular
    if (periodo.estado === PeriodoPlanilla.ESTADO_CERRADO) {
      const guardados = await this.planillaEmpleadoRepository.find({
        where: { periodoId },
        relations: ['empleado']
      });

      const resultados = guardados.map(p => ({
        empleadoId: p.empleadoId,
        nombreCompleto: this.sanitizeString(`${p.empleado?.nombres} ${p.empleado?.apellidos}`),
        horasTrabajadas: p.horasPagables,
        montoBruto: p.montoBruto,
        totalBonificaciones: p.totalBonificaciones,
        totalDeducciones: p.totalDeducciones,
        montoNeto: p.montoNeto,
      }));

      return {
        mensaje: 'Consulta de periodo cerrado exitosa',
        empleadosProcesados: resultados.length,
        resultados,
      };
    }

    const empleados = await this.empleadoRepository.find({
      where: { activo: true },
    });

    const year = new Date(periodo.fechaFin).getFullYear();
    const conceptos = await this.conceptoRepository.find({
      where: { activo: true },
    });

    const tablaIsr = await this.isrRepository.find({
      where: { anio: year },
      order: { rangoDesde: 'ASC' },
    });

    const resultados = [];

    for (const emp of empleados) {
      try {
        const asistencia = await this.asistenciaRepository.find({
          where: {
            empleadoId: emp.empleadoId,
          },
        });

        // Asegurar comparación de fechas robusta
        const start = new Date(periodo.fechaInicio);
        const end = new Date(periodo.fechaFin);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const filteredAsistencia = asistencia.filter((a) => {
          const aDate = new Date(a.fecha);
          return aDate >= start && aDate <= end;
        });

        const horasTrabajadas = filteredAsistencia.reduce(
          (sum, a) => sum + Number(a.horasTrabajadas || 0),
          0,
        );

        const tarifa = Number(emp.tarifaHora) || 45.5;
        const montoBruto = Number((horasTrabajadas * tarifa).toFixed(2));

        // Limpiar cálculos previos para este empleado en este periodo (Evitar duplicados)
        const existingPlanilla = await this.planillaEmpleadoRepository.findOne({
          where: { periodoId, empleadoId: emp.empleadoId }
        });

        if (existingPlanilla) {
          await this.movimientoRepository.delete({ planillaEmpId: existingPlanilla.planillaEmpId });
          await this.planillaEmpleadoRepository.delete(existingPlanilla.planillaEmpId);
        }

        const totalBonificaciones = 250.00; // Bonificación base de ley por defecto

        const baseImponible = montoBruto + totalBonificaciones;
        const isr = Number(this.calculateISR(baseImponible, tablaIsr).toFixed(2));
        const igss = Number((baseImponible * 0.0483).toFixed(2));
        const totalDeducciones = Number((isr + igss).toFixed(2));
        const montoNeto = Number((baseImponible - totalDeducciones).toFixed(2));

        const planillaEmpleado = this.planillaEmpleadoRepository.create({
          periodoId,
          empleadoId: emp.empleadoId,
          tarifaHoraUsada: tarifa,
          horasPagables: horasTrabajadas,
          montoBruto,
          totalBonificaciones,
          totalDeducciones,
          montoNeto,
          fechaCalculo: new Date()
        });

        const savedPlanilla = await this.planillaEmpleadoRepository.save(planillaEmpleado);

        // Registrar movimientos reales
        const movs = [
          { cod: 'SALARIO', m: montoBruto, t: ConceptoPlanilla.TIPO_INGRESO },
          { cod: 'BONOPUNT', m: totalBonificaciones, t: ConceptoPlanilla.TIPO_INGRESO },
          { cod: 'IGSS', m: igss, t: ConceptoPlanilla.TIPO_DEDUCCION },
          { cod: 'ISR', m: isr, t: ConceptoPlanilla.TIPO_DEDUCCION }
        ];

        for (const m of movs) {
          const conc = conceptos.find(c => c.codigo === m.cod);
          if (conc) {
            await this.movimientoRepository.save({
              planillaEmpId: savedPlanilla.planillaEmpId,
              conceptoId: conc.conceptoId,
              tipo: m.t,
              usuarioIdRegista: usuarioId,
              monto: m.m,
              esManual: false,
              fechaHora: new Date()
            });
          }
        }

        resultados.push({
          empleadoId: emp.empleadoId,
          nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
          horasTrabajadas,
          montoBruto,
          totalBonificaciones,
          totalDeducciones,
          montoNeto,
        });
      } catch (err) {
        console.error(`Error calculando para empleado ${emp.empleadoId}:`, err);
        // Continuar con el siguiente empleado
      }
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
    let periodo: PeriodoPlanilla | null = null;

    if (periodoId) {
      periodo = await this.periodoRepository.findOne({
        where: { periodoId },
      });
      if (periodo) {
        planilla = await this.planillaEmpleadoRepository.findOne({
          where: { periodoId, empleadoId },
          relations: ['periodo'],
        });
      }
    } else {
      periodo = await this.periodoRepository.findOne({
        order: { fechaInicio: 'DESC' },
      });
      if (periodo) {
        planilla = await this.planillaEmpleadoRepository.findOne({
          where: { empleadoId },
          relations: ['periodo'],
          order: { fechaCalculo: 'DESC' },
        });
      }
    }

    if (!periodo) {
      return { message: 'No se encontró período de planilla' };
    }

    if (planilla) {
      const movimientos = await this.movimientoRepository.find({
        where: { planillaEmpId: planilla.planillaEmpId },
        relations: ['concepto'],
      });

      return {
        periodo: {
          nombre: planilla.periodo?.nombre,
          fechaInicio: planilla.periodo?.fechaInicio,
          fechaFin: planilla.periodo?.fechaFin,
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

    const asistencias = await this.asistenciaRepository.find({
      where: { empleadoId },
    });

    const horasTrabajadas = asistencias
      .filter((a) => a.fecha >= periodo.fechaInicio && a.fecha <= periodo.fechaFin)
      .reduce((sum, a) => sum + Number(a.horasTrabajadas || 0), 0);

    const empleado = await this.empleadoRepository.findOne({ where: { empleadoId } });
    const tarifa = Number(empleado?.tarifaHora) || 45.5;

    if (horasTrabajadas === 0) {
      return {
        periodo: {
          nombre: periodo.nombre,
          fechaInicio: periodo.fechaInicio,
          fechaFin: periodo.fechaFin,
        },
        empleadoId,
        tarifaHora: tarifa,
        horasPagables: 0,
        montoBruto: 0,
        totalBonificaciones: 0,
        totalDeducciones: 0,
        montoNeto: 0,
        movimientos: [],
      };
    }

    const year = new Date(periodo.fechaFin).getFullYear();
    const tablaIsr = await this.isrRepository.find({
      where: { anio: year },
      order: { rangoDesde: 'ASC' },
    });

    const montoBruto = tarifa * horasTrabajadas;
    const totalBonificaciones = 0;
    const baseImponible = montoBruto + totalBonificaciones;
    const isr = this.calculateISR(baseImponible, tablaIsr);
    const igss = baseImponible * 0.0483;
    const totalDeducciones = isr + igss;
    const montoNeto = baseImponible - totalDeducciones;

    return {
      periodo: {
        nombre: periodo.nombre,
        fechaInicio: periodo.fechaInicio,
        fechaFin: periodo.fechaFin,
      },
      empleadoId,
      tarifaHora: tarifa,
      horasPagables: horasTrabajadas,
      montoBruto,
      totalBonificaciones,
      totalDeducciones,
      montoNeto,
      movimientos: [
        { concepto: 'Salario Base', tipo: 'ingreso', monto: montoBruto },
        { concepto: 'IGSS Laboral', tipo: 'deduccion', monto: igss },
        { concepto: 'ISR Retenida', tipo: 'deduccion', monto: isr },
      ],
    };
  }


  async getMyPeriods(empleadoId: number) {
    if (!empleadoId) {
      const periodos = await this.periodoRepository.find({ order: { fechaInicio: 'DESC' } });
      return periodos.map((p) => ({
        periodoId: p.periodoId,
        nombre: p.nombre,
        fechaInicio: p.fechaInicio,
        fechaFin: p.fechaFin,
        tipo: p.tipo,
        estado: p.estado,
      }));
    }

    const planillas = await this.planillaEmpleadoRepository.find({
      where: { empleadoId },
      relations: ['periodo'],
      order: { fechaCalculo: 'DESC' },
    });

    const periodos = planillas
      .filter((p) => p.periodo)
      .map((p) => ({
        periodoId: p.periodo.periodoId,
        nombre: p.periodo.nombre,
        fechaInicio: p.periodo.fechaInicio,
        fechaFin: p.periodo.fechaFin,
        tipo: p.periodo.tipo,
        estado: p.periodo.estado,
      }));

    if (periodos.length > 0) {
      return periodos;
    }

    return [];
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

  private sanitizeString(str: string | null | undefined): string {
    if (!str) return '';
    return str
      .replace(/\?/g, (match, offset, original) => {
        if (original.includes('Rodr')) return 'í';
        if (original.includes('Mart')) return 'í';
        if (original.includes('Garc')) return 'í';
        return 'í';
      })
      .replace(/Ã­/g, 'í')
      .replace(/Ã³/g, 'ó')
      .replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é')
      .replace(/Ãº/g, 'ú')
      .replace(/Ã±/g, 'ñ');
  }

  async seedTestData() {
    let message = 'Seed data verificado: ';

    const existingPeriodos = await this.periodoRepository.count();
    if (existingPeriodos === 0) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const periodoEnero = this.periodoRepository.create({
        nombre: `Enero ${currentYear}`,
        fechaInicio: `${currentYear}-01-01`,
        fechaFin: `${currentYear}-01-31`,
        tipo: 'mensual',
        estado: PeriodoPlanilla.ESTADO_CERRADO,
      });
      await this.periodoRepository.save(periodoEnero);

      const periodoFeb = this.periodoRepository.create({
        nombre: `Febrero ${currentYear}`,
        fechaInicio: `${currentYear}-02-01`,
        fechaFin: new Date(currentYear, 2, 0).toISOString().split('T')[0],
        tipo: 'mensual',
        estado: PeriodoPlanilla.ESTADO_CERRADO,
      });
      await this.periodoRepository.save(periodoFeb);

      const periodoActual = this.periodoRepository.create({
        nombre: `${currentMonth === 3 ? 'Marzo' : 'Abril'} ${currentYear}`,
        fechaInicio: `${currentYear}-${String(currentMonth).padStart(2,'0')}-01`,
        fechaFin: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0],
        tipo: 'mensual',
        estado: PeriodoPlanilla.ESTADO_ABIERTO,
      });
      await this.periodoRepository.save(periodoActual);

      message += ' períodos creados, ';
    }

    const conceptosCount = await this.conceptoRepository.count();
    if (conceptosCount === 0) {
      await this.conceptoRepository.save({
        codigo: 'SALARIO',
        nombre: 'Salario Base',
        tipo: ConceptoPlanilla.TIPO_INGRESO,
        modoCalculo: ConceptoPlanilla.MODO_FIJO,
        baseCalculo: 1,
        activo: true,
      });
      await this.conceptoRepository.save({
        codigo: 'BONOPUNT',
        nombre: 'Bonificación Decreto 37-2001',
        tipo: ConceptoPlanilla.TIPO_INGRESO,
        modoCalculo: ConceptoPlanilla.MODO_FIJO,
        baseCalculo: 2,
        activo: true,
      });
      await this.conceptoRepository.save({
        codigo: 'BONODESC',
        nombre: 'Bono por Desempeño',
        tipo: ConceptoPlanilla.TIPO_INGRESO,
        modoCalculo: ConceptoPlanilla.MODO_VARIABLE,
        baseCalculo: 3,
        activo: true,
      });
      await this.conceptoRepository.save({
        codigo: 'IGSS',
        nombre: 'IGSS Laboral',
        tipo: ConceptoPlanilla.TIPO_DEDUCCION,
        modoCalculo: ConceptoPlanilla.MODO_PORCENTAJE,
        baseCalculo: 4,
        activo: true,
      });
      await this.conceptoRepository.save({
        codigo: 'ISR',
        nombre: 'ISR Retenido',
        tipo: ConceptoPlanilla.TIPO_DEDUCCION,
        modoCalculo: ConceptoPlanilla.MODO_VARIABLE,
        baseCalculo: 5,
        activo: true,
      });

      message += ' conceptos creados, ';
    }

    const tablaIsrCount = await this.isrRepository.count();
    if (tablaIsrCount === 0) {
      const year = new Date().getFullYear();
      await this.isrRepository.save({
        anio: year,
        rangoDesde: 0,
        rangoHasta: 60000,
        cuotaFijo: 0,
        porcentaje: 0,
      });
      await this.isrRepository.save({
        anio: year,
        rangoDesde: 60001,
        rangoHasta: 90000,
        cuotaFijo: 0,
        porcentaje: 5,
      });
      await this.isrRepository.save({
        anio: year,
        rangoDesde: 90001,
        rangoHasta: 120000,
        cuotaFijo: 1500,
        porcentaje: 7,
      });
      await this.isrRepository.save({
        anio: year,
        rangoDesde: 120001,
        rangoHasta: 180000,
        cuotaFijo: 3600,
        porcentaje: 10,
      });
      await this.isrRepository.save({
        anio: year,
        rangoDesde: 180001,
        rangoHasta: 999999999,
        cuotaFijo: 9600,
        porcentaje: 15,
      });

      message += ' tabla ISR creada. ';
    }

    return { message: message + ' Sistema listo para boletas.' };
  }
}
