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
const notices_service_1 = require("../notices/notices.service");
const typeorm_3 = require("typeorm");
const fs = require("fs");
const path = require("path");
let LeavesService = class LeavesService {
    constructor(solicitudRepository, tipoPermisoRepository, decisionRepository, vacacionSaldoRepository, vacacionMovimientoRepository, empleadoRepository, auditRepository, adjuntoRepository, noticesService, dataSource) {
        this.solicitudRepository = solicitudRepository;
        this.tipoPermisoRepository = tipoPermisoRepository;
        this.decisionRepository = decisionRepository;
        this.vacacionSaldoRepository = vacacionSaldoRepository;
        this.vacacionMovimientoRepository = vacacionMovimientoRepository;
        this.empleadoRepository = empleadoRepository;
        this.auditRepository = auditRepository;
        this.adjuntoRepository = adjuntoRepository;
        this.noticesService = noticesService;
        this.dataSource = dataSource;
    }
    async getTiposPermiso(todos = false) {
        const where = {};
        if (!todos)
            where.activo = true;
        const tipos = await this.tipoPermisoRepository.find({
            where,
            order: { nombre: 'ASC' },
        });
        return tipos.map(t => ({
            ...t,
            nombre: this.sanitizeString(t.nombre)
        }));
    }
    async createTipoPermiso(dto, usuarioId) {
        const tipo = this.tipoPermisoRepository.create({ ...dto, activo: true });
        const saved = await this.tipoPermisoRepository.save(tipo);
        const savedSingle = Array.isArray(saved) ? saved[0] : saved;
        await this.auditRepository.save({
            usuarioId, modulo: 'CONFIGURACION', accion: 'CREATE',
            entidad: 'TIPO_PERMISO', entidadId: savedSingle.tipoPermisoId,
            detalle: `Tipo de permiso creado: ${savedSingle.nombre}`,
        });
        return savedSingle;
    }
    async updateTipoPermiso(id, dto, usuarioId) {
        const tipo = await this.tipoPermisoRepository.findOne({ where: { tipoPermisoId: id } });
        if (!tipo)
            throw new common_1.NotFoundException('Tipo no encontrado');
        Object.assign(tipo, dto);
        const saved = await this.tipoPermisoRepository.save(tipo);
        const savedSingle = Array.isArray(saved) ? saved[0] : saved;
        await this.auditRepository.save({
            usuarioId, modulo: 'CONFIGURACION', accion: 'UPDATE',
            entidad: 'TIPO_PERMISO', entidadId: id,
            detalle: `Tipo de permiso actualizado: ${savedSingle.nombre}`,
        });
        return savedSingle;
    }
    async getAllRequests() {
        const solicitudes = await this.solicitudRepository.find({
            relations: ['empleado', 'empleado.vacacionSaldo', 'tipoPermiso', 'adjuntos', 'decisiones', 'decisiones.usuario'],
            order: { fechaSolicitud: 'DESC' },
        });
        return solicitudes.map(s => {
            const diasSolicitados = this.calculateDays(s.fechaInicio, s.fechaFin);
            return {
                ...s,
                empleadoNombre: this.sanitizeString(`${s.empleado?.nombres} ${s.empleado?.apellidos}`),
                departamento: this.sanitizeString(s.empleado?.departamento),
                tipoPermisoNombre: this.sanitizeString(s.tipoPermiso?.nombre),
                diasSolicitados,
                diasDisponibles: s.empleado?.vacacionSaldo?.diasDisponibles ?? 0
            };
        });
    }
    async getAllBalances() {
        const saldos = await this.vacacionSaldoRepository.find({
            relations: ['empleado'],
            order: { empleado: { nombres: 'ASC' } },
        });
        return saldos.map(s => ({
            ...s,
            empleadoNombre: this.sanitizeString(`${s.empleado?.nombres} ${s.empleado?.apellidos}`),
            departamento: this.sanitizeString(s.empleado?.departamento)
        }));
    }
    async getVacationMovements() {
        const movs = await this.vacacionMovimientoRepository.find({
            relations: ['empleado'],
            order: { fecha: 'DESC' },
            take: 500,
        });
        return movs.map(m => ({
            ...m,
            empleadoNombre: this.sanitizeString(`${m.empleado?.nombres} ${m.empleado?.apellidos}`)
        }));
    }
    async adjustVacationBalance(dto, usuarioId) {
        const saldo = await this.vacacionSaldoRepository.findOne({
            where: { empleadoId: dto.empleadoId }
        });
        if (!saldo)
            throw new common_1.NotFoundException('Saldo no encontrado');
        const diasNum = Number(dto.dias);
        const nuevosDisponibles = Number(saldo.diasDisponibles) + diasNum;
        await this.vacacionSaldoRepository.update(saldo.saldoId, {
            diasDisponibles: nuevosDisponibles
        });
        await this.vacacionMovimientoRepository.save({
            empleadoId: dto.empleadoId,
            tipo: diasNum > 0 ? vacacion_movimiento_entity_1.VacacionMovimiento.TIPO_ACUMULACION : vacacion_movimiento_entity_1.VacacionMovimiento.TIPO_CONSUMO,
            dias: Math.abs(diasNum),
            fecha: new Date(),
            comentario: `Ajuste manual RRHH: ${dto.motivo}`
        });
        return { message: 'Saldo ajustado correctamente' };
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
    calculateDays(start, end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diff = endDate.getTime() - startDate.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    }
    async createRequest(createDto, empleadoId) {
        const tipoPermiso = await this.tipoPermisoRepository.findOne({ where: { tipoPermisoId: createDto.tipoPermisoId } });
        if (!tipoPermiso)
            throw new common_1.NotFoundException('Tipo de permiso no encontrado');
        const fechaInicio = new Date(createDto.fechaInicio);
        const fechaFin = new Date(createDto.fechaFin);
        const solicitud = this.solicitudRepository.create({
            empleadoId,
            tipoPermisoId: createDto.tipoPermisoId,
            fechaInicio,
            fechaFin,
            motivo: createDto.motivo,
            estado: solicitud_permiso_entity_1.SolicitudPermiso.ESTADO_PENDIENTE,
        });
        const saved = await this.solicitudRepository.save(solicitud);
        if (createDto.archivo && createDto.nombreArchivo) {
            await this.saveAttachment(saved.solicitudId, createDto.archivo, createDto.nombreArchivo, createDto.tipoMime || 'application/octet-stream');
        }
        return { solicitudId: saved.solicitudId, estado: saved.estado };
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
    async getMyRequests(empleadoId) {
        return await this.solicitudRepository.find({
            where: { empleadoId },
            relations: ['tipoPermiso', 'decisiones', 'adjuntos'],
            order: { fechaSolicitud: 'DESC' },
        });
    }
    async getPendingRequests(supervisorEmpleadoId) {
        const empleadosRaw = await this.dataSource.query(`SELECT empleado_id FROM EMPLEADO WHERE supervisor_id = @0 AND activo = 1`, [supervisorEmpleadoId]);
        if (empleadosRaw.length === 0)
            return [];
        const ids = empleadosRaw.map((e) => e.empleado_id);
        return await this.solicitudRepository.find({
            where: { empleadoId: (0, typeorm_2.In)(ids), estado: solicitud_permiso_entity_1.SolicitudPermiso.ESTADO_PENDIENTE },
            relations: ['empleado', 'tipoPermiso', 'adjuntos'],
            order: { fechaSolicitud: 'DESC' }
        });
    }
    async approveRequest(solicitudId, comentario, usuarioId) {
        const solicitud = await this.solicitudRepository.findOne({ where: { solicitudId }, relations: ['tipoPermiso', 'empleado', 'empleado.usuario'] });
        if (!solicitud)
            throw new common_1.NotFoundException('Solicitud no encontrada');
        if (solicitud.estado !== solicitud_permiso_entity_1.SolicitudPermiso.ESTADO_PENDIENTE) {
            throw new common_1.BadRequestException('La solicitud ya no está pendiente');
        }
        const diasSolicitados = this.calculateDays(solicitud.fechaInicio, solicitud.fechaFin);
        if (solicitud.tipoPermiso?.descuentaVacaciones) {
            const saldo = await this.vacacionSaldoRepository.findOne({ where: { empleadoId: solicitud.empleadoId } });
            if (saldo) {
                await this.vacacionSaldoRepository.update(saldo.saldoId, {
                    diasDisponibles: Number(saldo.diasDisponibles) - diasSolicitados,
                    diasUsados: Number(saldo.diasUsados) + diasSolicitados
                });
                await this.vacacionMovimientoRepository.save({
                    empleadoId: solicitud.empleadoId, solicitudId, tipo: vacacion_movimiento_entity_1.VacacionMovimiento.TIPO_CONSUMO,
                    dias: diasSolicitados, fecha: new Date(), comentario: `Uso por solicitud #${solicitudId}`,
                });
            }
        }
        solicitud.estado = solicitud_permiso_entity_1.SolicitudPermiso.ESTADO_APROBADO;
        await this.solicitudRepository.save(solicitud);
        await this.decisionRepository.save({ solicitudId, usuarioId, decision: 'aprobado', comentario, fechaHora: new Date() });
        try {
            if (solicitud.empleado?.usuario) {
                await this.noticesService.createNotice(solicitud.empleado.usuario.usuarioId, 'Solicitud Aprobada', `Tu solicitud de ${solicitud.tipoPermiso?.nombre || 'permiso'} ha sido aprobada.`, 'success');
            }
        }
        catch (e) {
            console.warn('Aviso no enviado pero solicitud procesada.');
        }
        return { message: 'Solicitud aprobada' };
    }
    async rejectRequest(solicitudId, comentario, usuarioId) {
        const solicitud = await this.solicitudRepository.findOne({ where: { solicitudId }, relations: ['tipoPermiso', 'empleado', 'empleado.usuario'] });
        if (!solicitud)
            throw new common_1.NotFoundException('Solicitud no encontrada');
        if (solicitud.estado !== solicitud_permiso_entity_1.SolicitudPermiso.ESTADO_PENDIENTE) {
            throw new common_1.BadRequestException('La solicitud ya no está pendiente');
        }
        solicitud.estado = solicitud_permiso_entity_1.SolicitudPermiso.ESTADO_RECHAZADO;
        await this.solicitudRepository.save(solicitud);
        await this.decisionRepository.save({ solicitudId, usuarioId, decision: 'rechazado', comentario, fechaHora: new Date() });
        try {
            if (solicitud.empleado?.usuario) {
                await this.noticesService.createNotice(solicitud.empleado.usuario.usuarioId, 'Solicitud Rechazada', `Tu solicitud de ${solicitud.tipoPermiso?.nombre || 'permiso'} ha sido rechazada.`, 'error');
            }
        }
        catch (e) {
            console.warn('Aviso no enviado pero solicitud procesada.');
        }
        return { message: 'Solicitud rechazada' };
    }
    async getVacationBalance(empleadoId) {
        let saldo = await this.vacacionSaldoRepository.findOne({ where: { empleadoId } });
        if (!saldo) {
            saldo = this.vacacionSaldoRepository.create({ empleadoId, diasDisponibles: 15, diasUsados: 0, fechaCorte: new Date() });
            await this.vacacionSaldoRepository.save(saldo);
        }
        return {
            empleadoId: saldo.empleadoId,
            diasDisponibles: saldo.diasDisponibles,
            diasUsados: saldo.diasUsados,
            diasTotales: Number(saldo.diasDisponibles) + Number(saldo.diasUsados),
        };
    }
    async getAttachment(fileName, res) {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'solicitudes');
        const filePath = path.join(uploadsDir, fileName);
        if (!fs.existsSync(filePath))
            throw new common_1.NotFoundException('Archivo no encontrado');
        res.sendFile(filePath);
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
        notices_service_1.NoticesService,
        typeorm_3.DataSource])
], LeavesService);
//# sourceMappingURL=leaves.service.js.map