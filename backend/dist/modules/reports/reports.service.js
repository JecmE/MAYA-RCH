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
const typeorm_3 = require("typeorm");
let ReportsService = class ReportsService {
    constructor(asistenciaRepository, solicitudRepository, tiempoRepository, kpiRepository, bonoRepository, empleadoRepository, dataSource) {
        this.asistenciaRepository = asistenciaRepository;
        this.solicitudRepository = solicitudRepository;
        this.tiempoRepository = tiempoRepository;
        this.kpiRepository = kpiRepository;
        this.bonoRepository = bonoRepository;
        this.empleadoRepository = empleadoRepository;
        this.dataSource = dataSource;
    }
    async getBonusEligibility(mes, anio) {
        const resultados = await this.dataSource.query(`
      SELECT
        br.empleado_id,
        br.mes,
        br.anio,
        br.elegible,
        br.cumplimiento_pct,
        br.motivo_no_elegible,
        br.fecha_calculo,
        e.nombres + ' ' + e.apellidos as nombreCompleto,
        e.departamento,
        rb.nombre as regla_nombre,
        rb.monto as monto_bono
      FROM BONO_RESULTADO br
      INNER JOIN EMPLEADO e ON br.empleado_id = e.empleado_id
      INNER JOIN REGLA_BONO rb ON br.regla_bono_id = rb.regla_bono_id
      WHERE br.mes = @0 AND br.anio = @1
    `, [mes, anio]);
        return resultados.map((r) => ({
            empleadoId: r.empleado_id,
            nombreCompleto: this.sanitizeString(r.nombreCompleto),
            departamento: this.sanitizeString(r.departamento),
            reglaNombre: this.sanitizeString(r.regla_nombre),
            elegible: r.elegible,
            monto: r.monto_bono,
            cumplimientoPct: r.cumplimiento_pct,
            motivoNoElegible: this.sanitizeString(r.motivo_no_elegible),
            fechaCalculo: r.fecha_calculo,
        }));
    }
    sanitizeString(str) {
        if (!str)
            return '';
        return str
            .replace(/Rodr\?guez/g, 'Rodríguez')
            .replace(/Mart\?nez/g, 'Martínez')
            .replace(/Fern\?ndez/g, 'Fernández')
            .replace(/Garc\?a/g, 'García')
            .replace(/L\?pez/g, 'López')
            .replace(/Tecnolog\?a/g, 'Tecnología')
            .replace(/Mart\?n/g, 'Martín')
            .replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ã¡/g, 'á')
            .replace(/Ã©/g, 'é').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ');
    }
    async getMonthlyAttendance(mes, anio) {
        const fechaInicio = new Date(anio, mes - 1, 1);
        const fechaFin = new Date(anio, mes, 0);
        return await this.dataSource.query(`SELECT ra.*, e.nombres FROM REGISTRO_ASISTENCIA ra INNER JOIN EMPLEADO e ON ra.empleado_id = e.empleado_id WHERE ra.fecha >= @0 AND ra.fecha <= @1`, [fechaInicio, fechaFin]);
    }
    async getProjectHours(fechaInicio, fechaFin) {
        return await this.dataSource.query(`SELECT rt.*, p.nombre as proyecto FROM REGISTRO_TIEMPO rt INNER JOIN PROYECTO p ON rt.proyecto_id = p.proyecto_id WHERE rt.fecha >= @0 AND rt.fecha <= @1`, [fechaInicio, fechaFin]);
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
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_3.DataSource])
], ReportsService);
//# sourceMappingURL=reports.service.js.map