import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { SolicitudPermiso } from '../../entities/solicitud-permiso.entity';
import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { KpiMensual } from '../../entities/kpi-mensual.entity';
import { BonoResultado } from '../../entities/bono-resultado.entity';
import { Empleado } from '../../entities/empleado.entity';
import { VacacionSaldo } from '../../entities/vacacion-saldo.entity';
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
    @InjectRepository(VacacionSaldo)
    private saldoRepository: Repository<VacacionSaldo>,
    private dataSource: DataSource,
  ) {}

  async getMonthlyAttendance(fechaInicio: string, fechaFin: string, departamento?: string) {
    const fI = `${fechaInicio} 00:00:00`;
    const fF = `${fechaFin} 23:59:59`;
    let query = `
      SELECT
        e.empleado_id, e.nombres + ' ' + e.apellidos as nombreCompleto, e.departamento,
        ISNULL(stats.diasAsistidos, 0) as diasAsistidos,
        ISNULL(stats.tardias, 0) as tardias,
        ISNULL(stats.horasTotales, 0) as horasTrabajadasTotal
      FROM EMPLEADO e
      LEFT JOIN (
        SELECT
          ra.empleado_id,
          COUNT(ra.asistencia_id) as diasAsistidos,
          SUM(CASE WHEN ra.minutos_tardia > 0 THEN 1 ELSE 0 END) as tardias,
          SUM(CAST(ISNULL(ra.horas_trabajadas, 0) AS DECIMAL(10,2))) as horasTotales
        FROM REGISTRO_ASISTENCIA ra
        WHERE ra.fecha >= @0 AND ra.fecha <= @1
        GROUP BY ra.empleado_id
      ) stats ON e.empleado_id = stats.empleado_id
      WHERE e.activo = 1
    `;
    const params: any[] = [fI, fF];
    if (departamento && departamento !== 'Todos') { query += ` AND (e.departamento = @2 OR REPLACE(e.departamento, '?', 'í') = @2)`; params.push(departamento); }
    const results = await this.dataSource.query(query + ` ORDER BY e.nombres ASC`, params);
    return results.map(r => ({ ...r, nombreCompleto: this.sanitizeString(r.nombreCompleto), departamento: this.sanitizeString(r.departamento), horasTrabajadasTotal: Number(r.horasTrabajadasTotal).toFixed(1) }));
  }

  async getUniqueDepartments() {
    const results = await this.dataSource.query(`SELECT DISTINCT departamento FROM EMPLEADO WHERE activo = 1 AND departamento IS NOT NULL`);
    const sanitized = results.map(r => this.sanitizeString(r.departamento));
    return [...new Set(sanitized)].sort();
  }

  async getBonusEligibility(mes: number, anio: number, departamento?: string) {
    let query = `SELECT br.cumplimiento_pct, br.elegible, br.motivo_no_elegible, e.nombres + ' ' + e.apellidos as nombreCompleto, e.departamento, rb.nombre as regla_nombre, rb.monto as monto_bono
      FROM BONO_RESULTADO br INNER JOIN EMPLEADO e ON br.empleado_id = e.empleado_id LEFT JOIN REGLA_BONO rb ON br.regla_bono_id = rb.regla_bono_id WHERE br.mes = @0 AND br.anio = @1`;
    const params: any[] = [mes, anio];
    if (departamento && departamento !== 'Todos') { query += ` AND (e.departamento = @2 OR REPLACE(e.departamento, '?', 'í') = @2)`; params.push(departamento); }
    const res = await this.dataSource.query(query, params);
    return res.map(r => ({ ...r, nombreCompleto: this.sanitizeString(r.nombreCompleto), departamento: this.sanitizeString(r.departamento), reglaNombre: this.sanitizeString(r.regla_nombre) || 'Sin Bono' }));
  }

  async getProjectHours(fechaInicio: string, fechaFin: string, departamento?: string, proyectoNombre?: string) {
    const fI = `${fechaInicio} 00:00:00`; const fF = `${fechaFin} 23:59:59`;
    let query = `SELECT p.nombre as proyectoNombre, p.codigo as proyectoCodigo, e.nombres + ' ' + e.apellidos as nombreEmpleado, e.departamento, SUM(CAST(ISNULL(rt.horas, 0) AS DECIMAL(10,2))) as horasTotales
      FROM REGISTRO_TIEMPO rt INNER JOIN PROYECTO p ON rt.proyecto_id = p.proyecto_id INNER JOIN EMPLEADO e ON rt.empleado_id = e.empleado_id WHERE rt.fecha >= @0 AND rt.fecha <= @1 AND rt.estado = 'aprobado'`;
    const params: any[] = [fI, fF]; let pIdx = 2;
    if (departamento && departamento !== 'Todos') { query += ` AND (e.departamento = @${pIdx} OR REPLACE(e.departamento, '?', 'í') = @${pIdx})`; pIdx++; params.push(departamento); }
    if (proyectoNombre && proyectoNombre !== 'Todos los proyectos') { query += ` AND p.nombre = @${pIdx++}`; params.push(proyectoNombre); }
    const res = await this.dataSource.query(query + ` GROUP BY p.nombre, p.codigo, e.nombres, e.apellidos, e.departamento ORDER BY p.nombre ASC`, params);
    return res.map(r => ({ ...r, nombreEmpleado: this.sanitizeString(r.nombreEmpleado), proyectoNombre: this.sanitizeString(r.proyectoNombre) }));
  }

  async getVacationReport(fechaInicio: string, fechaFin: string, departamento?: string) {
    const fI = `${fechaInicio} 00:00:00`;
    const fF = `${fechaFin} 23:59:59`;

    let query = `
      SELECT
        e.nombres + ' ' + e.apellidos as nombreCompleto,
        e.departamento,
        ISNULL(vs.dias_disponibles, 0) as diasDisponibles,
        (SELECT ISNULL(SUM(vm.dias), 0) FROM VACACION_MOVIMIENTO vm
         WHERE vm.empleado_id = e.empleado_id
         AND vm.tipo = 'CONSUMO'
         AND vm.fecha >= @0 AND vm.fecha <= @1) as diasUsados
      FROM EMPLEADO e
      LEFT JOIN VACACION_SALDO vs ON e.empleado_id = vs.empleado_id
      WHERE e.activo = 1
    `;

    const params: any[] = [fI, fF];
    if (departamento && departamento !== 'Todos') {
      query += ` AND (e.departamento = @2 OR REPLACE(e.departamento, '?', 'í') = @2)`;
      params.push(departamento);
    }

    const res = await this.dataSource.query(query + ` ORDER BY e.nombres ASC`, params);
    return res.map(s => ({
      nombreCompleto: this.sanitizeString(s.nombreCompleto),
      departamento: this.sanitizeString(s.departamento),
      diasDisponibles: s.diasDisponibles,
      diasUsados: s.diasUsados,
      totalAcumulado: Number(s.diasDisponibles) + Number(s.diasUsados)
    }));
  }

  private sanitizeString(str: string | null | undefined): string {
    if (!str) return '';
    return str.replace(/Rodr\?guez/g, 'Rodríguez').replace(/Mart\?nez/g, 'Martínez').replace(/Fern\?ndez/g, 'Fernández').replace(/Garc\?a/g, 'García').replace(/L\?pez/g, 'López').replace(/Tecnolog\?a/g, 'Tecnología').replace(/Mart\?n/g, 'Martín').replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ã¡/g, 'á');
  }
}
