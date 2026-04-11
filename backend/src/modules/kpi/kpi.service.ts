import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Raw } from 'typeorm';
import { KpiMensual } from '../../entities/kpi-mensual.entity';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { Empleado } from '../../entities/empleado.entity';
import { DataSource } from 'typeorm';
import { SolicitudPermiso } from '../../entities/solicitud-permiso.entity';
import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { Proyecto } from '../../entities/proyecto.entity';

@Injectable()
export class KpiService {
  constructor(
    @InjectRepository(KpiMensual)
    private kpiRepository: Repository<KpiMensual>,
    @InjectRepository(RegistroAsistencia)
    private asistenciaRepository: Repository<RegistroAsistencia>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
    @InjectRepository(SolicitudPermiso)
    private solicitudPermisoRepository: Repository<SolicitudPermiso>,
    @InjectRepository(RegistroTiempo)
    private registroTiempoRepository: Repository<RegistroTiempo>,
    @InjectRepository(Proyecto)
    private proyectoRepository: Repository<Proyecto>,
    private dataSource: DataSource,
  ) {}

  async getEmployeeDashboard(empleadoId: number, mes?: number, anio?: number) {
    const now = new Date();
    const month = mes || now.getMonth() + 1;
    const year = anio || now.getFullYear();

    let kpi = await this.kpiRepository.findOne({
      where: { empleadoId, mes: month, anio: year },
    });

    if (!kpi) {
      kpi = await this.calculateKpi(empleadoId, month, year);
    }

    return {
      mes,
      anio: year,
      diasEsperados: kpi.diasEsperados,
      diasTrabajados: kpi.diasTrabajados,
      tardias: kpi.tardias,
      faltas: kpi.faltas,
      horasEsperadas: kpi.horasEsperadas,
      horasTrabajadas: kpi.horasTrabajadas,
      cumplimientoPct: kpi.cumplimientoPct,
      clasificacion: kpi.clasificacion,
    };
  }

  async getSupervisorDashboard(supervisorEmpleadoId: number, mes?: number, anio?: number) {
    const now = new Date();
    const month = mes || now.getMonth() + 1;
    const year = anio || now.getFullYear();

    const equipoRaw = await this.dataSource.query(
      `SELECT empleado_id, nombres, apellidos, codigo_empleado FROM EMPLEADO WHERE supervisor_id = @0 AND activo = 1`,
      [supervisorEmpleadoId],
    );

    if (equipoRaw.length === 0) {
      return {
        mes,
        anio: year,
        cantidadEmpleados: 0,
        resumen: {
          totalDiasTrabajados: 0,
          totalTardias: 0,
          promedioCumplimiento: 0,
        },
        empleados: [],
      };
    }

    const empleadoIds = equipoRaw.map((e: any) => e.empleado_id);
    const kpis = await this.kpiRepository.find({
      where: {
        empleadoId: In(empleadoIds),
        mes: month,
        anio: year,
      },
    });

    const kpiMap = new Map(kpis.map((k) => [k.empleadoId, k]));

    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;

    const previousKpis = await this.kpiRepository.find({
      where: {
        empleadoId: In(empleadoIds),
        mes: previousMonth,
        anio: previousYear,
      },
    });

    const previousKpiMap = new Map(previousKpis.map((k) => [k.empleadoId, k]));

    const currentAvg =
      kpis.length > 0
        ? kpis.reduce((sum, k) => sum + Number(k.cumplimientoPct), 0) / kpis.length
        : 0;

    const previousAvg =
      previousKpis.length > 0
        ? previousKpis.reduce((sum, k) => sum + Number(k.cumplimientoPct), 0) / previousKpis.length
        : 0;

    const comparacionMesAnterior =
      previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;

    return {
      mes,
      anio: year,
      cantidadEmpleados: equipoRaw.length,
      resumen: {
        totalDiasTrabajados: kpis.reduce((sum, k) => sum + k.diasTrabajados, 0),
        totalTardias: kpis.reduce((sum, k) => sum + k.tardias, 0),
        promedioCumplimiento: currentAvg,
        comparacionMesAnterior: Math.round(comparacionMesAnterior * 10) / 10,
      },
      empleados: equipoRaw.map((e: any) => {
        const kpi = kpiMap.get(e.empleado_id);
        return {
          empleadoId: e.empleado_id,
          nombreCompleto: `${e.nombres} ${e.apellidos}`,
          codigoEmpleado: e.codigo_empleado,
          diasEsperados: kpi?.diasEsperados || 0,
          diasTrabajados: kpi?.diasTrabajados || 0,
          tardias: kpi?.tardias || 0,
          faltas: kpi?.faltas || 0,
          cumplimientoPct: kpi?.cumplimientoPct || 0,
          clasificacion: kpi?.clasificacion || 'Sin datos',
        };
      }),
    };
  }

  async getHrDashboard(mes?: number, anio?: number) {
    const now = new Date();
    const month = mes || now.getMonth() + 1;
    const year = anio || now.getFullYear();

    const kpis = await this.kpiRepository.find({
      where: { mes: month, anio: year },
    });

    const clasificaciones = {
      Excelente: kpis.filter((k) => k.clasificacion === 'Excelente').length,
      Bueno: kpis.filter((k) => k.clasificacion === 'Bueno').length,
      'En observacion': kpis.filter((k) => k.clasificacion === 'En observacion').length,
      'En riesgo': kpis.filter((k) => k.clasificacion === 'En riesgo').length,
    };

    return {
      mes,
      anio: year,
      totalEmpleados: kpis.length,
      promedioCumplimiento:
        kpis.length > 0
          ? kpis.reduce((sum, k) => sum + Number(k.cumplimientoPct), 0) / kpis.length
          : 0,
      totalTardias: kpis.reduce((sum, k) => sum + k.tardias, 0),
      totalFaltas: kpis.reduce((sum, k) => sum + k.faltas, 0),
      clasificaciones,
    };
  }

  async getEmployeeClassification(empleadoId: number, mes?: number, anio?: number) {
    const now = new Date();
    const month = mes || now.getMonth() + 1;
    const year = anio || now.getFullYear();

    let kpi = await this.kpiRepository.findOne({
      where: { empleadoId, mes: month, anio: year },
    });

    if (!kpi) {
      kpi = await this.calculateKpi(empleadoId, month, year);
    }

    const empleado = await this.empleadoRepository.findOne({
      where: { empleadoId },
    });

    return [
      {
        empleadoId,
        nombreCompleto: empleado ? `${empleado.nombres} ${empleado.apellidos}` : '',
        clasificacion: kpi.clasificacion,
        cumplimientoPct: kpi.cumplimientoPct,
        tardias: kpi.tardias,
        faltas: kpi.faltas,
      },
    ];
  }

  private async calculateKpi(empleadoId: number, mes: number, anio: number): Promise<KpiMensual> {
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0);

    const diasLaborales = fechaFin.getDate();
    const horasEsperadas = diasLaborales * 8;

    const asistencia = await this.asistenciaRepository.find({
      where: {
        empleadoId,
        fecha: Between(fechaInicio, fechaFin),
      },
    });

    const diasTrabajados = asistencia.filter(
      (a) => a.estadoJornada === 'completada' || a.estadoJornada === 'incompleta',
    ).length;

    const diasConEntrada = asistencia.filter((a) => a.horaEntradaReal !== null).length;
    const tardias = asistencia.reduce((sum, a) => sum + (a.minutosTardia > 0 ? 1 : 0), 0);
    const faltas = diasLaborales - diasConEntrada;

    const horasTrabajadas = asistencia.reduce((sum, a) => sum + Number(a.horasTrabajadas || 0), 0);

    const cumplimientoPct = horasEsperadas > 0 ? (horasTrabajadas / horasEsperadas) * 100 : 0;

    let clasificacion = 'En riesgo';
    if (cumplimientoPct >= 95) clasificacion = 'Excelente';
    else if (cumplimientoPct >= 85) clasificacion = 'Bueno';
    else if (cumplimientoPct >= 70) clasificacion = 'En observacion';

    const kpi = this.kpiRepository.create({
      empleadoId,
      anio,
      mes,
      diasEsperados: diasLaborales,
      diasTrabajados,
      tardias,
      faltas,
      horasEsperadas,
      horasTrabajadas,
      cumplimientoPct: Math.round(cumplimientoPct * 100) / 100,
      clasificacion,
      fechaCalculo: new Date(),
    });

    return this.kpiRepository.save(kpi);
  }

  async getEmployeeProfile(empleadoId: number) {
    const empleado = await this.empleadoRepository.findOne({
      where: { empleadoId },
    });

    if (!empleado) {
      return null;
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const attendance = await this.asistenciaRepository.find({
      where: {
        empleadoId,
        fecha: Raw((alias) => `${alias} >= :sevenDaysAgo`, { sevenDaysAgo }),
      },
      order: { fecha: 'DESC' },
    });

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const timesheets = await this.registroTiempoRepository.find({
      where: {
        empleadoId,
        fecha: Raw((alias) => `${alias} >= :firstDayOfMonth`, { firstDayOfMonth }),
      },
      relations: ['proyecto'],
    });

    const projectHoursMap = new Map<number, { nombre: string; horas: number }>();
    for (const ts of timesheets) {
      const horas = Number(ts.horas) || 0;
      if (projectHoursMap.has(ts.proyectoId)) {
        const existing = projectHoursMap.get(ts.proyectoId)!;
        existing.horas += horas;
      } else {
        projectHoursMap.set(ts.proyectoId, {
          nombre: ts.proyecto?.nombre || `Proyecto ${ts.proyectoId}`,
          horas,
        });
      }
    }

    const recentRequests = await this.solicitudPermisoRepository.find({
      where: { empleadoId },
      relations: ['tipoPermiso'],
      order: { fechaSolicitud: 'DESC' },
      take: 5,
    });

    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const currentKpi = await this.kpiRepository.findOne({
      where: { empleadoId, mes: currentMonth, anio: currentYear },
    });

    const previousKpi = await this.kpiRepository.findOne({
      where: { empleadoId, mes: previousMonth, anio: previousYear },
    });

    const comparisonPct =
      previousKpi && previousKpi.cumplimientoPct > 0
        ? (((currentKpi?.cumplimientoPct || 0) - previousKpi.cumplimientoPct) /
            previousKpi.cumplimientoPct) *
          100
        : 0;

    return {
      empleado: {
        nombreCompleto: `${empleado.nombres} ${empleado.apellidos}`,
        puesto: empleado.puesto,
        departamento: empleado.departamento,
        email: empleado.email,
      },
      historialAsistencia: attendance.slice(0, 7).map((a) => ({
        fecha: a.fecha,
        entrada: a.horaEntradaReal,
        salida: a.horaSalidaReal,
        estado: a.minutosTardia > 0 ? 'tarde' : 'a_tiempo',
      })),
      horasPorProyecto: Array.from(projectHoursMap.values()).map((p) => ({
        nombre: p.nombre,
        horas: p.horas,
      })),
      solicitudesRecientes: recentRequests.map((s) => ({
        tipo: s.tipoPermiso?.nombre || 'Permiso',
        fechaInicio: s.fechaInicio,
        fechaFin: s.fechaFin,
        estado: s.estado,
      })),
      kpiActual: currentKpi
        ? {
            cumplimientoPct: currentKpi.cumplimientoPct,
            clasificacion: currentKpi.clasificacion,
            tardias: currentKpi.tardias,
            faltas: currentKpi.faltas,
          }
        : null,
      comparacionMesAnterior: Math.round(comparisonPct * 10) / 10,
    };
  }
}
