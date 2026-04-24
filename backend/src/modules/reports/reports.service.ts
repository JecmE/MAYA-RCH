import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { SolicitudPermiso } from '../../entities/solicitud-permiso.entity';
import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { KpiMensual } from '../../entities/kpi-mensual.entity';
import { BonoResultado } from '../../entities/bono-resultado.entity';
import { Empleado } from '../../entities/empleado.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(RegistroAsistencia)
    private asistenciaRepository: Repository<RegistroAsistencia>,
    @InjectRepository(SolicitudPermiso)
    private solicitudRepository: Repository<SolicitudPermiso>,
    @InjectRepository(RegistroTiempo)
    private tiempoRepository: Repository<RegistroTiempo>,
    @InjectRepository(KpiMensual)
    private kpiRepository: Repository<KpiMensual>,
    @InjectRepository(BonoResultado)
    private bonoRepository: Repository<BonoResultado>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
    private dataSource: DataSource,
  ) {}

  async getMonthlyAttendance(mes: number, anio: number) {
    const fecha_inicio = new Date(anio, mes - 1, 1);
    const fecha_fin = new Date(anio, mes, 0);

    const asistenciaRaw = await this.dataSource.query(
      `
      SELECT 
        ra.empleado_id,
        ra.fecha,
        ra.estado_jornada,
        ra.minutos_tardia,
        ra.horas_trabajadas,
        e.nombres + ' ' + e.apellidos as nombreCompleto,
        e.codigo_empleado
      FROM REGISTRO_ASISTENCIA ra
      INNER JOIN EMPLEADO e ON ra.empleado_id = e.empleado_id
      WHERE ra.fecha >= @0 AND ra.fecha <= @1
    `,
      [fecha_inicio, fecha_fin],
    );

    const solicitudesRaw = await this.dataSource.query(
      `
      SELECT 
        sp.empleado_id,
        sp.fecha_inicio,
        sp.fecha_fin,
        sp.estado,
        tp.nombre as tipo_permiso_nombre
      FROM SOLICITUD_PERMISO sp
      INNER JOIN TIPO_PERMISO tp ON sp.tipo_permiso_id = tp.tipo_permiso_id
      WHERE sp.fecha_inicio >= @0 AND sp.fecha_inicio <= @1
    `,
      [fecha_inicio, fecha_fin],
    );

    const empleadoMap: any = {};

    for (const a of asistenciaRaw) {
      const empId = a.empleado_id;
      if (!empleadoMap[empId]) {
        empleadoMap[empId] = {
          empleado: {
            empleadoId: empId,
            nombreCompleto: a.nombreCompleto,
            codigoEmpleado: a.codigo_empleado,
          },
          diasLaborables: 0,
          diasTrabajados: 0,
          totalTardias: 0,
          horasTrabajadas: 0,
          permisos: [],
        };
      }

      empleadoMap[empId].diasLaborables++;
      if (a.estado_jornada !== 'pendiente') {
        empleadoMap[empId].diasTrabajados++;
      }
      empleadoMap[empId].totalTardias += a.minutos_tardia || 0;
      empleadoMap[empId].horasTrabajadas += Number(a.horas_trabajadas || 0);
    }

    for (const s of solicitudesRaw) {
      const empId = s.empleado_id;
      if (!empleadoMap[empId]) {
        continue;
      }

      if (s.estado === 'aprobado') {
        empleadoMap[empId].permisos.push({
          tipo: s.tipo_permiso_nombre,
          fecha_inicio: s.fecha_inicio,
          fecha_fin: s.fecha_fin,
          estado: s.estado,
        });
      }
    }

    return Object.values(empleadoMap);
  }

  async getBonusEligibility(mes: number, anio: number) {
    const resultados = await this.dataSource.query(
      `
      SELECT 
        br.empleado_id,
        br.mes,
        br.anio,
        br.elegible,
        br.motivo_no_elegible,
        br.fecha_calculo,
        e.nombres + ' ' + e.apellidos as nombreCompleto,
        rb.nombre as regla_nombre
      FROM BONO_RESULTADO br
      INNER JOIN EMPLEADO e ON br.empleado_id = e.empleado_id
      INNER JOIN REGLA_BONO rb ON br.regla_bono_id = rb.regla_bono_id
      WHERE br.mes = @0 AND br.anio = @1
    `,
      [mes, anio],
    );

    return resultados.map((r) => ({
      empleadoId: r.empleado_id,
      nombreCompleto: r.nombreCompleto,
      regla: r.regla_nombre,
      elegible: r.elegible,
      motivoNoElegible: r.motivo_no_elegible,
      fechaCalculo: r.fecha_calculo,
    }));
  }

  async getProjectHours(fecha_inicio: string, fecha_fin: string) {
    const registros = await this.dataSource.query(
      `
      SELECT 
        rt.empleado_id,
        rt.proyecto_id,
        rt.fecha,
        rt.horas,
        rt.horas_validadas,
        rt.estado,
        e.nombres + ' ' + e.apellidos as nombreEmpleado,
        p.nombre as proyecto_nombre,
        p.codigo as proyecto_codigo
      FROM REGISTRO_TIEMPO rt
      INNER JOIN EMPLEADO e ON rt.empleado_id = e.empleado_id
      INNER JOIN PROYECTO p ON rt.proyecto_id = p.proyecto_id
      WHERE rt.estado = 'aprobado'
        AND rt.fecha >= @0 AND rt.fecha <= @1
    `,
      [fecha_inicio, fecha_fin],
    );

    const resumen: any = {};

    for (const r of registros) {
      const proyectoNombre = r.proyecto_nombre || 'Sin proyecto';
      const empNombre = r.nombreEmpleado || 'Desconocido';

      if (!resumen[proyectoNombre]) {
        resumen[proyectoNombre] = {
          proyecto: {
            id: r.proyecto_id,
            nombre: proyectoNombre,
            codigo: r.proyecto_codigo,
          },
          totalHoras: 0,
          empleados: {},
        };
      }

      const horas = Number(r.horas_validadas || r.horas);
      resumen[proyectoNombre].totalHoras += horas;

      if (!resumen[proyectoNombre].empleados[empNombre]) {
        resumen[proyectoNombre].empleados[empNombre] = {
          nombre: empNombre,
          horas,
          registros: 0,
        };
      } else {
        resumen[proyectoNombre].empleados[empNombre].horas += horas;
        resumen[proyectoNombre].empleados[empNombre].registros++;
      }
    }

    return Object.values(resumen).map((r: any) => ({
      proyecto: r.proyecto,
      totalHoras: r.totalHoras,
      empleados: Object.values(r.empleados),
    }));
  }
}
