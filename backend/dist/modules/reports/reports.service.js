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
    async getMonthlyAttendance(mes, anio) {
        const fecha_inicio = new Date(anio, mes - 1, 1);
        const fecha_fin = new Date(anio, mes, 0);
        const asistenciaRaw = await this.dataSource.query(`
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
    `, [fecha_inicio, fecha_fin]);
        const solicitudesRaw = await this.dataSource.query(`
      SELECT 
        sp.empleado_id,
        sp.fecha_inicio,
        sp.fecha_fin,
        sp.estado,
        tp.nombre as tipo_permiso_nombre
      FROM SOLICITUD_PERMISO sp
      INNER JOIN TIPO_PERMISO tp ON sp.tipo_permiso_id = tp.tipo_permiso_id
      WHERE sp.fecha_inicio >= @0 AND sp.fecha_inicio <= @1
    `, [fecha_inicio, fecha_fin]);
        const empleadoMap = {};
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
    async getBonusEligibility(mes, anio) {
        const resultados = await this.dataSource.query(`
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
    `, [mes, anio]);
        return resultados.map((r) => ({
            empleadoId: r.empleado_id,
            nombreCompleto: r.nombreCompleto,
            regla: r.regla_nombre,
            elegible: r.elegible,
            motivoNoElegible: r.motivo_no_elegible,
            fechaCalculo: r.fecha_calculo,
        }));
    }
    async getProjectHours(fecha_inicio, fecha_fin) {
        const registros = await this.dataSource.query(`
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
    `, [fecha_inicio, fecha_fin]);
        const resumen = {};
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
            }
            else {
                resumen[proyectoNombre].empleados[empNombre].horas += horas;
                resumen[proyectoNombre].empleados[empNombre].registros++;
            }
        }
        return Object.values(resumen).map((r) => ({
            proyecto: r.proyecto,
            totalHoras: r.totalHoras,
            empleados: Object.values(r.empleados),
        }));
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