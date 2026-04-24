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
let KpiService = class KpiService {
    constructor(kpiRepository, asistenciaRepository, empleadoRepository, solicitudPermisoRepository, registroTiempoRepository, proyectoRepository, dataSource) {
        this.kpiRepository = kpiRepository;
        this.asistenciaRepository = asistenciaRepository;
        this.empleadoRepository = empleadoRepository;
        this.solicitudPermisoRepository = solicitudPermisoRepository;
        this.registroTiempoRepository = registroTiempoRepository;
        this.proyectoRepository = proyectoRepository;
        this.dataSource = dataSource;
    }
    sanitizeString(str) {
        if (!str)
            return '';
        return str
            .replace(/\?/g, (match, offset, original) => {
            if (original.includes('Tecnolog'))
                return 'í';
            if (original.includes('Garc'))
                return 'í';
            if (original.includes('Rodr'))
                return 'í';
            if (original.includes('Mart'))
                return 'í';
            return 'í';
        })
            .replace(/Ã­/g, 'í')
            .replace(/Ã³/g, 'ó')
            .replace(/Ã¡/g, 'á')
            .replace(/Ã©/g, 'é')
            .replace(/Ãº/g, 'ú')
            .replace(/Ã±/g, 'ñ');
    }
    async getEmployeeDashboard(empleadoId, mes, anio) {
        const now = new Date();
        const month = mes || now.getMonth() + 1;
        const year = anio || now.getFullYear();
        let kpi = await this.kpiRepository.findOne({
            where: { empleadoId, mes: month, anio: year },
        });
        if (!kpi || (month === now.getMonth() + 1 && year === now.getFullYear())) {
            kpi = await this.calculateKpi(empleadoId, month, year);
        }
        return {
            mes: month,
            anio: year,
            diasEsperados: kpi.diasEsperados,
            diasTrabajados: kpi.diasTrabajados,
            tardias: kpi.tardias,
            faltas: kpi.faltas,
            horasEsperadas: kpi.horasEsperadas,
            horasTrabajadas: kpi.horasTrabajadas,
            cumplimientoPct: kpi.cumplimientoPct,
            clasificacion: kpi.clasificacion,
            observacion: kpi.observacion,
        };
    }
    async getSupervisorDashboard(supervisorEmpleadoId, mes, anio) {
        const now = new Date();
        const month = mes || now.getMonth() + 1;
        const year = anio || now.getFullYear();
        const equipoRaw = await this.dataSource.query(`SELECT empleado_id, nombres, apellidos, codigo_empleado FROM EMPLEADO WHERE supervisor_id = @0 AND activo = 1`, [supervisorEmpleadoId]);
        if (equipoRaw.length === 0) {
            return {
                mes: month,
                anio: year,
                cantidadEmpleados: 0,
                resumen: {
                    totalDiasTrabajados: 0,
                    totalTardias: 0,
                    promedioCumplimiento: 0,
                    comparacionMesAnterior: 0
                },
                empleados: [],
            };
        }
        const empleadoIds = equipoRaw.map((e) => e.empleado_id);
        const kpis = await this.kpiRepository.find({
            where: {
                empleadoId: (0, typeorm_2.In)(empleadoIds),
                mes: month,
                anio: year,
            },
        });
        const kpiMap = new Map(kpis.map((k) => [k.empleadoId, k]));
        const previousMonth = month === 1 ? 12 : month - 1;
        const previousYear = month === 1 ? year - 1 : year;
        const previousKpis = await this.kpiRepository.find({
            where: {
                empleadoId: (0, typeorm_2.In)(empleadoIds),
                mes: previousMonth,
                anio: previousYear,
            },
        });
        const currentAvg = kpis.length > 0
            ? kpis.reduce((sum, k) => sum + Number(k.cumplimientoPct), 0) / kpis.length
            : 0;
        const previousAvg = previousKpis.length > 0
            ? previousKpis.reduce((sum, k) => sum + Number(k.cumplimientoPct), 0) / previousKpis.length
            : 0;
        const comparacionMesAnterior = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;
        return {
            mes: month,
            anio: year,
            cantidadEmpleados: equipoRaw.length,
            resumen: {
                totalDiasTrabajados: kpis.reduce((sum, k) => sum + k.diasTrabajados, 0),
                totalTardias: kpis.reduce((sum, k) => sum + k.tardias, 0),
                promedioCumplimiento: currentAvg,
                comparacionMesAnterior: Math.round(comparacionMesAnterior * 10) / 10,
            },
            empleados: equipoRaw.map((e) => {
                const kpi = kpiMap.get(e.empleado_id);
                return {
                    empleadoId: e.empleado_id,
                    nombreCompleto: this.sanitizeString(`${e.nombres} ${e.apellidos}`),
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
    async getHrDashboard(mes, anio) {
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
            mes: month,
            anio: year,
            totalEmpleados: kpis.length,
            promedioCumplimiento: kpis.length > 0
                ? kpis.reduce((sum, k) => sum + Number(k.cumplimientoPct), 0) / kpis.length
                : 0,
            totalTardias: kpis.reduce((sum, k) => sum + k.tardias, 0),
            totalFaltas: kpis.reduce((sum, k) => sum + k.faltas, 0),
            clasificaciones,
        };
    }
    async getEmployeeClassification(empleadoId, mes, anio) {
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
                nombreCompleto: empleado ? this.sanitizeString(`${empleado.nombres} ${empleado.apellidos}`) : '',
                clasificacion: kpi.clasificacion,
                cumplimientoPct: kpi.cumplimientoPct,
                tardias: kpi.tardias,
                faltas: kpi.faltas,
            },
        ];
    }
    async calculateKpi(empleadoId, mes, anio) {
        const fechaInicio = new Date(anio, mes - 1, 1);
        const fechaFin = new Date(anio, mes, 0);
        const hoy = new Date();
        const fechaActual = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const fechaCorte = fechaActual < fechaFin ? fechaActual : fechaFin;
        const empleadoTurno = await this.dataSource.getRepository('EMPLEADO_TURNO').findOne({
            where: { empleadoId, activo: true },
            relations: ['turno'],
            order: { fechaInicio: 'DESC' }
        });
        const diasLaboralesTurno = empleadoTurno?.turno?.dias
            ? empleadoTurno.turno.dias.split(',')
            : ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
        const horasTurno = Number(empleadoTurno?.turno?.horasEsperadasDia) || 8;
        const diasSemanaMap = {
            1: 'Lun', 2: 'Mar', 3: 'Mie', 4: 'Jue', 5: 'Vie', 6: 'Sab', 0: 'Dom'
        };
        let diasTranscurridos = 0;
        const fechaTemp = new Date(fechaInicio);
        while (fechaTemp <= fechaCorte) {
            const nombreDia = diasSemanaMap[fechaTemp.getDay()];
            if (diasLaboralesTurno.includes(nombreDia)) {
                diasTranscurridos++;
            }
            fechaTemp.setDate(fechaTemp.getDate() + 1);
        }
        const horasEsperadas = diasTranscurridos * horasTurno;
        const asistencia = await this.asistenciaRepository.find({
            where: {
                empleadoId,
                fecha: (0, typeorm_2.Between)(fechaInicio, fechaCorte),
            },
        });
        const diasTrabajados = asistencia.filter((a) => a.estadoJornada === 'completada' || a.estadoJornada === 'incompleta').length;
        const diasConEntrada = asistencia.filter((a) => a.horaEntradaReal !== null).length;
        const tardias = asistencia.reduce((sum, a) => sum + (a.minutosTardia > 0 ? 1 : 0), 0);
        const faltas = Math.max(0, diasTranscurridos - diasConEntrada);
        const horasTrabajadas = asistencia.reduce((sum, a) => sum + Number(a.horasTrabajadas || 0), 0);
        const cumplimientoPct = horasEsperadas > 0 ? (horasTrabajadas / horasEsperadas) * 100 : 0;
        let clasificacion = 'En riesgo';
        if (cumplimientoPct >= 95)
            clasificacion = 'Excelente';
        else if (cumplimientoPct >= 85)
            clasificacion = 'Bueno';
        else if (cumplimientoPct >= 70)
            clasificacion = 'En observacion';
        let kpi = await this.kpiRepository.findOne({
            where: { empleadoId, mes, anio },
        });
        if (kpi) {
            kpi.diasEsperados = diasTranscurridos;
            kpi.diasTrabajados = diasTrabajados;
            kpi.tardias = tardias;
            kpi.faltas = faltas;
            kpi.horasEsperadas = horasEsperadas;
            kpi.horasTrabajadas = horasTrabajadas;
            kpi.cumplimientoPct = Math.round(cumplimientoPct * 100) / 100;
            kpi.clasificacion = clasificacion;
            kpi.fechaCalculo = new Date();
        }
        else {
            kpi = this.kpiRepository.create({
                empleadoId,
                anio,
                mes,
                diasEsperados: diasTranscurridos,
                diasTrabajados,
                tardias,
                faltas,
                horasEsperadas,
                horasTrabajadas,
                cumplimientoPct: Math.round(cumplimientoPct * 100) / 100,
                clasificacion,
                fechaCalculo: new Date(),
            });
        }
        return this.kpiRepository.save(kpi);
    }
    async refreshEmployeeKpi(empleadoId, mes, anio) {
        const now = new Date();
        const month = mes || now.getMonth() + 1;
        const year = anio || now.getFullYear();
        await this.kpiRepository.delete({ empleadoId, mes: month, anio: year });
        return this.calculateKpi(empleadoId, month, year);
    }
    async getEmployeeProfile(empleadoId) {
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
                fecha: (0, typeorm_2.Raw)((alias) => `${alias} >= :sevenDaysAgo`, { sevenDaysAgo }),
            },
            order: { fecha: 'DESC' },
        });
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const timesheets = await this.registroTiempoRepository.find({
            where: {
                empleadoId,
                fecha: (0, typeorm_2.Raw)((alias) => `${alias} >= :firstDayOfMonth`, { firstDayOfMonth }),
            },
            relations: ['proyecto'],
        });
        const projectHoursMap = new Map();
        for (const ts of timesheets) {
            const horas = Number(ts.horas) || 0;
            if (projectHoursMap.has(ts.proyectoId)) {
                const existing = projectHoursMap.get(ts.proyectoId);
                existing.horas += horas;
            }
            else {
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
        const comparisonPct = previousKpi && previousKpi.cumplimientoPct > 0
            ? (((currentKpi?.cumplimientoPct || 0) - previousKpi.cumplimientoPct) /
                previousKpi.cumplimientoPct) *
                100
            : 0;
        return {
            empleado: {
                nombreCompleto: this.sanitizeString(`${empleado.nombres} ${empleado.apellidos}`),
                puesto: this.sanitizeString(empleado.puesto),
                departamento: this.sanitizeString(empleado.departamento),
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
    async saveObservation(empleadoId, mes, anio, observacion) {
        const kpi = await this.kpiRepository.findOne({
            where: { empleadoId, mes, anio },
        });
        if (!kpi) {
            throw new common_1.NotFoundException('No se puede guardar observación para un periodo sin KPI calculado');
        }
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
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_3.DataSource])
], KpiService);
//# sourceMappingURL=kpi.service.js.map