"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const registro_asistencia_entity_1 = require("../../entities/registro-asistencia.entity");
const solicitud_permiso_entity_1 = require("../../entities/solicitud-permiso.entity");
const registro_tiempo_entity_1 = require("../../entities/registro-tiempo.entity");
const kpi_mensual_entity_1 = require("../../entities/kpi-mensual.entity");
const bono_resultado_entity_1 = require("../../entities/bono-resultado.entity");
const empleado_entity_1 = require("../../entities/empleado.entity");
const vacacion_saldo_entity_1 = require("../../entities/vacacion-saldo.entity");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
const typeorm_3 = require("typeorm");
let ReportsService = class ReportsService {
    constructor(asistenciaRepository, solicitudRepository, tiempoRepository, kpiRepository, bonoRepository, empleadoRepository, saldoRepository, auditRepository, dataSource) {
        this.asistenciaRepository = asistenciaRepository;
        this.solicitudRepository = solicitudRepository;
        this.tiempoRepository = tiempoRepository;
        this.kpiRepository = kpiRepository;
        this.bonoRepository = bonoRepository;
        this.empleadoRepository = empleadoRepository;
        this.saldoRepository = saldoRepository;
        this.auditRepository = auditRepository;
        this.dataSource = dataSource;
    }
    async getMonthlyAttendance(fechaInicio, fechaFin, departamento) {
        const fI = `${fechaInicio} 00:00:00`;
        const fF = `${fechaFin} 23:59:59`;
        let query = `
      SELECT e.empleado_id, e.nombres + ' ' + e.apellidos as nombreCompleto, e.departamento,
        ISNULL(stats.diasAsistidos, 0) as diasAsistidos,
        ISNULL(stats.tardias, 0) as tardias,
        ISNULL(stats.horasTotales, 0) as horasTrabajadasTotal
      FROM EMPLEADO e
      LEFT JOIN (
        SELECT ra.empleado_id, COUNT(ra.asistencia_id) as diasAsistidos,
          SUM(CASE WHEN ra.minutos_tardia > 0 THEN 1 ELSE 0 END) as tardias,
          SUM(CAST(ISNULL(ra.horas_trabajadas, 0) AS DECIMAL(10,2))) as horasTotales
        FROM REGISTRO_ASISTENCIA ra
        WHERE ra.fecha >= @0 AND ra.fecha <= @1
        GROUP BY ra.empleado_id
      ) stats ON e.empleado_id = stats.empleado_id
      WHERE e.activo = 1
    `;
        const params = [fI, fF];
        if (departamento && departamento !== 'Todos') {
            query += ` AND (e.departamento = @2 OR REPLACE(e.departamento, '?', 'í') = @2)`;
            params.push(departamento);
        }
        const res = await this.dataSource.query(query + ` ORDER BY e.nombres ASC`, params);
        return res.map(r => ({ ...r, nombreCompleto: this.sanitizeString(r.nombreCompleto), departamento: this.sanitizeString(r.departamento), horasTrabajadasTotal: Number(r.horasTrabajadasTotal).toFixed(1) }));
    }
    async getVacationReport(fechaInicio, fechaFin, departamento, proyecto) {
        const fI = `${fechaInicio} 00:00:00`;
        const fF = `${fechaFin} 23:59:59`;
        let query = `
      SELECT e.nombres + ' ' + e.apellidos as nombreCompleto, e.departamento,
        ISNULL(vs.dias_disponibles, 0) as diasDisponibles,
        (SELECT ISNULL(SUM(vm.dias), 0) FROM VACACION_MOVIMIENTO vm
         WHERE vm.empleado_id = e.empleado_id AND vm.tipo = 'CONSUMO' AND vm.fecha >= @0 AND vm.fecha <= @1) as diasUsados
      FROM EMPLEADO e
      LEFT JOIN VACACION_SALDO vs ON e.empleado_id = vs.empleado_id
      WHERE e.activo = 1
    `;
        const params = [fI, fF];
        let pIdx = 2;
        if (departamento && departamento !== 'Todos') {
            query += ` AND (e.departamento = @${pIdx} OR REPLACE(e.departamento, '?', 'í') = @${pIdx})`;
            pIdx++;
            params.push(departamento);
        }
        if (proyecto && proyecto !== 'Todos los proyectos') {
            query += ` AND e.empleado_id IN (SELECT empleado_id FROM EMPLEADO_PROYECTO ep INNER JOIN PROYECTO p ON ep.proyecto_id = p.proyecto_id WHERE p.nombre = @${pIdx} AND ep.activo = 1)`;
            params.push(proyecto);
        }
        const res = await this.dataSource.query(query + ` ORDER BY e.nombres ASC`, params);
        return res.map(s => ({ ...s, nombreCompleto: this.sanitizeString(s.nombreCompleto), departamento: this.sanitizeString(s.departamento), totalAcumulado: Number(s.diasDisponibles) + Number(s.diasUsados) }));
    }
    async getProjectHours(fechaInicio, fechaFin, departamento, proyectoNombre) {
        const fI = `${fechaInicio} 00:00:00`;
        const fF = `${fechaFin} 23:59:59`;
        let query = `
      SELECT p.nombre as proyectoNombre, p.codigo as proyectoCodigo, ISNULL(e.nombres + ' ' + e.apellidos, '-') as nombreEmpleado,
             e.departamento, ISNULL(stats.horasTotales, 0) as horasTotales
      FROM PROYECTO p
      LEFT JOIN EMPLEADO_PROYECTO ep ON p.proyecto_id = ep.proyecto_id AND ep.activo = 1
      LEFT JOIN EMPLEADO e ON ep.empleado_id = e.empleado_id
      LEFT JOIN (
        SELECT rt.proyecto_id, rt.empleado_id, SUM(CAST(rt.horas AS DECIMAL(10,2))) as horasTotales
        FROM REGISTRO_TIEMPO rt
        WHERE rt.fecha >= @0 AND rt.fecha <= @1 AND rt.estado = 'aprobado'
        GROUP BY rt.proyecto_id, rt.empleado_id
      ) stats ON p.proyecto_id = stats.proyecto_id AND e.empleado_id = stats.empleado_id
      WHERE 1=1
    `;
        const params = [fI, fF];
        let pIdx = 2;
        if (proyectoNombre && proyectoNombre !== 'Todos los proyectos') {
            query += ` AND p.nombre = @${pIdx++}`;
            params.push(proyectoNombre);
        }
        if (departamento && departamento !== 'Todos') {
            query += ` AND (e.departamento = @${pIdx} OR REPLACE(e.departamento, '?', 'í') = @${pIdx})`;
            pIdx++;
            params.push(departamento);
        }
        const res = await this.dataSource.query(query + ` ORDER BY p.nombre ASC, e.nombres ASC`, params);
        return res.map(r => ({ ...r, nombreEmpleado: this.sanitizeString(r.nombreEmpleado), proyectoNombre: this.sanitizeString(r.proyectoNombre) }));
    }
    async getBonusEligibility(mes, anio, departamento) {
        let query = `
      WITH RankedBonos AS (
        SELECT br.empleado_id, br.cumplimiento_pct, br.elegible, br.motivo_no_elegible,
          br.dias_asistidos, br.dias_laborables, br.tardias_count, br.faltas_count, br.horas_count,
          e.nombres + ' ' + e.apellidos as nombreCompleto, e.departamento,
          rb.nombre as regla_nombre, rb.monto as monto_bono,
          ROW_NUMBER() OVER (
            PARTITION BY br.empleado_id
            ORDER BY br.elegible DESC, rb.monto DESC
          ) as rank
        FROM BONO_RESULTADO br
        INNER JOIN EMPLEADO e ON br.empleado_id = e.empleado_id
        LEFT JOIN REGLA_BONO rb ON br.regla_bono_id = rb.regla_bono_id
        WHERE br.mes = @0 AND br.anio = @1
      )
      SELECT * FROM RankedBonos WHERE rank = 1
    `;
        const params = [mes, anio];
        if (departamento && departamento !== 'Todos') {
            query = query.replace('WHERE br.mes = @0 AND br.anio = @1', `WHERE br.mes = @0 AND br.anio = @1 AND (e.departamento = @2 OR REPLACE(e.departamento, '?', 'í') = @2)`);
            params.push(departamento);
        }
        const results = await this.dataSource.query(query, params);
        return results.map((r) => ({
            empleadoId: r.empleado_id,
            nombreCompleto: this.sanitizeString(r.nombreCompleto),
            departamento: this.sanitizeString(r.departamento),
            reglaNombre: this.sanitizeString(r.regla_nombre) || 'Sin Bono',
            elegible: r.elegible,
            monto: Number(r.monto_bono || 0),
            cumplimientoPct: Number(r.cumplimiento_pct || 0),
            motivoNoElegible: this.sanitizeString(r.motivo_no_elegible),
            detalles: { asistencias: r.dias_asistidos || 0, laborables: r.dias_laborables || 0, tardias: r.tardias_count || 0, faltas: r.faltas_count || 0, horas: Number(r.horas_count || 0).toFixed(1) }
        }));
    }
    async getBonusEligibilityByRange(fechaInicio, fechaFin, departamento, proyecto) {
        const fI = `${fechaInicio} 00:00:00`;
        const fF = `${fechaFin} 23:59:59`;
        let query = `
      SELECT e.empleado_id, e.nombres + ' ' + e.apellidos as nombreCompleto, e.departamento,
        br.cumplimiento_pct, br.elegible, rb.nombre as reglaNombre, rb.monto as montoBono
      FROM EMPLEADO e
      LEFT JOIN BONO_RESULTADO br ON e.empleado_id = br.empleado_id AND br.fecha_calculo >= @0 AND br.fecha_calculo <= @1
      LEFT JOIN REGLA_BONO rb ON br.regla_bono_id = rb.regla_bono_id
      WHERE e.activo = 1
    `;
        const params = [fI, fF];
        let pIdx = 2;
        if (departamento && departamento !== 'Todos') {
            query += ` AND (e.departamento = @${pIdx} OR REPLACE(e.departamento, '?', 'í') = @${pIdx})`;
            pIdx++;
            params.push(departamento);
        }
        if (proyecto && proyecto !== 'Todos los proyectos') {
            query += ` AND e.empleado_id IN (SELECT empleado_id FROM EMPLEADO_PROYECTO ep INNER JOIN PROYECTO p ON ep.proyecto_id = p.proyecto_id WHERE p.nombre = @${pIdx} AND ep.activo = 1)`;
            params.push(proyecto);
        }
        const results = await this.dataSource.query(query + ` ORDER BY e.nombres ASC`, params);
        return results.map(r => ({
            empleadoId: r.empleado_id,
            nombreCompleto: this.sanitizeString(r.nombreCompleto),
            departamento: this.sanitizeString(r.departamento),
            reglaNombre: this.sanitizeString(r.reglaNombre) || 'Sin Cálculo',
            elegible: r.elegible || false,
            monto: Number(r.montoBono || 0),
            cumplimientoPct: Number(r.cumplimiento_pct || 0)
        }));
    }
    async getGlobalKpis(mes, anio, departamento, supervisorId) {
        const prevMes = mes === 1 ? 12 : mes - 1;
        const prevAnio = mes === 1 ? anio - 1 : anio;
        let whereClause = `WHERE e.activo = 1`;
        const params = [mes, anio];
        if (departamento && departamento !== 'Todos') {
            whereClause += ` AND (e.departamento = @2 OR REPLACE(e.departamento, '?', 'í') = @2)`;
            params.push(departamento);
        }
        if (supervisorId && supervisorId !== 'Todos') {
            whereClause += ` AND e.supervisor_id = @${params.length}`;
            params.push(supervisorId);
        }
        const summaryQuery = `
      SELECT
        AVG(CAST(ISNULL(br.cumplimiento_pct, 0) AS DECIMAL(10,2))) as avgCompliance,
        SUM(ISNULL(br.tardias_count, 0)) as totalTardies,
        SUM(ISNULL(br.faltas_count, 0)) as totalFaltas,
        COUNT(CASE WHEN br.cumplimiento_pct < 85 THEN 1 END) as employeesAtRisk
      FROM EMPLEADO e
      LEFT JOIN BONO_RESULTADO br ON e.empleado_id = br.empleado_id AND br.mes = @0 AND br.anio = @1
      ${whereClause}
    `;
        const prevSummaryQuery = `
      SELECT
        AVG(CAST(ISNULL(br.cumplimiento_pct, 0) AS DECIMAL(10,2))) as avgCompliance,
        SUM(ISNULL(br.tardias_count, 0)) as totalTardies,
        SUM(ISNULL(br.faltas_count, 0)) as totalFaltas
      FROM EMPLEADO e
      LEFT JOIN BONO_RESULTADO br ON e.empleado_id = br.empleado_id AND br.mes = @0 AND br.anio = @1
      ${whereClause}
    `;
        const deptStatsQuery = `
      SELECT
        ISNULL(e.departamento, 'Sin Área') as name,
        AVG(CAST(ISNULL(br.cumplimiento_pct, 0) AS DECIMAL(10,2))) as kpi
      FROM EMPLEADO e
      LEFT JOIN BONO_RESULTADO br ON e.empleado_id = br.empleado_id AND br.mes = @0 AND br.anio = @1
      WHERE e.activo = 1
      GROUP BY e.departamento
    `;
        const teamStatsQuery = `
      SELECT
        ISNULL(s.nombres + ' ' + s.apellidos, 'Sin Supervisor') as name,
        AVG(CAST(ISNULL(br.cumplimiento_pct, 0) AS DECIMAL(10,2))) as kpi
      FROM EMPLEADO e
      LEFT JOIN EMPLEADO s ON e.supervisor_id = s.empleado_id
      LEFT JOIN BONO_RESULTADO br ON e.empleado_id = br.empleado_id AND br.mes = @0 AND br.anio = @1
      WHERE e.activo = 1
      GROUP BY s.nombres, s.apellidos
    `;
        const distQuery = `
      SELECT
        CASE
          WHEN br.cumplimiento_pct >= 95 THEN 'Excelente'
          WHEN br.cumplimiento_pct >= 85 THEN 'Bueno'
          WHEN br.cumplimiento_pct >= 75 THEN 'Regular'
          ELSE 'Riesgo'
        END as classification,
        COUNT(e.empleado_id) as count
      FROM EMPLEADO e
      LEFT JOIN BONO_RESULTADO br ON e.empleado_id = br.empleado_id AND br.mes = @0 AND br.anio = @1
      ${whereClause}
      GROUP BY
        CASE
          WHEN br.cumplimiento_pct >= 95 THEN 'Excelente'
          WHEN br.cumplimiento_pct >= 85 THEN 'Bueno'
          WHEN br.cumplimiento_pct >= 75 THEN 'Regular'
          ELSE 'Riesgo'
        END
    `;
        const detailQuery = `
      SELECT
        e.empleado_id as id,
        e.nombres + ' ' + e.apellidos as empleado,
        e.departamento as depto,
        ISNULL(br.tardias_count, 0) as tardias,
        ISNULL(br.faltas_count, 0) as faltas,
        ISNULL(br.horas_count, 0) as horas,
        ISNULL(br.cumplimiento_pct, 0) as cumplimiento,
        CASE
          WHEN br.cumplimiento_pct >= 95 THEN 'Excelente'
          WHEN br.cumplimiento_pct >= 85 THEN 'Bueno'
          WHEN br.cumplimiento_pct >= 75 THEN 'Regular'
          ELSE 'Riesgo'
        END as clasificacion
      FROM EMPLEADO e
      LEFT JOIN BONO_RESULTADO br ON e.empleado_id = br.empleado_id AND br.mes = @0 AND br.anio = @1
      ${whereClause}
      ORDER BY br.cumplimiento_pct DESC
    `;
        const [summary, prevSummary, deptStats, teamStats, distStats, detail] = await Promise.all([
            this.dataSource.query(summaryQuery, params),
            this.dataSource.query(prevSummaryQuery, [prevMes, prevAnio, ...(params.slice(2))]),
            this.dataSource.query(deptStatsQuery, [mes, anio]),
            this.dataSource.query(teamStatsQuery, [mes, anio]),
            this.dataSource.query(distQuery, params),
            this.dataSource.query(detailQuery, params)
        ]);
        const s = summary[0] || { avgCompliance: 0, totalTardies: 0, totalFaltas: 0, employeesAtRisk: 0 };
        const ps = prevSummary[0] || { avgCompliance: 0, totalTardies: 0, totalFaltas: 0 };
        return {
            summary: {
                ...s,
                complianceTrend: s.avgCompliance - ps.avgCompliance,
                tardiesTrend: ps.totalTardies > 0 ? ((s.totalTardies - ps.totalTardies) / ps.totalTardies * 100) : 0,
                faltasTrend: ps.totalFaltas > 0 ? ((s.totalFaltas - ps.totalFaltas) / ps.totalFaltas * 100) : 0
            },
            deptStats: deptStats.map(d => ({ ...d, name: this.sanitizeString(d.name) })),
            teamStats: teamStats.map(t => ({ ...t, name: this.sanitizeString(t.name) })),
            distStats,
            detail: detail.map(d => ({
                ...d,
                empleado: this.sanitizeString(d.empleado),
                depto: this.sanitizeString(d.depto),
                cumplimiento: Number(d.cumplimiento || 0).toFixed(1) + '%'
            }))
        };
    }
    async getSupervisors() {
        const results = await this.dataSource.query(`
      SELECT DISTINCT s.empleado_id, s.nombres + ' ' + s.apellidos as nombre
      FROM EMPLEADO e
      INNER JOIN EMPLEADO s ON e.supervisor_id = s.empleado_id
      WHERE e.activo = 1
    `);
        return results.map(r => ({ id: r.empleado_id, nombre: this.sanitizeString(r.nombre) }));
    }
    async getFunctionalAudit(fi, ff, modulo, accion) {
        let query = `
      SELECT
        al.audit_id, al.fecha_hora, u.username as usuario,
        al.modulo, al.accion, al.entidad, al.entidad_id, al.detalle
      FROM AUDIT_LOG al
      LEFT JOIN USUARIO u ON al.usuario_id = u.usuario_id
      WHERE 1=1
    `;
        const params = [];
        if (fi && ff) {
            query += ` AND al.fecha_hora BETWEEN @${params.length} AND @${params.length + 1}`;
            params.push(fi + ' 00:00:00', ff + ' 23:59:59');
        }
        if (modulo && modulo !== 'Todos los módulos') {
            query += ` AND al.modulo = @${params.length}`;
            params.push(modulo);
        }
        if (accion) {
            query += ` AND al.accion LIKE @${params.length}`;
            params.push(`%${accion}%`);
        }
        query += ` ORDER BY al.fecha_hora DESC`;
        return await this.dataSource.query(query, params);
    }
    async getUniqueDepartments() {
        const results = await this.dataSource.query(`SELECT DISTINCT departamento FROM EMPLEADO WHERE activo = 1 AND departamento IS NOT NULL`);
        const sanitized = results.map(r => this.sanitizeString(r.departamento));
        return [...new Set(sanitized)].sort();
    }
    sanitizeString(str) {
        if (!str)
            return '';
        return str.replace(/Rodr\?guez/g, 'Rodríguez').replace(/Mart\?nez/g, 'Martínez').replace(/Fern\?ndez/g, 'Fernández').replace(/Garc\?a/g, 'García').replace(/L\?pez/g, 'López').replace(/Tecnolog\?a/g, 'Tecnología').replace(/Mart\?n/g, 'Martín').replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ã¡/g, 'á');
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(registro_asistencia_entity_1.RegistroAsistencia)),
    __param(1, (0, typeorm_1.InjectRepository)(solicitud_permiso_entity_1.SolicitudPermiso)),
    __param(2, (0, typeorm_1.InjectRepository)(registro_tiempo_entity_1.RegistroTiempo)),
    __param(3, (0, typeorm_1.InjectRepository)(kpi_mensual_entity_1.KpiMensual)),
    __param(4, (0, typeorm_1.InjectRepository)(bono_resultado_entity_1.BonoResultado)),
    __param(5, (0, typeorm_1.InjectRepository)(empleado_entity_1.Empleado)),
    __param(6, (0, typeorm_1.InjectRepository)(vacacion_saldo_entity_1.VacacionSaldo)),
    __param(7, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_3.DataSource])
], ReportsService);
//# sourceMappingURL=reports.service.js.map