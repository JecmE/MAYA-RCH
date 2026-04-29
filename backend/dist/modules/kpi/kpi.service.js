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
exports.KpiService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const kpi_mensual_entity_1 = require("../../entities/kpi-mensual.entity");
const registro_asistencia_entity_1 = require("../../entities/registro-asistencia.entity");
const empleado_entity_1 = require("../../entities/empleado.entity");
const typeorm_3 = require("typeorm");
const solicitud_permiso_entity_1 = require("../../entities/solicitud-permiso.entity");
const registro_tiempo_entity_1 = require("../../entities/registro-tiempo.entity");
const proyecto_entity_1 = require("../../entities/proyecto.entity");
const parametro_sistema_entity_1 = require("../../entities/parametro-sistema.entity");
let KpiService = class KpiService {
    constructor(kpiRepository, asistenciaRepository, empleadoRepository, solicitudPermisoRepository, registroTiempoRepository, proyectoRepository, parametroRepository, dataSource) {
        this.kpiRepository = kpiRepository;
        this.asistenciaRepository = asistenciaRepository;
        this.empleadoRepository = empleadoRepository;
        this.solicitudPermisoRepository = solicitudPermisoRepository;
        this.registroTiempoRepository = registroTiempoRepository;
        this.proyectoRepository = proyectoRepository;
        this.parametroRepository = parametroRepository;
        this.dataSource = dataSource;
    }
    sanitizeString(str) {
        if (!str)
            return '';
        return str.replace(/Rodr\?guez/g, 'Rodríguez').replace(/Garc\?a/g, 'García').replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ã¡/g, 'á');
    }
    async getEmployeeDashboard(empleadoId, mes, anio) {
        const now = new Date();
        const month = mes || now.getMonth() + 1;
        const year = anio || now.getFullYear();
        let kpi = await this.kpiRepository.findOne({ where: { empleadoId, mes: month, anio: year } });
        if (!kpi || (month === now.getMonth() + 1 && year === now.getFullYear())) {
            kpi = await this.calculateKpi(empleadoId, month, year);
        }
        return {
            mes: month, anio: year,
            diasEsperados: kpi.diasEsperados, diasTrabajados: kpi.diasTrabajados,
            tardias: kpi.tardias, faltas: kpi.faltas,
            horasEsperadas: kpi.horasEsperadas, horasTrabajadas: kpi.horasTrabajadas,
            cumplimientoPct: kpi.cumplimientoPct, clasificacion: kpi.clasificacion,
            observacion: kpi.observacion,
        };
    }
    async getKpiThresholds() {
        const params = await this.parametroRepository.find({
            where: { clave: (0, typeorm_2.In)(['kpi_excelente', 'kpi_bueno', 'kpi_regular', 'max_tardias']), activo: true }
        });
        const map = new Map(params.map(p => [p.clave, p.valor]));
        return {
            excelente: Number(map.get('kpi_excelente') || 95),
            bueno: Number(map.get('kpi_bueno') || 80),
            regular: Number(map.get('kpi_regular') || 65),
            maxTardias: Number(map.get('max_tardias') || 4)
        };
    }
    async calculateKpi(empleadoId, mes, anio) {
        const thresholds = await this.getKpiThresholds();
        const fechaInicio = new Date(anio, mes - 1, 1);
        const fechaFin = new Date(anio, mes, 0);
        const hoy = new Date();
        const fechaCorte = (hoy.getMonth() + 1 === mes && hoy.getFullYear() === anio) ? hoy : fechaFin;
        const empleadoTurno = await this.dataSource.getRepository('EMPLEADO_TURNO').findOne({
            where: { empleadoId, activo: true }, relations: ['turno'], order: { fechaInicio: 'DESC' }
        });
        const diasLaborales = empleadoTurno?.turno?.dias?.split(',') || ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
        const horasPorDia = Number(empleadoTurno?.turno?.horasEsperadasDia) || 8;
        const diasSemanaMap = { 1: 'Lun', 2: 'Mar', 3: 'Mie', 4: 'Jue', 5: 'Vie', 6: 'Sab', 0: 'Dom' };
        let diasEsperados = 0;
        const temp = new Date(fechaInicio);
        while (temp <= fechaCorte) {
            if (diasLaborales.includes(diasSemanaMap[temp.getDay()]))
                diasEsperados++;
            temp.setDate(temp.getDate() + 1);
        }
        const horasEsperadas = diasEsperados * horasPorDia;
        const asistencias = await this.asistenciaRepository.find({ where: { empleadoId, fecha: (0, typeorm_2.Between)(fechaInicio, fechaCorte) } });
        const diasTrabajados = asistencias.filter(a => a.horaEntradaReal !== null).length;
        const tardias = asistencias.reduce((sum, a) => sum + (a.minutosTardia > 0 ? 1 : 0), 0);
        const horasTrabajadas = asistencias.reduce((sum, a) => sum + Number(a.horasTrabajadas || 0), 0);
        const cumplimientoPct = horasEsperadas > 0 ? (horasTrabajadas / horasEsperadas) * 100 : 0;
        let clasificacion = 'En Riesgo';
        const faltas = Math.max(0, diasEsperados - diasTrabajados);
        if (faltas > 0 || tardias > thresholds.maxTardias) {
            clasificacion = 'En Riesgo';
        }
        else if (cumplimientoPct >= thresholds.excelente) {
            clasificacion = 'Excelente';
        }
        else if (cumplimientoPct >= thresholds.bueno) {
            clasificacion = 'Bueno';
        }
        else if (cumplimientoPct >= thresholds.regular) {
            clasificacion = 'Regular';
        }
        else {
            clasificacion = 'En Riesgo';
        }
        let kpi = await this.kpiRepository.findOne({ where: { empleadoId, mes, anio } });
        const data = {
            empleadoId, anio, mes, diasEsperados, diasTrabajados, tardias, faltas,
            horasEsperadas, horasTrabajadas, cumplimientoPct: Math.round(cumplimientoPct * 100) / 100,
            clasificacion, fechaCalculo: new Date()
        };
        if (kpi)
            Object.assign(kpi, data);
        else
            kpi = this.kpiRepository.create(data);
        return this.kpiRepository.save(kpi);
    }
    async globalRecalculateCurrentMonth() {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const empleados = await this.empleadoRepository.find({ where: { activo: true } });
        for (const emp of empleados) {
            await this.calculateKpi(emp.empleadoId, month, year);
        }
    }
    async getSupervisorDashboard(supervisorEmpleadoId, mes, anio) {
        const now = new Date();
        const month = mes || now.getMonth() + 1;
        const year = anio || now.getFullYear();
        const equipo = await this.empleadoRepository.find({ where: { supervisorId: supervisorEmpleadoId, activo: true } });
        if (equipo.length === 0)
            return { mes: month, anio: year, cantidadEmpleados: 0, resumen: { totalDiasTrabajados: 0, totalTardias: 0, promedioCumplimiento: 0 }, empleados: [] };
        const ids = equipo.map(e => e.empleadoId);
        const kpis = await this.kpiRepository.find({ where: { empleadoId: (0, typeorm_2.In)(ids), mes: month, anio: year } });
        return {
            mes: month, anio: year, cantidadEmpleados: equipo.length,
            resumen: {
                totalDiasTrabajados: kpis.reduce((sum, k) => sum + k.diasTrabajados, 0),
                totalTardias: kpis.reduce((sum, k) => sum + k.tardias, 0),
                promedioCumplimiento: kpis.length > 0 ? kpis.reduce((sum, k) => sum + Number(k.cumplimientoPct), 0) / kpis.length : 0
            },
            empleados: equipo.map(e => {
                const k = kpis.find(x => x.empleadoId === e.empleadoId);
                return { empleadoId: e.empleadoId, nombreCompleto: this.sanitizeString(`${e.nombres} ${e.apellidos}`), diasEsperados: k?.diasEsperados || 0, cumplimientoPct: k?.cumplimientoPct || 0, clasificacion: k?.clasificacion || 'Sin datos' };
            }),
        };
    }
    async getHrDashboard(mes, anio) {
        const month = mes || new Date().getMonth() + 1;
        const year = anio || new Date().getFullYear();
        const kpis = await this.kpiRepository.find({ where: { mes: month, anio: year } });
        return {
            mes: month, anio: year, totalEmpleados: kpis.length,
            promedioCumplimiento: kpis.length > 0 ? kpis.reduce((sum, k) => sum + Number(k.cumplimientoPct), 0) / kpis.length : 0,
            totalTardias: kpis.reduce((sum, k) => sum + k.tardias, 0),
            totalFaltas: kpis.reduce((sum, k) => sum + k.faltas, 0),
            clasificaciones: {
                Excelente: kpis.filter(k => k.clasificacion === 'Excelente').length,
                Bueno: kpis.filter(k => k.clasificacion === 'Bueno').length,
                Regular: kpis.filter(k => k.clasificacion === 'Regular').length,
                'En Riesgo': kpis.filter(k => k.clasificacion === 'En Riesgo').length
            },
        };
    }
    async getEmployeeClassification(empleadoId, mes, anio) {
        const month = mes || new Date().getMonth() + 1;
        const year = anio || new Date().getFullYear();
        const kpi = await this.calculateKpi(empleadoId, month, year);
        return [{ empleadoId, clasificacion: kpi.clasificacion, cumplimientoPct: kpi.cumplimientoPct }];
    }
    async refreshEmployeeKpi(empleadoId, mes, anio) {
        const month = mes || new Date().getMonth() + 1;
        const year = anio || new Date().getFullYear();
        return this.calculateKpi(empleadoId, month, year);
    }
    async getEmployeeProfile(empleadoId) {
        const empleado = await this.empleadoRepository.findOne({ where: { empleadoId } });
        if (!empleado)
            return null;
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const currentKpi = await this.kpiRepository.findOne({ where: { empleadoId, mes: currentMonth, anio: currentYear } });
        return {
            empleado: { nombreCompleto: this.sanitizeString(`${empleado.nombres} ${empleado.apellidos}`), puesto: this.sanitizeString(empleado.puesto), departamento: this.sanitizeString(empleado.departamento), email: empleado.email },
            kpiActual: currentKpi ? { cumplimientoPct: currentKpi.cumplimientoPct, clasificacion: currentKpi.clasificacion, tardias: currentKpi.tardias, faltas: currentKpi.faltas } : null,
        };
    }
    async saveObservation(empleadoId, mes, anio, observacion) {
        const kpi = await this.kpiRepository.findOne({ where: { empleadoId, mes, anio } });
        if (!kpi)
            throw new common_1.NotFoundException('Sin KPI calculado');
        kpi.observacion = observacion;
        return this.kpiRepository.save(kpi);
    }
};
exports.KpiService = KpiService;
exports.KpiService = KpiService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kpi_mensual_entity_1.KpiMensual)),
    __param(1, (0, typeorm_1.InjectRepository)(registro_asistencia_entity_1.RegistroAsistencia)),
    __param(2, (0, typeorm_1.InjectRepository)(empleado_entity_1.Empleado)),
    __param(3, (0, typeorm_1.InjectRepository)(solicitud_permiso_entity_1.SolicitudPermiso)),
    __param(4, (0, typeorm_1.InjectRepository)(registro_tiempo_entity_1.RegistroTiempo)),
    __param(5, (0, typeorm_1.InjectRepository)(proyecto_entity_1.Proyecto)),
    __param(6, (0, typeorm_1.InjectRepository)(parametro_sistema_entity_1.ParametroSistema)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_3.DataSource])
], KpiService);
//# sourceMappingURL=kpi.service.js.map