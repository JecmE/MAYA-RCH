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
exports.LeavesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const solicitud_permiso_entity_1 = require("../../entities/solicitud-permiso.entity");
const tipo_permiso_entity_1 = require("../../entities/tipo-permiso.entity");
const decision_permiso_entity_1 = require("../../entities/decision-permiso.entity");
const vacacion_saldo_entity_1 = require("../../entities/vacacion-saldo.entity");
const vacacion_movimiento_entity_1 = require("../../entities/vacacion-movimiento.entity");
const empleado_entity_1 = require("../../entities/empleado.entity");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
const typeorm_3 = require("typeorm");
let LeavesService = class LeavesService {
    constructor(solicitudRepository, tipoPermisoRepository, decisionRepository, vacacionSaldoRepository, vacacionMovimientoRepository, empleadoRepository, auditRepository, dataSource) {
        this.solicitudRepository = solicitudRepository;
        this.tipoPermisoRepository = tipoPermisoRepository;
        this.decisionRepository = decisionRepository;
        this.vacacionSaldoRepository = vacacionSaldoRepository;
        this.vacacionMovimientoRepository = vacacionMovimientoRepository;
        this.empleadoRepository = empleadoRepository;
        this.auditRepository = auditRepository;
        this.dataSource = dataSource;
    }
    async getTiposPermiso() {
        const tipos = await this.tipoPermisoRepository.find({
            where: { activo: true },
        });
        return tipos.map((t) => ({
            tipoPermisoId: t.tipoPermisoId,
            nombre: t.nombre,
            requiereDocumento: t.requiereDocumento,
            descuentaVacaciones: t.descuentaVacaciones,
        }));
    }
    async createRequest(createDto, empleadoId) {
        const tipoPermiso = await this.tipoPermisoRepository.findOne({
            where: { tipoPermisoId: createDto.tipoPermisoId },
        });
        if (!tipoPermiso) {
            throw new common_1.NotFoundException('Tipo de permiso no encontrado');
        }
        if (tipoPermiso.descuentaVacaciones) {
            const saldo = await this.vacacionSaldoRepository.findOne({
                where: { empleadoId },
            });
            if (!saldo || saldo.diasDisponibles < createDto.dias) {
                throw new common_1.BadRequestException('No tiene suficientes días de vacaciones');
            }
        }
        const solicitud = this.solicitudRepository.create({
            empleadoId,
            tipoPermisoId: createDto.tipoPermisoId,
            fechaInicio: new Date(createDto.fechaInicio),
            fechaFin: new Date(createDto.fechaFin),
            horasInicio: createDto.horasInicio || null,
            horasFin: createDto.horasFin || null,
            motivo: createDto.motivo,
            estado: solicitud_permiso_entity_1.SolicitudPermiso.ESTADO_PENDIENTE,
        });
        const saved = await this.solicitudRepository.save(solicitud);
        await this.auditRepository.save({
            usuarioId: null,
            modulo: 'PERMISOS',
            accion: 'CREATE',
            entidad: 'SOLICITUD_PERMISO',
            entidadId: saved.solicitudId,
            detalle: `Nueva solicitud de ${tipoPermiso.nombre}`,
        });
        return {
            solicitudId: saved.solicitudId,
            estado: saved.estado,
            mensaje: 'Solicitud creada exitosamente',
        };
    }
    async getMyRequests(empleadoId) {
        const solicitudes = await this.solicitudRepository.find({
            where: { empleadoId },
            relations: ['tipoPermiso', 'decisiones'],
            order: { fechaSolicitud: 'DESC' },
        });
        return solicitudes.map((s) => ({
            solicitudId: s.solicitudId,
            tipoPermiso: s.tipoPermiso?.nombre,
            fechaInicio: s.fechaInicio,
            fechaFin: s.fechaFin,
            horasInicio: s.horasInicio,
            horasFin: s.horasFin,
            motivo: s.motivo,
            estado: s.estado,
            fechaSolicitud: s.fechaSolicitud,
            decisiones: s.decisiones?.map((d) => ({
                decision: d.decision,
                comentario: d.comentario,
                fechaHora: d.fechaHora,
            })),
        }));
    }
    async getPendingRequests(supervisorEmpleadoId) {
        try {
            const empleadosRaw = await this.dataSource.query(`SELECT empleado_id, nombres, apellidos, codigo_empleado FROM EMPLEADO WHERE supervisor_id = @0 AND activo = 1`, [supervisorEmpleadoId]);
            if (empleadosRaw.length === 0) {
                return [];
            }
            const idsStr = empleadosRaw.map((e) => e.empleado_id).join(',');
            const solicitudesRaw = await this.dataSource.query(`SELECT sp.solicitud_id, sp.empleado_id, sp.tipo_permiso_id, sp.fecha_inicio, sp.fecha_fin, sp.horas_inicio, sp.horas_fin, sp.motivo, sp.estado, sp.fecha_solicitud, e.nombres + ' ' + e.apellidos as nombre_empleado, e.codigo_empleado, tp.nombre as tipo_permiso_nombre FROM SOLICITUD_PERMISO sp INNER JOIN EMPLEADO e ON sp.empleado_id = e.empleado_id INNER JOIN TIPO_PERMISO tp ON sp.tipo_permiso_id = tp.tipo_permiso_id WHERE sp.empleado_id IN (${idsStr}) AND sp.estado = @0 ORDER BY sp.fecha_solicitud ASC`, [solicitud_permiso_entity_1.SolicitudPermiso.ESTADO_PENDIENTE]);
            return solicitudesRaw.map((s) => ({
                solicitudId: s.solicitud_id,
                empleado: {
                    empleadoId: s.empleado_id,
                    nombreCompleto: s.nombre_empleado,
                    codigoEmpleado: s.codigo_empleado,
                },
                tipoPermiso: s.tipo_permiso_nombre,
                fechaInicio: s.fecha_inicio,
                fechaFin: s.fecha_fin,
                horasInicio: s.horas_inicio,
                horasFin: s.horas_fin,
                motivo: s.motivo,
                estado: s.estado,
                fechaSolicitud: s.fecha_solicitud,
            }));
        }
        catch (error) {
            console.error('Error in getPendingRequests:', error);
            throw error;
        }
    }
    async approveRequest(solicitudId, comentario, usuarioId) {
        const solicitud = await this.solicitudRepository.findOne({
            where: { solicitudId },
            relations: ['tipoPermiso'],
        });
        if (!solicitud) {
            throw new common_1.NotFoundException('Solicitud no encontrada');
        }
        if (solicitud.estado !== solicitud_permiso_entity_1.SolicitudPermiso.ESTADO_PENDIENTE) {
            throw new common_1.BadRequestException('La solicitud ya no está pendiente');
        }
        solicitud.estado = solicitud_permiso_entity_1.SolicitudPermiso.ESTADO_APROBADO;
        await this.solicitudRepository.save(solicitud);
        await this.decisionRepository.save({
            solicitudId,
            usuarioId,
            decision: decision_permiso_entity_1.DecisionPermiso.DECISION_APROBADO,
            comentario,
            fechaHora: new Date(),
        });
        if (solicitud.tipoPermiso?.descuentaVacaciones) {
            const dias = this.calculateDays(solicitud.fechaInicio, solicitud.fechaFin);
            await this.vacacionMovimientoRepository.save({
                empleadoId: solicitud.empleadoId,
                solicitudId,
                tipo: vacacion_movimiento_entity_1.VacacionMovimiento.TIPO_CONSUMO,
                dias,
                fecha: new Date(),
                comentario: `Consumo por aprobación de ${solicitud.tipoPermiso.nombre}`,
            });
            const saldo = await this.vacacionSaldoRepository.findOne({
                where: { empleadoId: solicitud.empleadoId },
            });
            if (saldo) {
                saldo.diasDisponibles = saldo.diasDisponibles - dias;
                saldo.diasUsados = saldo.diasUsados + dias;
                await this.vacacionSaldoRepository.save(saldo);
            }
        }
        await this.auditRepository.save({
            usuarioId,
            modulo: 'PERMISOS',
            accion: 'APPROVE',
            entidad: 'SOLICITUD_PERMISO',
            entidadId: solicitudId,
            detalle: `Solicitud aprobada: ${comentario}`,
        });
        return { message: 'Solicitud aprobada correctamente' };
    }
    async rejectRequest(solicitudId, comentario, usuarioId) {
        const solicitud = await this.solicitudRepository.findOne({
            where: { solicitudId },
        });
        if (!solicitud) {
            throw new common_1.NotFoundException('Solicitud no encontrada');
        }
        if (solicitud.estado !== solicitud_permiso_entity_1.SolicitudPermiso.ESTADO_PENDIENTE) {
            throw new common_1.BadRequestException('La solicitud ya no está pendiente');
        }
        solicitud.estado = solicitud_permiso_entity_1.SolicitudPermiso.ESTADO_RECHAZADO;
        await this.solicitudRepository.save(solicitud);
        await this.decisionRepository.save({
            solicitudId,
            usuarioId,
            decision: decision_permiso_entity_1.DecisionPermiso.DECISION_RECHAZADO,
            comentario,
            fechaHora: new Date(),
        });
        await this.auditRepository.save({
            usuarioId,
            modulo: 'PERMISOS',
            accion: 'REJECT',
            entidad: 'SOLICITUD_PERMISO',
            entidadId: solicitudId,
            detalle: `Solicitud rechazada: ${comentario}`,
        });
        return { message: 'Solicitud rechazada correctamente' };
    }
    async getVacationBalance(empleadoId) {
        let saldo = await this.vacacionSaldoRepository.findOne({
            where: { empleadoId },
        });
        if (!saldo) {
            const empleadoResult = await this.dataSource.query('SELECT fecha_ingreso FROM EMPLEADO WHERE empleado_id = @0', [empleadoId]);
            if (!empleadoResult || empleadoResult.length === 0) {
                throw new common_1.NotFoundException('Empleado no encontrado');
            }
            const fechaIngreso = new Date(empleadoResult[0].fecha_ingreso);
            const hoy = new Date();
            const aniosTrabajados = Math.floor((hoy.getTime() - fechaIngreso.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            const diasVacaciones = 15 + Math.min(aniosTrabajados, 5);
            saldo = this.vacacionSaldoRepository.create({
                empleadoId,
                diasDisponibles: diasVacaciones,
                diasUsados: 0,
                fechaCorte: new Date(hoy.getFullYear(), 11, 31),
            });
            await this.vacacionSaldoRepository.save(saldo);
            await this.vacacionMovimientoRepository.save({
                empleadoId,
                tipo: vacacion_movimiento_entity_1.VacacionMovimiento.TIPO_ACUMULACION,
                dias: diasVacaciones,
                fecha: new Date(),
                comentario: `Acumulación inicial por ${aniosTrabajados} años de servicio`,
            });
        }
        return {
            empleadoId: saldo.empleadoId,
            diasDisponibles: saldo.diasDisponibles,
            diasUsados: saldo.diasUsados,
            diasTotales: saldo.diasDisponibles + saldo.diasUsados,
            fechaCorte: saldo.fechaCorte,
        };
    }
    calculateDays(start, end) {
        const diff = end.getTime() - start.getTime();
        return Math.ceil(diff / (24 * 60 * 60 * 1000)) + 1;
    }
};
exports.LeavesService = LeavesService;
exports.LeavesService = LeavesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(solicitud_permiso_entity_1.SolicitudPermiso)),
    __param(1, (0, typeorm_1.InjectRepository)(tipo_permiso_entity_1.TipoPermiso)),
    __param(2, (0, typeorm_1.InjectRepository)(decision_permiso_entity_1.DecisionPermiso)),
    __param(3, (0, typeorm_1.InjectRepository)(vacacion_saldo_entity_1.VacacionSaldo)),
    __param(4, (0, typeorm_1.InjectRepository)(vacacion_movimiento_entity_1.VacacionMovimiento)),
    __param(5, (0, typeorm_1.InjectRepository)(empleado_entity_1.Empleado)),
    __param(6, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_3.DataSource])
], LeavesService);
//# sourceMappingURL=leaves.service.js.map