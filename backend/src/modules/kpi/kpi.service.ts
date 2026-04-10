import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { KpiMensual } from '../../entities/kpi-mensual.entity';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { Empleado } from '../../entities/empleado.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class KpiService {
  constructor(
    @InjectRepository(KpiMensual)
    private kpiRepository: Repository<KpiMensual>,
    @InjectRepository(RegistroAsistencia)
    private asistenciaRepository: Repository<RegistroAsistencia>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
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

    return {
      mes,
      anio: year,
      cantidadEmpleados: equipoRaw.length,
      resumen: {
        totalDiasTrabajados: kpis.reduce((sum, k) => sum + k.diasTrabajados, 0),
        totalTardias: kpis.reduce((sum, k) => sum + k.tardias, 0),
        promedioCumplimiento:
          kpis.length > 0
            ? kpis.reduce((sum, k) => sum + Number(k.cumplimientoPct), 0) / kpis.length
            : 0,
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

    return {
      clasificacion: kpi.clasificacion,
      cumplimientoPct: kpi.cumplimientoPct,
      tardias: kpi.tardias,
      faltas: kpi.faltas,
    };
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
}
