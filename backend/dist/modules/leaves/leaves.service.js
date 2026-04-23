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
const adjunto_solicitud_entity_1 = require("../../entities/adjunto-solicitud.entity");
const typeorm_3 = require("typeorm");
const fs = require("fs");
const path = require("path");
let LeavesService = class LeavesService {
    constructor(solicitudRepository, tipoPermisoRepository, decisionRepository, vacacionSaldoRepository, vacacionMovimientoRepository, empleadoRepository, auditRepository, adjuntoRepository, dataSource) {
        this.solicitudRepository = solicitudRepository;
        this.tipoPermisoRepository = tipoPermisoRepository;
        this.decisionRepository = decisionRepository;
        this.vacacionSaldoRepository = vacacionSaldoRepository;
        this.vacacionMovimientoRepository = vacacionMovimientoRepository;
        this.empleadoRepository = empleadoRepository;
        this.auditRepository = auditRepository;
        this.adjuntoRepository = adjuntoRepository;
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
    calculateDays(start, end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diff = endDate.getTime() - startDate.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    }
    async createRequest(createDto, empleadoId) {
        const tipoPermiso = await this.tipoPermisoRepository.findOne({
            where: { tipoPermisoId: createDto.tipoPermisoId },
        });
        if (!tipoPermiso) {
            throw new common_1.NotFoundException('Tipo de permiso no encontrado');
        }
        const fechaInicio = new Date(createDto.fechaInicio);
        const fechaFin = new Date(createDto.fechaFin);
        if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
            throw new common_1.BadRequestException('Las fechas proporcionadas no son válidas');
        }
        if (fechaFin < fechaInicio) {
            throw new common_1.BadRequestException('La fecha fin no puede ser anterior a la fecha de inicio');
        }
        const diasSolicitados = this.calculateDays(fechaInicio, fechaFin);
        if (diasSolicitados <= 0) {
            throw new common_1.BadRequestException('El rango de fechas no es válido');
        }
        if (tipoPermiso.descuentaVacaciones) {
            const saldo = await this.vacacionSaldoRepository.findOne({
                where: { empleadoId },
            });
            if (!saldo) {
                throw new common_1.BadRequestException('No tiene saldo de vacaciones configurado');
            }
            if (saldo.diasDisponibles < diasSolicitados) {
                throw new common_1.BadRequestException(`No tiene suficientes días de vacaciones. Tiene ${saldo.diasDisponibles} días disponibles pero está solicitando ${diasSolicitados} días.`);
            }
        }
        const solicitud = this.solicitudRepository.create({
            empleadoId,
            tipoPermisoId: createDto.tipoPermisoId,
            fechaInicio,
            fechaFin,
            horasInicio: createDto.horasInicio || null,
            horasFin: createDto.horasFin || null,
            motivo: createDto.motivo,
            estado: solicitud_permiso_entity_1.SolicitudPermiso.ESTADO_PENDIENTE,
        });
        const saved = await this.solicitudRepository.save(solicitud);
        if (createDto.archivo && createDto.nombreArchivo) {
            await this.saveAttachment(saved.solicitudId, createDto.archivo, createDto.nombreArchivo, createDto.tipoMime || 'application/octet-stream');
        }
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
    async saveAttachment(solicitudId, base64Data, nombreArchivo, tipoMime) {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'solicitudes');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const buffer = Buffer.from(base64Data, 'base64');
        const safeName = nombreArchivo.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `${solicitudId}_${Date.now()}_${safeName}`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, buffer);
        const adjunto = this.adjuntoRepository.create({
            solicitudId,
            nombreArchivo: nombreArchivo,
            rutaUrl: `/attachment/${fileName}`,
            tipoMime,
        });
        await this.adjuntoRepository.save(adjunto);
    }
    async getAttachment(fileName, res) {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'solicitudes');
        const filePath = path.join(uploadsDir, fileName);
        if (!fs.existsSync(filePath)) {
            throw new common_1.NotFoundException('Archivo no encontrado');
        }
        res.sendFile(filePath);
    }
    async getMyRequests(empleadoId) {
        const solicitudes = await this.solicitudRepository.find({
            where: { empleadoId },
            relations: ['tipoPermiso', 'decisiones', 'adjuntos'],
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
            adjuntos: s.adjuntos?.map((a) => ({
                adjuntoId: a.adjuntoId,
                nombreArchivo: a.nombreArchivo,
                rutaUrl: a.rutaUrl,
            })),
        }));
    }
    async getPendingRequests(supervisorEmpleadoId) {
        try {
            const empleadosRaw = await this.dataSource.query(`SELECT empleado_id, nombres, apellidos, codigo_empleado FROM EMPLEADO WHERE supervisor_id = @0 AND activo = 1`, [supervisorEmpleadoId]);
            if (empleadosRaw.length === 0) {
                return [];
            }
            const ids = empleadosRaw.map((e) => e.empleado_id);
            const solicitudes = await this.solicitudRepository.find({
                where: {
                    empleadoId: (0, typeorm_2.In)(ids)
                },
                relations: ['empleado', 'tipoPermiso', 'adjuntos'],
                order: { fechaSolicitud: 'DESC' }
            });
            return solicitudes.map((s) => ({
                solicitudId: s.solicitudId,
                empleadoId: s.empleadoId,
                empleado: {
                    empleadoId: s.empleadoId,
                    nombreCompleto: `${s.empleado?.nombres} ${s.empleado?.apellidos}`,
                    codigoEmpleado: s.empleado?.codigoEmpleado,
                },
                tipoPermiso: s.tipoPermiso?.nombre,
                fechaInicio: s.fechaInicio,
                fechaFin: s.fechaFin,
                horasInicio: s.horasInicio,
                horasFin: s.horasFin,
                motivo: s.motivo,
                estado: s.estado,
                fechaSolicitud: s.fechaSolicitud,
                adjuntos: s.adjuntos?.map(a => ({
                    adjuntoId: a.adjuntoId,
                    nombreArchivo: a.nombreArchivo,
                    rutaUrl: a.rutaUrl
                }))
            }));
        }
        catch (error) {
            console.error('Error in getPendingRequests:', error);
            throw error;
        }
    }
    async approveRequest(solicitudId, comentario, usuarioId) {
        try {
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
            const diasSolicitados = this.calculateDays(solicitud.fechaInicio, solicitud.fechaFin);
            if (solicitud.tipoPermiso?.descuentaVacaciones) {
                const saldo = await this.vacacionSaldoRepository.findOne({
                    where: { empleadoId: solicitud.empleadoId },
                });
                if (saldo) {
                    const disponiblesActuales = Number(saldo.diasDisponibles);
                    const usadosActuales = Number(saldo.diasUsados);
                    await this.vacacionSaldoRepository.update(saldo.saldoId, {
                        diasDisponibles: disponiblesActuales - diasSolicitados,
                        diasUsados: usadosActuales + diasSolicitados
                    });
                    await this.vacacionMovimientoRepository.save({
                        empleadoId: solicitud.empleadoId,
                        solicitudId: solicitudId,
                        tipo: vacacion_movimiento_entity_1.VacacionMovimiento.TIPO_CONSUMO,
                        dias: diasSolicitados,
                        fecha: new Date(),
                        comentario: `Uso por solicitud #${solicitudId}`,
                    });
                }
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
            await this.auditRepository.save({
                usuarioId,
                modulo: 'PERMISOS',
                accion: 'APPROVE',
                entidad: 'SOLICITUD_PERMISO',
                entidadId: solicitudId,
                detalle: `Solicitud aprobada: ${diasSolicitados} días`,
            });
            return { message: 'Solicitud aprobada correctamente' };
        }
        catch (error) {
            console.error('ERROR IN APPROVE:', error);
            throw error;
        }
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
            diasLibres: saldo.diasDisponibles,
            diasTotales: saldo.diasDisponibles + saldo.diasUsados,
            fechaCorte: saldo.fechaCorte,
        };
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
    __param(7, (0, typeorm_1.InjectRepository)(adjunto_solicitud_entity_1.AdjuntoSolicitud)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_3.DataSource])
], LeavesService);
//# sourceMappingURL=leaves.service.js.map