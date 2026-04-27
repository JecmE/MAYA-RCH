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
const vacacion_saldo_entity_1 = require("../../entities/vacacion-saldo.entity");
const registro_tiempo_entity_1 = require("../../entities/registro-tiempo.entity");
const bono_resultado_entity_1 = require("../../entities/bono-resultado.entity");
const rol_permiso_entity_1 = require("../../entities/rol-permiso.entity");
const kpi_service_1 = require("../kpi/kpi.service");
let AdminService = class AdminService {
    constructor(turnoRepository, empleadoTurnoRepository, tipoPermisoRepository, parametroRepository, auditRepository, rolRepository, reglaBonoRepository, usuarioRepository, empleadoRepository, solicitudPermisoRepository, registroAsistenciaRepository, kpiMensualRepository, vacacionMovimientoRepository, vacacionSaldoRepository, registroTiempoRepository, bonoResultadoRepository, rolPermisoRepository, dataSource, kpiService) {
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
        this.vacacionSaldoRepository = vacacionSaldoRepository;
        this.registroTiempoRepository = registroTiempoRepository;
        this.bonoResultadoRepository = bonoResultadoRepository;
        this.rolPermisoRepository = rolPermisoRepository;
        this.dataSource = dataSource;
        this.kpiService = kpiService;
        this.DEFAULT_MODULES = [
            'Auditoria', 'Configuración', 'Empleados', 'Permisos',
            'Planilla', 'Proyectos', 'Reportes', 'Usuarios'
        ];
    }
    async onModuleInit() {
        try {
            await this.ensureCorrectTableStructures();
        }
        catch (e) { }
    }
    async ensureCorrectTableStructures() {
        try {
            await this.dataSource.query(`IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[REGLA_BONO]') AND name = 'monto') BEGIN ALTER TABLE [dbo].[REGLA_BONO] ADD [monto] DECIMAL(10, 2) DEFAULT 0; END`);
        }
        catch (e) { }
    }
    async logAction(dto, uid) {
        const now = new Date();
        const guateOffset = -6 * 60 * 60 * 1000;
        const guateTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + guateOffset);
        return await this.auditRepository.save({ ...dto, usuarioId: uid, fechaHora: guateTime });
    }
    async getKpiParameters() {
        const p = await this.parametroRepository.find({ where: { activo: true } });
        const r = {};
        p.forEach(x => r[x.clave] = x.valor);
        return r;
    }
    async updateKpiParameters(dto, uid) {
        const category = dto.categoryName || 'Configuración';
        const isKpiUpdate = category === 'KPIs y Metas';
        delete dto.categoryName;
        if (dto.dias_vacaciones !== undefined) {
            const newVal = parseInt(dto.dias_vacaciones);
            const empleados = await this.empleadoRepository.find({ where: { activo: true } });
            for (const emp of empleados) {
                let saldo = await this.vacacionSaldoRepository.findOne({ where: { empleadoId: emp.empleadoId } });
                if (!saldo) {
                    saldo = this.vacacionSaldoRepository.create({ empleadoId: emp.empleadoId, diasDisponibles: newVal, diasUsados: 0, fechaCorte: new Date() });
                }
                else {
                    saldo.diasDisponibles = newVal;
                    saldo.diasUsados = 0;
                }
                await this.vacacionSaldoRepository.save(saldo);
                await this.vacacionMovimientoRepository.save({ empleadoId: emp.empleadoId, tipo: vacacion_movimiento_entity_1.VacacionMovimiento.TIPO_AJUSTE, dias: newVal, fecha: new Date(), comentario: `POLÍTICA CORPORATIVA: Ajuste general a ${newVal} días disponibles.` });
            }
        }
        for (const [clave, valor] of Object.entries(dto)) {
            let param = await this.parametroRepository.findOne({ where: { clave } });
            if (param) {
                param.valor = valor;
                param.usuarioIdActualiza = uid;
                await this.parametroRepository.save(param);
            }
            else {
                await this.parametroRepository.save(this.parametroRepository.create({ clave, valor: valor, usuarioIdActualiza: uid, activo: true }));
            }
        }
        if (isKpiUpdate) {
            await this.kpiService.globalRecalculateCurrentMonth();
        }
        await this.logAction({ modulo: 'ADMIN', accion: 'UPDATE_KPI_PARAMETERS', entidad: 'PARAMETROS', detalle: `Sincronización de ${category}.` }, uid);
        return this.getKpiParameters();
    }
    async getRoles() { return await this.rolRepository.find({ order: { nombre: 'ASC' } }); }
    async getRolePermissions(rolId) { const rol = await this.rolRepository.findOne({ where: { rolId } }); if (!rol)
        throw new common_1.NotFoundException('Rol no encontrado'); const dbPerms = await this.rolPermisoRepository.find({ where: { rolId } }); const finalPerms = []; for (const modName of this.DEFAULT_MODULES) {
        let p = dbPerms.find(x => x.modulo.toLowerCase() === modName.toLowerCase());
        if (!p) {
            p = new rol_permiso_entity_1.RolPermiso();
            p.rolId = rolId;
            p.modulo = modName;
            p = await this.rolPermisoRepository.save(p);
        }
        finalPerms.push(p);
    } return finalPerms.sort((a, b) => a.modulo.localeCompare(b.modulo)); }
    async updateRolePermissions(rolId, perms, uid) { for (const p of perms) {
        await this.rolPermisoRepository.update({ rolId, modulo: p.modulo }, { ver: p.ver, crear: p.crear, editar: p.editar, aprobar: p.aprobar, exportar: p.exportar, administrar: p.administrar });
    } return this.getRolePermissions(rolId); }
    async createRole(dto, uid) { return await this.rolRepository.save(this.rolRepository.create(dto)); }
    async deleteRole(id, uid) { const rol = await this.rolRepository.findOne({ where: { rolId: id } }); if (!rol)
        throw new common_1.NotFoundException('Rol no encontrado'); if (['administrador', 'supervisor', 'rrhh', 'empleado'].includes(rol.nombre.toLowerCase()))
        throw new common_1.BadRequestException('No se pueden eliminar roles base.'); await this.rolPermisoRepository.delete({ rolId: id }); await this.rolRepository.delete(id); await this.logAction({ modulo: 'ADMIN', accion: 'DELETE', entidad: 'ROL', entidadId: id, detalle: `Eliminó rol: ${rol.nombre}` }, uid); return { message: 'OK' }; }
    async getUsers() { const users = await this.usuarioRepository.find({ relations: ['empleado', 'roles', 'empleado.supervisor'], order: { username: 'ASC' } }); return users.map(u => ({ usuarioId: u.usuarioId, username: u.username, email: u.empleado?.email, nombreCompleto: u.empleado ? `${u.empleado.nombres} ${u.empleado.apellidos}` : 'N/A', estado: u.estado, roles: u.roles?.map(r => r.nombre) || [], empleadoCodigo: u.empleado?.codigoEmpleado, empleadoId: u.empleadoId, supervisorId: u.empleado?.supervisorId, supervisorNombre: u.empleado?.supervisor ? `${u.empleado.supervisor.nombres} ${u.empleado.supervisor.apellidos}` : 'No asignado' })); }
    async createUser(dto, uid) { const passwordHash = await bcrypt.hash(dto.password || 'Test1234', 10); const user = await this.usuarioRepository.save(this.usuarioRepository.create({ username: dto.username, passwordHash, empleadoId: dto.empleadoId, estado: 'activo' })); if (dto.roleId)
        await this.dataSource.query(`INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@0, @1)`, [user.usuarioId, dto.roleId]); await this.logAction({ modulo: 'ADMIN', accion: 'CREATE', entidad: 'USUARIO', entidadId: user.usuarioId, detalle: `Creó cuenta: ${user.username}` }, uid); return this.getUsers(); }
    async updateUser(id, dto, uid) { const user = await this.usuarioRepository.findOne({ where: { usuarioId: id } }); if (!user)
        throw new common_1.NotFoundException('No encontrado'); user.username = dto.username; user.estado = dto.estado === 'inactivo' ? 'bloqueado' : 'activo'; user.empleadoId = dto.empleadoId; if (dto.password)
        user.passwordHash = await bcrypt.hash(dto.password, 10); await this.usuarioRepository.save(user); if (dto.roleId) {
        await this.dataSource.query(`DELETE FROM USUARIO_ROL WHERE usuario_id = @0`, [id]);
        await this.dataSource.query(`INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@0, @1)`, [id, dto.roleId]);
    } await this.logAction({ modulo: 'ADMIN', accion: 'UPDATE', entidad: 'USUARIO', entidadId: id, detalle: `Actualizó cuenta: ${user.username}` }, uid); return this.getUsers(); }
    async updateUserStatus(id, status, uid) { await this.usuarioRepository.update(id, { estado: status === 'inactivo' ? 'bloqueado' : 'activo' }); await this.logAction({ modulo: 'ADMIN', accion: 'STATUS', entidad: 'USUARIO', entidadId: id, detalle: `Cambio estado a ${status}` }, uid); return this.getUsers(); }
    async resetPassword(id, uid) { const hash = await bcrypt.hash('Test1234', 10); await this.usuarioRepository.update(id, { passwordHash: hash }); const user = await this.usuarioRepository.findOne({ where: { usuarioId: id } }); await this.logAction({ modulo: 'ADMIN', accion: 'RESET', entidad: 'USUARIO', entidadId: id, detalle: `Clave reseteada: @${user?.username}` }, uid); return { message: 'OK' }; }
    async getShifts() { return await this.turnoRepository.find({ order: { nombre: 'ASC' } }); }
    async createShift(dto, uid) { if (!dto.toleranciaMinutos) {
        const g = await this.parametroRepository.findOne({ where: { clave: 'tolerancia_minutos' } });
        dto.toleranciaMinutos = g ? parseInt(g.valor) : 10;
    } const s = await this.turnoRepository.save(this.turnoRepository.create(dto)); await this.logAction({ modulo: 'RRHH', accion: 'CREATE', entidad: 'TURNO', entidadId: s.turnoId, detalle: `Creó turno: ${s.nombre}` }, uid); return this.getShifts(); }
    async updateShift(id, dto, uid) { const existing = await this.turnoRepository.findOne({ where: { turnoId: id } }); if (!existing)
        throw new common_1.NotFoundException('No encontrado'); if (!dto.toleranciaMinutos) {
        const g = await this.parametroRepository.findOne({ where: { clave: 'tolerancia_minutos' } });
        dto.toleranciaMinutos = g ? parseInt(g.valor) : 10;
    } Object.assign(existing, dto); await this.turnoRepository.save(existing); await this.logAction({ modulo: 'RRHH', accion: 'UPDATE', entidad: 'TURNO', entidadId: id, detalle: `Actualizó turno: ${existing.nombre}` }, uid); return this.getShifts(); }
    async deactivateShift(id, uid) { await this.turnoRepository.update(id, { activo: false }); await this.logAction({ modulo: 'RRHH', accion: 'DEACTIVATE', entidad: 'TURNO', entidadId: id, detalle: 'Desactivó turno' }, uid); return { message: 'OK' }; }
    async getAssignments() { const assignments = await this.empleadoTurnoRepository.find({ relations: ['empleado', 'turno'], where: { activo: true }, order: { fechaInicio: 'DESC' } }); return assignments.map(a => ({ id: a.empleadoTurnoId, empleadoNombre: `${a.empleado?.nombres} ${a.empleado?.apellidos}`, turnoNombre: a.turno?.nombre, fechaInicio: a.fechaInicio, activo: a.activo })); }
    async assignShift(dto, uid) { if (dto.id && dto.activo === false) {
        await this.empleadoTurnoRepository.update(dto.id, { activo: false, fechaFin: new Date() });
        await this.logAction({ modulo: 'RRHH', accion: 'FINALIZE', entidad: 'ASIGNACION_TURNO', entidadId: dto.id, detalle: 'Finalizó asignación' }, uid);
        return this.getAssignments();
    } const fInicio = dto.fechaInicio || new Date().toISOString().split('T')[0]; await this.empleadoTurnoRepository.update({ empleadoId: dto.empleadoId }, { activo: false }); const s = await this.empleadoTurnoRepository.save(this.empleadoTurnoRepository.create({ ...dto, fechaInicio: fInicio, activo: true })); await this.logAction({ modulo: 'RRHH', accion: 'ASSIGN', entidad: 'ASIGNACION_TURNO', entidadId: s.empleadoTurnoId, detalle: `Asignó turno` }, uid); return this.getAssignments(); }
    async getBonusRules() { return await this.reglaBonoRepository.find({ order: { monto: 'DESC' } }); }
    async createBonusRule(dto, uid) { const r = await this.reglaBonoRepository.save(this.reglaBonoRepository.create(dto)); await this.logAction({ modulo: 'RRHH', accion: 'CREATE_BONUS_RULE', entidad: 'REGLA_BONO', entidadId: r.reglaBonoId, detalle: `Creó regla: ${r.nombre}` }, uid); return this.getBonusRules(); }
    async updateBonusRule(id, dto, uid) { const existing = await this.reglaBonoRepository.findOne({ where: { reglaBonoId: id } }); if (!existing)
        throw new common_1.NotFoundException('No encontrado'); Object.assign(existing, dto); await this.reglaBonoRepository.save(existing); await this.logAction({ modulo: 'RRHH', accion: 'UPDATE_BONUS_RULE', entidad: 'REGLA_BONO', entidadId: id, detalle: `Actualizó regla: ${existing.nombre}` }, uid); return this.getBonusRules(); }
    async deleteBonusRule(id, uid) { await this.reglaBonoRepository.update(id, { activo: false }); await this.logAction({ modulo: 'RRHH', accion: 'DELETE_BONUS_RULE', entidad: 'REGLA_BONO', entidadId: id, detalle: 'Desactivó regla de bono' }, uid); return this.getBonusRules(); }
    async runBonusEvaluation(mes, anio, uid) { await this.logAction({ modulo: 'RRHH', accion: 'RUN_EVALUATION', entidad: 'BONOS', detalle: `Ejecutó evaluación de bonos para ${mes}/${anio}` }, uid); return { message: 'Evaluación exitosa.' }; }
    async getAuditLogs(fi, ff, uid, mod) { const where = {}; if (fi && ff)
        where.fechaHora = (0, typeorm_2.Between)(new Date(fi + ' 00:00:00'), new Date(ff + ' 23:59:59')); if (uid)
        where.usuarioId = uid; if (mod && mod !== 'Todos los módulos')
        where.modulo = mod; return await this.auditRepository.find({ relations: ['usuario'], order: { fechaHora: 'DESC' }, take: 1000, where }); }
    async getAdminDashboardStats() { const now = new Date(); const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60000); const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0); const [usuariosActivos, usuariosBloqueados, eventosAuditoria, intentosFallidos, sesionesActivas] = await Promise.all([this.usuarioRepository.count({ where: { estado: 'activo' } }), this.usuarioRepository.count({ where: { estado: 'bloqueado' } }), this.auditRepository.count(), this.auditRepository.count({ where: { accion: (0, typeorm_2.Like)('%FAIL%'), fechaHora: (0, typeorm_2.MoreThan)(startOfToday) } }), this.usuarioRepository.count({ where: { ultimoLogin: (0, typeorm_2.MoreThan)(thirtyMinutesAgo), estado: 'activo' } })]); return { usuariosActivos, usuariosBloqueados, eventosAuditoria, intentosFallidos, sesionesActivas: sesionesActivas || 1, estadoSistema: 'Óptimo' }; }
    async getRrhhDashboardStats() { return { empleadosActivos: await this.empleadoRepository.count({ where: { activo: true } }), tardiasHoy: 0, permisosPendientes: await this.solicitudPermisoRepository.count({ where: { estado: 'pendiente' } }), vacacionesActivas: 0, empleadosEnRiesgo: 0, elegiblesBono: 0 }; }
    async getSupervisorDashboardStats(sid) { return { empleadosACargo: await this.empleadoRepository.count({ where: { supervisorId: sid, activo: true } }), permisosPendientes: 0, horasPendientes: 0, kpiPromedio: 0 }; }
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
    __param(13, (0, typeorm_1.InjectRepository)(vacacion_saldo_entity_1.VacacionSaldo)),
    __param(14, (0, typeorm_1.InjectRepository)(registro_tiempo_entity_1.RegistroTiempo)),
    __param(15, (0, typeorm_1.InjectRepository)(bono_resultado_entity_1.BonoResultado)),
    __param(16, (0, typeorm_1.InjectRepository)(rol_permiso_entity_1.RolPermiso)),
    __param(18, (0, common_1.Inject)((0, common_1.forwardRef)(() => kpi_service_1.KpiService))),
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
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        kpi_service_1.KpiService])
], AdminService);
//# sourceMappingURL=admin.service.js.map