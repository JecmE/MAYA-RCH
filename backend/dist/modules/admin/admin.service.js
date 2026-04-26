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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt = require("bcrypt");
const typeorm_2 = require("typeorm");
const turno_entity_1 = require("../../entities/turno.entity");
const empleado_turno_entity_1 = require("../../entities/empleado-turno.entity");
const tipo_permiso_entity_1 = require("../../entities/tipo-permiso.entity");
const parametro_sistema_entity_1 = require("../../entities/parametro-sistema.entity");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
const rol_entity_1 = require("../../entities/rol.entity");
const regla_bono_entity_1 = require("../../entities/regla-bono.entity");
const usuario_entity_1 = require("../../entities/usuario.entity");
const empleado_entity_1 = require("../../entities/empleado.entity");
const solicitud_permiso_entity_1 = require("../../entities/solicitud-permiso.entity");
const registro_asistencia_entity_1 = require("../../entities/registro-asistencia.entity");
const kpi_mensual_entity_1 = require("../../entities/kpi-mensual.entity");
const vacacion_movimiento_entity_1 = require("../../entities/vacacion-movimiento.entity");
const registro_tiempo_entity_1 = require("../../entities/registro-tiempo.entity");
const bono_resultado_entity_1 = require("../../entities/bono-resultado.entity");
let AdminService = class AdminService {
    constructor(turnoRepository, empleadoTurnoRepository, tipoPermisoRepository, parametroRepository, auditRepository, rolRepository, reglaBonoRepository, usuarioRepository, empleadoRepository, solicitudPermisoRepository, registroAsistenciaRepository, kpiMensualRepository, vacacionMovimientoRepository, registroTiempoRepository, bonoResultadoRepository, dataSource) {
        this.turnoRepository = turnoRepository;
        this.empleadoTurnoRepository = empleadoTurnoRepository;
        this.tipoPermisoRepository = tipoPermisoRepository;
        this.parametroRepository = parametroRepository;
        this.auditRepository = auditRepository;
        this.rolRepository = rolRepository;
        this.reglaBonoRepository = reglaBonoRepository;
        this.usuarioRepository = usuarioRepository;
        this.empleadoRepository = empleadoRepository;
        this.solicitudPermisoRepository = solicitudPermisoRepository;
        this.registroAsistenciaRepository = registroAsistenciaRepository;
        this.kpiMensualRepository = kpiMensualRepository;
        this.vacacionMovimientoRepository = vacacionMovimientoRepository;
        this.registroTiempoRepository = registroTiempoRepository;
        this.bonoResultadoRepository = bonoResultadoRepository;
        this.dataSource = dataSource;
    }
    async onModuleInit() {
        await this.ensureCorrectTableStructures();
    }
    async ensureCorrectTableStructures() {
        try {
            await this.dataSource.query(`IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[REGLA_BONO]') AND name = 'monto') BEGIN ALTER TABLE [dbo].[REGLA_BONO] ADD [monto] DECIMAL(10, 2) DEFAULT 0; END`);
        }
        catch (e) { }
    }
    async logAction(dto, uid) {
        return await this.auditRepository.save({ ...dto, usuarioId: uid });
    }
    async getShifts() { return await this.turnoRepository.find({ order: { nombre: 'ASC' } }); }
    async createShift(dto, uid) {
        const s = await this.turnoRepository.save(this.turnoRepository.create(dto));
        await this.logAction({ modulo: 'RRHH', accion: 'CREATE', entidad: 'TURNO', entidadId: s.turnoId, detalle: `Creó turno: ${s.nombre}` }, uid);
        return this.getShifts();
    }
    async updateShift(id, dto, uid) {
        const existing = await this.turnoRepository.findOne({ where: { turnoId: id } });
        if (!existing)
            throw new common_1.NotFoundException('No encontrado');
        Object.assign(existing, dto);
        await this.turnoRepository.save(existing);
        await this.logAction({ modulo: 'RRHH', accion: 'UPDATE', entidad: 'TURNO', entidadId: id, detalle: `Actualizó turno: ${existing.nombre}` }, uid);
        return this.getShifts();
    }
    async deactivateShift(id, uid) {
        await this.turnoRepository.update(id, { activo: false });
        await this.logAction({ modulo: 'RRHH', accion: 'DEACTIVATE', entidad: 'TURNO', entidadId: id, detalle: 'Desactivó turno' }, uid);
        return { message: 'OK' };
    }
    async getAssignments() {
        const assignments = await this.empleadoTurnoRepository.find({
            relations: ['empleado', 'turno'],
            where: { activo: true },
            order: { fechaInicio: 'DESC' }
        });
        return assignments.map(a => ({
            id: a.empleadoTurnoId,
            empleadoNombre: `${a.empleado?.nombres} ${a.empleado?.apellidos}`,
            turnoNombre: a.turno?.nombre,
            fechaInicio: a.fechaInicio,
            fechaFin: a.fechaFin,
            activo: a.activo
        }));
    }
    async assignShift(dto, uid) {
        if (dto.id && dto.activo === false) {
            await this.empleadoTurnoRepository.update(dto.id, { activo: false, fechaFin: new Date() });
            await this.logAction({ modulo: 'RRHH', accion: 'FINALIZE', entidad: 'ASIGNACION_TURNO', entidadId: dto.id, detalle: 'Finalizó asignación de turno' }, uid);
            return this.getAssignments();
        }
        const fInicio = dto.fechaInicio || new Date().toISOString().split('T')[0];
        const fFin = dto.fechaFin === '' ? null : dto.fechaFin;
        await this.empleadoTurnoRepository.update({ empleadoId: dto.empleadoId }, { activo: false });
        const s = await this.empleadoTurnoRepository.save(this.empleadoTurnoRepository.create({ ...dto, fechaInicio: fInicio, fechaFin: fFin, activo: true }));
        await this.logAction({ modulo: 'RRHH', accion: 'ASSIGN', entidad: 'ASIGNACION_TURNO', entidadId: s.empleadoTurnoId, detalle: `Asignó turno a empleado` }, uid);
        return this.getAssignments();
    }
    async getBonusRules() { return await this.reglaBonoRepository.find({ order: { monto: 'DESC' } }); }
    async createBonusRule(dto, uid) {
        const r = await this.reglaBonoRepository.save(this.reglaBonoRepository.create(dto));
        await this.logAction({ modulo: 'RRHH', accion: 'CREATE_BONUS_RULE', entidad: 'REGLA_BONO', entidadId: r.reglaBonoId, detalle: `Creó regla: ${r.nombre}` }, uid);
        return this.getBonusRules();
    }
    async updateBonusRule(id, dto, uid) {
        const existing = await this.reglaBonoRepository.findOne({ where: { reglaBonoId: id } });
        if (!existing)
            throw new common_1.NotFoundException('No encontrado');
        Object.assign(existing, dto);
        await this.reglaBonoRepository.save(existing);
        await this.logAction({ modulo: 'RRHH', accion: 'UPDATE_BONUS_RULE', entidad: 'REGLA_BONO', entidadId: id, detalle: `Actualizó regla: ${existing.nombre}` }, uid);
        return this.getBonusRules();
    }
    async deleteBonusRule(id, uid) {
        await this.reglaBonoRepository.update(id, { activo: false });
        await this.logAction({ modulo: 'RRHH', accion: 'DELETE_BONUS_RULE', entidad: 'REGLA_BONO', entidadId: id, detalle: 'Desactivó regla de bono' }, uid);
        return this.getBonusRules();
    }
    async runBonusEvaluation(mes, anio, uid) {
        await this.logAction({ modulo: 'RRHH', accion: 'RUN_EVALUATION', entidad: 'BONOS', detalle: `Ejecutó evaluación de bonos para ${mes}/${anio}` }, uid);
        return { message: 'Evaluación exitosa.' };
    }
    async getAuditLogs(fi, ff, uid, mod) {
        const where = {};
        if (fi && ff)
            where.fechaHora = (0, typeorm_2.Between)(new Date(fi + ' 00:00:00'), new Date(ff + ' 23:59:59'));
        if (uid)
            where.usuarioId = uid;
        if (mod && mod !== 'Todos los módulos')
            where.modulo = mod;
        return await this.auditRepository.find({ relations: ['usuario'], order: { fechaHora: 'DESC' }, take: 1000, where });
    }
    async getAdminDashboardStats() {
        const now = new Date();
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60000);
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const [usuariosActivos, usuariosInactivos, eventosAuditoria, intentosFallidos, sesionesActivas] = await Promise.all([
            this.usuarioRepository.count({ where: { estado: 'activo' } }),
            this.usuarioRepository.count({ where: { estado: 'bloqueado' } }),
            this.auditRepository.count(),
            this.auditRepository.count({ where: { accion: (0, typeorm_2.Like)('%FAIL%'), fechaHora: (0, typeorm_2.MoreThan)(startOfToday) } }),
            this.usuarioRepository.count({ where: { ultimoLogin: (0, typeorm_2.MoreThan)(thirtyMinutesAgo), estado: 'activo' } })
        ]);
        return {
            usuariosActivos,
            usuariosBloqueados: usuariosInactivos,
            eventosAuditoria,
            intentosFallidos,
            sesionesActivas: sesionesActivas || 1,
            estadoSistema: 'Óptimo'
        };
    }
    async getRrhhDashboardStats() { return { empleadosActivos: await this.empleadoRepository.count({ where: { activo: true } }), tardiasHoy: 0, permisosPendientes: await this.solicitudPermisoRepository.count({ where: { estado: 'pendiente' } }), vacacionesActivas: 0, empleadosEnRiesgo: 0, elegiblesBono: 0 }; }
    async getSupervisorDashboardStats(sid) { return { empleadosACargo: await this.empleadoRepository.count({ where: { supervisorId: sid, activo: true } }), permisosPendientes: 0, horasPendientes: 0, kpiPromedio: 0 }; }
    async getRoles() { return await this.rolRepository.find(); }
    async getUsers() {
        const users = await this.usuarioRepository.find({
            relations: ['empleado', 'roles', 'empleado.supervisor'],
            order: { username: 'ASC' }
        });
        return users.map(u => ({
            usuarioId: u.usuarioId,
            username: u.username,
            email: u.empleado?.email,
            nombreCompleto: u.empleado ? `${u.empleado.nombres} ${u.empleado.apellidos}` : 'N/A',
            estado: u.estado,
            roles: u.roles?.map(r => r.nombre) || [],
            empleadoCodigo: u.empleado?.codigoEmpleado,
            empleadoId: u.empleadoId,
            supervisorId: u.empleado?.supervisorId,
            supervisorNombre: u.empleado?.supervisor ? `${u.empleado.supervisor.nombres} ${u.empleado.supervisor.apellidos}` : 'No asignado'
        }));
    }
    async getKpiParameters() { const p = await this.parametroRepository.find({ where: { activo: true } }); const r = {}; p.forEach(x => r[x.clave] = x.valor); return r; }
    async updateKpiParameters(dto, uid) {
        for (const [k, v] of Object.entries(dto)) {
            await this.parametroRepository.update({ clave: k }, { valor: v });
        }
        return this.getKpiParameters();
    }
    async createUser(dto, uid) {
        const existingUser = await this.usuarioRepository.findOne({ where: { username: dto.username } });
        if (existingUser)
            throw new common_1.BadRequestException(`El identificador @${dto.username} ya está en uso.`);
        if (dto.empleadoId) {
            const existingByEmp = await this.usuarioRepository.findOne({ where: { empleadoId: dto.empleadoId } });
            if (existingByEmp)
                throw new common_1.BadRequestException(`Esta persona ya cuenta con un acceso activo.`);
        }
        const passwordHash = await bcrypt.hash(dto.password || 'Test1234', 10);
        const user = this.usuarioRepository.create({
            username: dto.username,
            passwordHash,
            empleadoId: dto.empleadoId,
            estado: dto.estado === 'inactivo' ? 'bloqueado' : 'activo'
        });
        const saved = await this.usuarioRepository.save(user);
        if (dto.bossId) {
            await this.empleadoRepository.update(dto.empleadoId, { supervisorId: dto.bossId });
        }
        if (dto.roleId) {
            await this.dataSource.query(`INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@0, @1)`, [saved.usuarioId, dto.roleId]);
        }
        await this.logAction({ modulo: 'ADMIN', accion: 'CREATE', entidad: 'USUARIO', entidadId: saved.usuarioId, detalle: `Creó cuenta: ${saved.username}` }, uid);
        return this.getUsers();
    }
    async updateUser(id, dto, uid) {
        const user = await this.usuarioRepository.findOne({ where: { usuarioId: id } });
        if (!user)
            throw new common_1.NotFoundException('Cuenta no encontrada');
        if (user.username !== dto.username) {
            const existingUser = await this.usuarioRepository.findOne({ where: { username: dto.username, usuarioId: (0, typeorm_2.Not)(id) } });
            if (existingUser)
                throw new common_1.BadRequestException(`El identificador @${dto.username} ya está en uso.`);
        }
        if (user.empleadoId !== dto.empleadoId) {
            const existingByEmp = await this.usuarioRepository.findOne({ where: { empleadoId: dto.empleadoId, usuarioId: (0, typeorm_2.Not)(id) } });
            if (existingByEmp)
                throw new common_1.BadRequestException(`La persona seleccionada ya tiene otra cuenta vinculada.`);
        }
        user.username = dto.username;
        user.estado = dto.estado === 'inactivo' ? 'bloqueado' : 'activo';
        user.empleadoId = dto.empleadoId;
        if (dto.password) {
            user.passwordHash = await bcrypt.hash(dto.password, 10);
        }
        await this.usuarioRepository.save(user);
        if (dto.empleadoId) {
            await this.empleadoRepository.update(dto.empleadoId, { supervisorId: dto.bossId || null });
        }
        if (dto.roleId) {
            await this.dataSource.query(`DELETE FROM USUARIO_ROL WHERE usuario_id = @0`, [id]);
            await this.dataSource.query(`INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@0, @1)`, [id, dto.roleId]);
        }
        await this.logAction({ modulo: 'ADMIN', accion: 'UPDATE', entidad: 'USUARIO', entidadId: id, detalle: `Actualizó cuenta: ${user.username}` }, uid);
        return this.getUsers();
    }
    async updateUserStatus(id, status, uid) {
        const dbStatus = status === 'inactivo' ? 'bloqueado' : 'activo';
        await this.usuarioRepository.update(id, { estado: dbStatus });
        await this.logAction({ modulo: 'ADMIN', accion: dbStatus === 'bloqueado' ? 'BLOCK' : 'ACTIVATE', entidad: 'USUARIO', entidadId: id, detalle: `Cambió estado a ${dbStatus}` }, uid);
        return this.getUsers();
    }
    async resetPassword(id, uid) {
        const hash = await bcrypt.hash('Test1234', 10);
        await this.usuarioRepository.update(id, { passwordHash: hash });
        const user = await this.usuarioRepository.findOne({ where: { usuarioId: id } });
        await this.logAction({ modulo: 'ADMIN', accion: 'RESET_PASSWORD', entidad: 'USUARIO', entidadId: id, detalle: `Reseteó clave de @${user?.username}` }, uid);
        return { message: 'Contraseña restablecida correctamente.' };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(turno_entity_1.Turno)),
    __param(1, (0, typeorm_1.InjectRepository)(empleado_turno_entity_1.EmpleadoTurno)),
    __param(2, (0, typeorm_1.InjectRepository)(tipo_permiso_entity_1.TipoPermiso)),
    __param(3, (0, typeorm_1.InjectRepository)(parametro_sistema_entity_1.ParametroSistema)),
    __param(4, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __param(5, (0, typeorm_1.InjectRepository)(rol_entity_1.Rol)),
    __param(6, (0, typeorm_1.InjectRepository)(regla_bono_entity_1.ReglaBono)),
    __param(7, (0, typeorm_1.InjectRepository)(usuario_entity_1.Usuario)),
    __param(8, (0, typeorm_1.InjectRepository)(empleado_entity_1.Empleado)),
    __param(9, (0, typeorm_1.InjectRepository)(solicitud_permiso_entity_1.SolicitudPermiso)),
    __param(10, (0, typeorm_1.InjectRepository)(registro_asistencia_entity_1.RegistroAsistencia)),
    __param(11, (0, typeorm_1.InjectRepository)(kpi_mensual_entity_1.KpiMensual)),
    __param(12, (0, typeorm_1.InjectRepository)(vacacion_movimiento_entity_1.VacacionMovimiento)),
    __param(13, (0, typeorm_1.InjectRepository)(registro_tiempo_entity_1.RegistroTiempo)),
    __param(14, (0, typeorm_1.InjectRepository)(bono_resultado_entity_1.BonoResultado)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], AdminService);
//# sourceMappingURL=admin.service.js.map