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
const typeorm_3 = require("typeorm");
let ReportsService = class ReportsService {
    constructor(asistenciaRepository, solicitudRepository, tiempoRepository, kpiRepository, bonoRepository, empleadoRepository, saldoRepository, dataSource) {
        this.asistenciaRepository = asistenciaRepository;
        this.solicitudRepository = solicitudRepository;
        this.tiempoRepository = tiempoRepository;
        this.kpiRepository = kpiRepository;
        this.bonoRepository = bonoRepository;
        this.empleadoRepository = empleadoRepository;
        this.saldoRepository = saldoRepository;
        this.dataSource = dataSource;
    }
    async getMonthlyAttendance(fechaInicio, fechaFin, departamento) {
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
        const params = [fI, fF];
        if (departamento && departamento !== 'Todos') {
            query += ` AND (e.departamento = @2 OR REPLACE(e.departamento, '?', 'í') = @2)`;
            params.push(departamento);
        }
        const results = await this.dataSource.query(query + ` ORDER BY e.nombres ASC`, params);
        return results.map(r => ({ ...r, nombreCompleto: this.sanitizeString(r.nombreCompleto), departamento: this.sanitizeString(r.departamento), horasTrabajadasTotal: Number(r.horasTrabajadasTotal).toFixed(1) }));
    }
    async getUniqueDepartments() {
        const results = await this.dataSource.query(`SELECT DISTINCT departamento FROM EMPLEADO WHERE activo = 1 AND departamento IS NOT NULL`);
        const sanitized = results.map(r => this.sanitizeString(r.departamento));
        return [...new Set(sanitized)].sort();
    }
    async getBonusEligibility(mes, anio, departamento) {
        let query = `SELECT br.cumplimiento_pct, br.elegible, br.motivo_no_elegible, e.nombres + ' ' + e.apellidos as nombreCompleto, e.departamento, rb.nombre as regla_nombre, rb.monto as monto_bono
      FROM BONO_RESULTADO br INNER JOIN EMPLEADO e ON br.empleado_id = e.empleado_id LEFT JOIN REGLA_BONO rb ON br.regla_bono_id = rb.regla_bono_id WHERE br.mes = @0 AND br.anio = @1`;
        const params = [mes, anio];
        if (departamento && departamento !== 'Todos') {
            query += ` AND (e.departamento = @2 OR REPLACE(e.departamento, '?', 'í') = @2)`;
            params.push(departamento);
        }
        const res = await this.dataSource.query(query, params);
        return res.map(r => ({ ...r, nombreCompleto: this.sanitizeString(r.nombreCompleto), departamento: this.sanitizeString(r.departamento), reglaNombre: this.sanitizeString(r.regla_nombre) || 'Sin Bono' }));
    }
    async getProjectHours(fechaInicio, fechaFin, departamento, proyectoNombre) {
        const fI = `${fechaInicio} 00:00:00`;
        const fF = `${fechaFin} 23:59:59`;
        let query = `SELECT p.nombre as proyectoNombre, p.codigo as proyectoCodigo, e.nombres + ' ' + e.apellidos as nombreEmpleado, e.departamento, SUM(CAST(ISNULL(rt.horas, 0) AS DECIMAL(10,2))) as horasTotales
      FROM REGISTRO_TIEMPO rt INNER JOIN PROYECTO p ON rt.proyecto_id = p.proyecto_id INNER JOIN EMPLEADO e ON rt.empleado_id = e.empleado_id WHERE rt.fecha >= @0 AND rt.fecha <= @1 AND rt.estado = 'aprobado'`;
        const params = [fI, fF];
        let pIdx = 2;
        if (departamento && departamento !== 'Todos') {
            query += ` AND (e.departamento = @${pIdx} OR REPLACE(e.departamento, '?', 'í') = @${pIdx})`;
            pIdx++;
            params.push(departamento);
        }
        if (proyectoNombre && proyectoNombre !== 'Todos los proyectos') {
            query += ` AND p.nombre = @${pIdx++}`;
            params.push(proyectoNombre);
        }
        const res = await this.dataSource.query(query + ` GROUP BY p.nombre, p.codigo, e.nombres, e.apellidos, e.departamento ORDER BY p.nombre ASC`, params);
        return res.map(r => ({ ...r, nombreEmpleado: this.sanitizeString(r.nombreEmpleado), proyectoNombre: this.sanitizeString(r.proyectoNombre) }));
    }
    async getVacationReport(fechaInicio, fechaFin, departamento) {
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
        const params = [fI, fF];
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
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_3.DataSource])
], ReportsService);
//# sourceMappingURL=reports.service.js.map