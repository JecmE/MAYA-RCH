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
exports.TimesheetsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const registro_tiempo_entity_1 = require("../../entities/registro-tiempo.entity");
const proyecto_entity_1 = require("../../entities/proyecto.entity");
const empleado_entity_1 = require("../../entities/empleado.entity");
const aprobacion_tiempo_entity_1 = require("../../entities/aprobacion-tiempo.entity");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
let TimesheetsService = class TimesheetsService {
    constructor(tiempoRepository, proyectoRepository, empleadoRepository, aprobacionRepository, auditRepository) {
        this.tiempoRepository = tiempoRepository;
        this.proyectoRepository = proyectoRepository;
        this.empleadoRepository = empleadoRepository;
        this.aprobacionRepository = aprobacionRepository;
        this.auditRepository = auditRepository;
    }
    async getMyTimesheets(empleadoId, fechaInicio, fechaFin, proyectoId) {
        const where = { empleadoId };
        if (fechaInicio && fechaFin) {
            where.fecha = (0, typeorm_2.Between)(fechaInicio, fechaFin);
        }
        else if (fechaInicio) {
            where.fecha = (0, typeorm_2.MoreThanOrEqual)(fechaInicio);
        }
        else if (fechaFin) {
            where.fecha = (0, typeorm_2.LessThanOrEqual)(fechaFin);
        }
        if (proyectoId) {
            where.proyectoId = proyectoId;
        }
        const registros = await this.tiempoRepository.find({
            where,
            relations: ['proyecto', 'aprobaciones'],
            order: { fecha: 'DESC', fechaRegistro: 'DESC' },
        });
        return registros.map((r) => {
            const aprobacion = r.aprobaciones && r.aprobaciones.length > 0 ? r.aprobaciones[0] : null;
            return {
                tiempoId: r.tiempoId,
                empleadoId: r.empleadoId,
                fecha: r.fecha,
                proyectoId: r.proyectoId,
                proyectoNombre: r.proyecto?.nombre || '',
                proyectoCodigo: r.proyecto?.codigo || '',
                horas: r.horas,
                horasValidadas: r.horasValidadas,
                actividadDescripcion: r.actividadDescripcion,
                estado: r.estado,
                fechaRegistro: r.fechaRegistro,
                comentario: aprobacion?.comentario || null,
                decision: aprobacion?.decision || null,
            };
        });
    }
    async createEntry(createDto, empleadoId) {
        if (!createDto.proyectoId) {
            throw new common_1.BadRequestException('Debe seleccionar un proyecto');
        }
        if (!createDto.fecha) {
            throw new common_1.BadRequestException('Debe ingresar una fecha');
        }
        if (!createDto.horas || createDto.horas <= 0) {
            throw new common_1.BadRequestException('Debe ingresar horas válidas (mayor a 0)');
        }
        if (createDto.horas > 8) {
            throw new common_1.BadRequestException('No puede registrar más de 8 horas en un día');
        }
        if (!createDto.actividadDescripcion && !createDto.actividad) {
            throw new common_1.BadRequestException('Debe describir la actividad realizada');
        }
        if ((createDto.actividadDescripcion || createDto.actividad).length < 10) {
            throw new common_1.BadRequestException('La descripción de la actividad debe tener al menos 10 caracteres');
        }
        const fechaStr = createDto.fecha;
        const [y, m, d] = fechaStr.split('-').map(Number);
        const fechaCheck = new Date(y, m - 1, d, 0, 0, 0, 0);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (fechaCheck > hoy) {
            throw new common_1.BadRequestException('No puede registrar tiempos para fechas futuras');
        }
        const proyecto = await this.proyectoRepository.findOne({
            where: { proyectoId: createDto.proyectoId, activo: true },
        });
        if (!proyecto) {
            throw new common_1.NotFoundException('Proyecto no encontrado o inactivo');
        }
        const existsQuery = await this.tiempoRepository
            .createQueryBuilder('rt')
            .where('rt.empleado_id = :empleadoId', { empleadoId })
            .andWhere('rt.proyecto_id = :proyectoId', { proyectoId: createDto.proyectoId })
            .andWhere('CAST(rt.fecha AS DATE) = :fecha', { fecha: fechaStr })
            .getOne();
        if (existsQuery) {
            throw new common_1.BadRequestException(`Ya existe un registro para este proyecto en la fecha ${fechaStr}. No puede duplicar registros.`);
        }
        const registro = this.tiempoRepository.create({
            empleadoId,
            proyectoId: createDto.proyectoId,
            fecha: fechaStr,
            horas: createDto.horas,
            actividadDescripcion: createDto.actividadDescripcion || createDto.actividad || '',
            estado: registro_tiempo_entity_1.RegistroTiempo.ESTADO_PENDIENTE,
        });
        const saved = await this.tiempoRepository.save(registro);
        await this.auditRepository.save({
            usuarioId: null,
            modulo: 'TIMESHEET',
            accion: 'CREATE',
            entidad: 'REGISTRO_TIEMPO',
            entidadId: saved.tiempoId,
            detalle: `Registro de ${saved.horas}h en proyecto ${proyecto.nombre}`,
        });
        return {
            tiempoId: saved.tiempoId,
            estado: saved.estado,
            mensaje: 'Registro creado exitosamente',
        };
    }
    async getTeamTimesheets(supervisorEmpleadoId, fechaInicio, fechaFin) {
        const equipo = await this.empleadoRepository.find({
            where: { supervisorId: supervisorEmpleadoId, activo: true },
        });
        const empleadoIds = equipo.map((e) => e.empleadoId);
        if (empleadoIds.length === 0) {
            return [];
        }
        const where = { empleadoId: empleadoIds };
        if (fechaInicio && fechaFin) {
            where.fecha = (0, typeorm_2.Between)(new Date(fechaInicio), new Date(fechaFin));
        }
        const registros = await this.tiempoRepository.find({
            where,
            relations: ['empleado', 'proyecto'],
            order: { fecha: 'DESC' },
        });
        return registros.map((r) => ({
            tiempoId: r.tiempoId,
            empleado: {
                empleadoId: r.empleado?.empleadoId,
                nombreCompleto: r.empleado?.nombreCompleto,
                codigoEmpleado: r.empleado?.codigoEmpleado,
            },
            proyecto: {
                proyectoId: r.proyecto?.proyectoId,
                nombre: r.proyecto?.nombre,
            },
            fecha: r.fecha,
            horas: r.horas,
            horasValidadas: r.horasValidadas,
            actividadDescripcion: r.actividadDescripcion,
            estado: r.estado,
        }));
    }
    async approve(id, comentario, usuarioId) {
        const registro = await this.tiempoRepository.findOne({
            where: { tiempoId: id },
        });
        if (!registro) {
            throw new common_1.NotFoundException('Registro no encontrado');
        }
        if (registro.estado !== registro_tiempo_entity_1.RegistroTiempo.ESTADO_PENDIENTE) {
            throw new common_1.BadRequestException('El registro ya no está pendiente');
        }
        registro.estado = registro_tiempo_entity_1.RegistroTiempo.ESTADO_APROBADO;
        registro.horasValidadas = registro.horas;
        await this.tiempoRepository.save(registro);
        await this.aprobacionRepository.save({
            tiempoId: id,
            usuarioId,
            decision: aprobacion_tiempo_entity_1.AprobacionTiempo.DECISION_APROBADO,
            comentario,
            fechaHora: new Date(),
        });
        await this.auditRepository.save({
            usuarioId,
            modulo: 'TIMESHEET',
            accion: 'APPROVE',
            entidad: 'REGISTRO_TIEMPO',
            entidadId: id,
            detalle: `Registro aprobado: ${comentario}`,
        });
        return { message: 'Registro aprobado' };
    }
    async reject(id, comentario, usuarioId) {
        const registro = await this.tiempoRepository.findOne({
            where: { tiempoId: id },
        });
        if (!registro) {
            throw new common_1.NotFoundException('Registro no encontrado');
        }
        if (registro.estado !== registro_tiempo_entity_1.RegistroTiempo.ESTADO_PENDIENTE) {
            throw new common_1.BadRequestException('El registro ya no está pendiente');
        }
        registro.estado = registro_tiempo_entity_1.RegistroTiempo.ESTADO_RECHAZADO;
        await this.tiempoRepository.save(registro);
        await this.aprobacionRepository.save({
            tiempoId: id,
            usuarioId,
            decision: aprobacion_tiempo_entity_1.AprobacionTiempo.DECISION_RECHAZADO,
            comentario,
            fechaHora: new Date(),
        });
        await this.auditRepository.save({
            usuarioId,
            modulo: 'TIMESHEET',
            accion: 'REJECT',
            entidad: 'REGISTRO_TIEMPO',
            entidadId: id,
            detalle: `Registro rechazado: ${comentario}`,
        });
        return { message: 'Registro rechazado' };
    }
    async getProjectSummary(fechaInicio, fechaFin) {
        const registros = await this.tiempoRepository
            .createQueryBuilder('rt')
            .leftJoinAndSelect('rt.proyecto', 'proyecto')
            .leftJoinAndSelect('rt.empleado', 'empleado')
            .where('rt.fecha BETWEEN :fechaInicio AND :fechaFin', {
            fechaInicio: new Date(fechaInicio),
            fechaFin: new Date(fechaFin),
        })
            .andWhere('rt.estado = :estado', { estado: registro_tiempo_entity_1.RegistroTiempo.ESTADO_APROBADO })
            .getMany();
        const summary = {};
        for (const r of registros) {
            const proyectoNombre = r.proyecto?.nombre || 'Sin proyecto';
            if (!summary[proyectoNombre]) {
                summary[proyectoNombre] = {
                    proyecto: {
                        proyectoId: r.proyecto?.proyectoId,
                        nombre: proyectoNombre,
                    },
                    totalHoras: 0,
                    empleados: {},
                };
            }
            summary[proyectoNombre].totalHoras += Number(r.horasValidadas || r.horas);
            const empNombre = r.empleado?.nombreCompleto || 'Desconocido';
            if (!summary[proyectoNombre].empleados[empNombre]) {
                summary[proyectoNombre].empleados[empNombre] = {
                    nombre: empNombre,
                    horas: 0,
                };
            }
            summary[proyectoNombre].empleados[empNombre].horas += Number(r.horasValidadas || r.horas);
        }
        return Object.values(summary).map((s) => ({
            proyecto: s.proyecto,
            totalHoras: s.totalHoras,
            empleados: Object.values(s.empleados),
        }));
    }
};
exports.TimesheetsService = TimesheetsService;
exports.TimesheetsService = TimesheetsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(registro_tiempo_entity_1.RegistroTiempo)),
    __param(1, (0, typeorm_1.InjectRepository)(proyecto_entity_1.Proyecto)),
    __param(2, (0, typeorm_1.InjectRepository)(empleado_entity_1.Empleado)),
    __param(3, (0, typeorm_1.InjectRepository)(aprobacion_tiempo_entity_1.AprobacionTiempo)),
    __param(4, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TimesheetsService);
//# sourceMappingURL=timesheets.service.js.map