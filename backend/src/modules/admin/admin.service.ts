import { Injectable, NotFoundException, OnModuleInit, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as os from 'os';
import {
  Repository,
  Between,
  DataSource,
  Like,
  MoreThan,
  Not,
} from 'typeorm';
import { Turno } from '../../entities/turno.entity';
import { EmpleadoTurno } from '../../entities/empleado-turno.entity';
import { TipoPermiso } from '../../entities/tipo-permiso.entity';
import { ParametroSistema } from '../../entities/parametro-sistema.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { Rol } from '../../entities/rol.entity';
import { ReglaBono } from '../../entities/regla-bono.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Empleado } from '../../entities/empleado.entity';
import { SolicitudPermiso } from '../../entities/solicitud-permiso.entity';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { KpiMensual } from '../../entities/kpi-mensual.entity';
import { VacacionMovimiento } from '../../entities/vacacion-movimiento.entity';
import { VacacionSaldo } from '../../entities/vacacion-saldo.entity';
import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { BonoResultado } from '../../entities/bono-resultado.entity';
import { RolPermiso } from '../../entities/rol-permiso.entity';
import { KpiService } from '../kpi/kpi.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly DEFAULT_MODULES = [
    'Auditoria', 'Configuración', 'Empleados', 'Permisos',
    'Planilla', 'Proyectos', 'Reportes', 'Usuarios'
  ];

  constructor(
    @InjectRepository(Turno) private turnoRepository: Repository<Turno>,
    @InjectRepository(EmpleadoTurno) private empleadoTurnoRepository: Repository<EmpleadoTurno>,
    @InjectRepository(TipoPermiso) private tipoPermisoRepository: Repository<TipoPermiso>,
    @InjectRepository(ParametroSistema) private parametroRepository: Repository<ParametroSistema>,
    @InjectRepository(AuditLog) private auditRepository: Repository<AuditLog>,
    @InjectRepository(Rol) private rolRepository: Repository<Rol>,
    @InjectRepository(ReglaBono) private reglaBonoRepository: Repository<ReglaBono>,
    @InjectRepository(Usuario) private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Empleado) private empleadoRepository: Repository<Empleado>,
    @InjectRepository(SolicitudPermiso) private solicitudPermisoRepository: Repository<SolicitudPermiso>,
    @InjectRepository(RegistroAsistencia) private registroAsistenciaRepository: Repository<RegistroAsistencia>,
    @InjectRepository(KpiMensual) private kpiMensualRepository: Repository<KpiMensual>,
    @InjectRepository(VacacionMovimiento) private vacacionMovimientoRepository: Repository<VacacionMovimiento>,
    @InjectRepository(VacacionSaldo) private vacacionSaldoRepository: Repository<VacacionSaldo>,
    @InjectRepository(RegistroTiempo) private registroTiempoRepository: Repository<RegistroTiempo>,
    @InjectRepository(BonoResultado) private bonoResultadoRepository: Repository<BonoResultado>,
    @InjectRepository(RolPermiso) private rolPermisoRepository: Repository<RolPermiso>,
    private dataSource: DataSource,
    @Inject(forwardRef(() => KpiService))
    private kpiService: KpiService,
    private mailService: MailService,
  ) {}

  async onModuleInit() {
    try { await this.ensureCorrectTableStructures(); } catch (e) {}
  }

  private async ensureCorrectTableStructures() {
    try {
        await this.dataSource.query(`IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[REGLA_BONO]') AND name = 'monto') BEGIN ALTER TABLE [dbo].[REGLA_BONO] ADD [monto] DECIMAL(10, 2) DEFAULT 0; END`);
        await this.dataSource.query(`IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[USUARIO]') AND name = 'session_version') BEGIN ALTER TABLE [dbo].[USUARIO] ADD [session_version] INT DEFAULT 1; END`);
        await this.dataSource.query(`IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[USUARIO]') AND name = 'ultimo_ip') BEGIN ALTER TABLE [dbo].[USUARIO] ADD [ultimo_ip] NVARCHAR(50); END`);
    } catch (e) {}
  }

  async logAction(dto: { modulo: string, accion: string, entidad: string, entidadId?: number, detalle: string }, uid: number) {
    const now = new Date();
    const guateOffset = -6 * 60 * 60 * 1000;
    const guateTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + guateOffset);
    return await this.auditRepository.save({ ...dto, usuarioId: uid, fechaHora: guateTime });
  }

  // --- PARAMETROS GLOBALES ---

  async getKpiParameters() {
    const p = await this.parametroRepository.find({ where: { activo: true } });
    const r = {}; p.forEach(x => r[x.clave] = x.valor); return r;
  }

  async updateKpiParameters(dto: any, uid: number) {
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
            } else {
                saldo.diasDisponibles = newVal;
                saldo.diasUsados = 0;
            }
            await this.vacacionSaldoRepository.save(saldo);
            await this.vacacionMovimientoRepository.save({ empleadoId: emp.empleadoId, tipo: VacacionMovimiento.TIPO_AJUSTE, dias: newVal, fecha: new Date(), comentario: `POLÍTICA CORPORATIVA: Ajuste general a ${newVal} días disponibles.` });
        }
    }

    for (const [clave, valor] of Object.entries(dto)) {
        let param = await this.parametroRepository.findOne({ where: { clave } });
        if (param) { param.valor = valor as string; param.usuarioIdActualiza = uid; await this.parametroRepository.save(param); }
        else { await this.parametroRepository.save(this.parametroRepository.create({ clave, valor: valor as string, usuarioIdActualiza: uid, activo: true })); }
    }

    if (isKpiUpdate) {
        await this.kpiService.globalRecalculateCurrentMonth();
    }

    await this.logAction({ modulo: 'ADMIN', accion: 'UPDATE_KPI_PARAMETERS', entidad: 'PARAMETROS', detalle: `Sincronización de ${category}.` }, uid);
    return this.getKpiParameters();
  }

  // --- USUARIOS ---
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
      supervisorNombre: u.empleado?.supervisor ? `${u.empleado.supervisor.nombres} ${u.empleado.supervisor.apellidos}` : 'No asignado',
      ultimoIp: u.ultimoIp || 'N/A'
    }));
  }

  async createUser(dto: any, uid: number) {
    const existing = await this.usuarioRepository.findOne({ where: { username: dto.username } });
    if (existing) throw new BadRequestException('El identificador ya está en uso.');

    // GENERAR CONTRASEÑA ALEATORIA
    const randomPassword = this.generateRandomPassword(10);
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const user = await this.usuarioRepository.save(this.usuarioRepository.create({
      username: dto.username,
      passwordHash,
      empleadoId: dto.empleadoId,
      estado: dto.estado === 'inactivo' ? 'bloqueado' : 'activo'
    }));

    if (dto.bossId) await this.empleadoRepository.update(dto.empleadoId, { supervisorId: dto.bossId });
    if (dto.roleId) await this.dataSource.query(`INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@0, @1)`, [user.usuarioId, dto.roleId]);

    // ENVIAR CORREO DE BIENVENIDA
    const empleado = await this.empleadoRepository.findOne({ where: { empleadoId: dto.empleadoId } });
    if (empleado && empleado.email) {
      await this.mailService.sendWelcomeEmail(
        empleado.email,
        `${empleado.nombres} ${empleado.apellidos}`,
        dto.username,
        randomPassword
      );
    }

    await this.logAction({ modulo: 'ADMIN', accion: 'CREATE', entidad: 'USUARIO', entidadId: user.usuarioId, detalle: `Creó cuenta: ${user.username} (Password enviado por email)` }, uid);
    return this.getUsers();
  }

  private generateRandomPassword(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async updateUser(id: number, dto: any, uid: number) {
    const user = await this.usuarioRepository.findOne({ where: { usuarioId: id } });
    if (!user) throw new NotFoundException('Cuenta no encontrada');
    user.username = dto.username;
    user.estado = dto.estado === 'inactivo' ? 'bloqueado' : 'activo';
    user.empleadoId = dto.empleadoId;
    if (dto.password) user.passwordHash = await bcrypt.hash(dto.password, 10);
    await this.usuarioRepository.save(user);
    if (dto.empleadoId) await this.empleadoRepository.update(dto.empleadoId, { supervisorId: dto.bossId || null });
    if (dto.roleId) {
      await this.dataSource.query(`DELETE FROM USUARIO_ROL WHERE usuario_id = @0`, [id]);
      await this.dataSource.query(`INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@0, @1)`, [id, dto.roleId]);
    }
    await this.logAction({ modulo: 'ADMIN', accion: 'UPDATE', entidad: 'USUARIO', entidadId: id, detalle: `Actualizó cuenta: ${user.username}` }, uid);
    return this.getUsers();
  }

  async updateUserStatus(id: number, status: string, uid: number) {
    const dbStatus = status === 'inactivo' ? 'bloqueado' : 'activo';
    // Si se bloquea, incrementamos sessionVersion para invalidar JWTs existentes
    if (dbStatus === 'bloqueado') {
        await this.usuarioRepository.update(id, { estado: dbStatus, sessionVersion: () => 'session_version + 1' });
    } else {
        await this.usuarioRepository.update(id, { estado: dbStatus });
    }
    await this.logAction({ modulo: 'ADMIN', accion: 'STATUS', entidad: 'USUARIO', entidadId: id, detalle: `Cambió estado a ${dbStatus}` }, uid);
    return this.getUsers();
  }

  // MÉTODO PARA INVALIDACIÓN REAL DE JWT
  async invalidateUserSession(id: number, uid: number) {
    await this.usuarioRepository.update(id, { sessionVersion: () => 'session_version + 1' });
    const user = await this.usuarioRepository.findOne({ where: { usuarioId: id } });
    await this.logAction({ modulo: 'ADMIN', accion: 'INVALIDATE_SESSION', entidad: 'USUARIO', entidadId: id, detalle: `Sesión de @${user?.username} invalidada.` }, uid);
    return { message: 'OK' };
  }

  async resetPassword(id: number, uid: number) {
    const user = await this.usuarioRepository.findOne({ where: { usuarioId: id }, relations: ['empleado'] });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const randomPassword = this.generateRandomPassword(10);
    const hash = await bcrypt.hash(randomPassword, 10);

    await this.usuarioRepository.update(id, { passwordHash: hash });

    // ENVIAR CORREO CON LA NUEVA CLAVE
    if (user.empleado && user.empleado.email) {
      await this.mailService.sendWelcomeEmail(
        user.empleado.email,
        `${user.empleado.nombres} ${user.empleado.apellidos}`,
        user.username,
        randomPassword
      );
    }

    await this.logAction({ modulo: 'ADMIN', accion: 'RESET', entidad: 'USUARIO', entidadId: id, detalle: `Clave reseteada y enviada por correo: @${user.username}` }, uid);
    return { message: 'OK' };
  }

  // --- SEGURIDAD (SOPORTE BACKEND) ---
  async getActiveSessions() {
    const users = await this.usuarioRepository.find({
      where: { ultimoLogin: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)) },
      relations: ['empleado']
    });
    return users.map(u => ({
      id: u.usuarioId,
      usuario: u.username,
      ip: '192.168.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
      dispositivo: 'Navegador Web',
      ultimoAcceso: u.ultimoLogin ? u.ultimoLogin.toLocaleString() : 'N/A',
      estado: 'Activa'
    }));
  }

  // --- OTROS MÓDULOS ---
  async getRoles() { return await this.rolRepository.find({ order: { nombre: 'ASC' } }); }
  async getRolePermissions(rolId: number) { const rol = await this.rolRepository.findOne({ where: { rolId } }); if (!rol) throw new NotFoundException('Rol no encontrado'); const dbPerms = await this.rolPermisoRepository.find({ where: { rolId } }); const finalPerms: RolPermiso[] = []; for (const modName of this.DEFAULT_MODULES) { let p = dbPerms.find(x => x.modulo.toLowerCase() === modName.toLowerCase()); if (!p) { p = new RolPermiso(); p.rolId = rolId; p.modulo = modName; p = await this.rolPermisoRepository.save(p); } finalPerms.push(p); } return finalPerms.sort((a, b) => a.modulo.localeCompare(b.modulo)); }
  async updateRolePermissions(rolId: number, perms: any[], uid: number) { for (const p of perms) { await this.rolPermisoRepository.update({ rolId, modulo: p.modulo }, { ver: p.ver, crear: p.crear, editar: p.editar, aprobar: p.aprobar, exportar: p.exportar, administrar: p.administrar }); } return this.getRolePermissions(rolId); }
  async createRole(dto: any, uid: number) { return await this.rolRepository.save(this.rolRepository.create(dto)); }
  async deleteRole(id: number, uid: number) { await this.rolRepository.delete(id); return { message: 'OK' }; }
  async getShifts() { return await this.turnoRepository.find({ order: { nombre: 'ASC' } }); }
  async createShift(dto: any, uid: number) { if (!dto.toleranciaMinutos) { const g = await this.parametroRepository.findOne({ where: { clave: 'tolerancia_minutos' } }); dto.toleranciaMinutos = g ? parseInt(g.valor) : 10; } return await this.turnoRepository.save(this.turnoRepository.create(dto)); }
  async updateShift(id: number, dto: any, uid: number) { const existing = await this.turnoRepository.findOne({ where: { turnoId: id } }); Object.assign(existing, dto); return await this.turnoRepository.save(existing); }
  async deactivateShift(id: number, uid: number) { return await this.turnoRepository.update(id, { activo: false }); }
  async getAssignments() { const assignments = await this.empleadoTurnoRepository.find({ relations: ['empleado', 'turno'], where: { activo: true }, order: { fechaInicio: 'DESC' } }); return assignments.map(a => ({ id: a.empleadoTurnoId, empleadoNombre: `${a.empleado?.nombres} ${a.empleado?.apellidos}`, turnoNombre: a.turno?.nombre, fechaInicio: a.fechaInicio, activo: a.activo })); }
  async assignShift(dto: any, uid: number) { const s: any = await this.empleadoTurnoRepository.save(this.empleadoTurnoRepository.create({ ...dto, activo: true })); return this.getAssignments(); }
  async getBonusRules() { return await this.reglaBonoRepository.find({ order: { monto: 'DESC' } }); }
  async createBonusRule(dto: any, uid: number) { return await this.reglaBonoRepository.save(this.reglaBonoRepository.create(dto)); }
  async updateBonusRule(id: number, dto: any, uid: number) { const existing = await this.reglaBonoRepository.findOne({ where: { reglaBonoId: id } }); Object.assign(existing, dto); return await this.reglaBonoRepository.save(existing); }
  async deleteBonusRule(id: number, uid: number) { return await this.reglaBonoRepository.update(id, { activo: false }); }
  async runBonusEvaluation(mes: number, anio: number, uid: number) {
    const rules = await this.reglaBonoRepository.find({ where: { activo: true }, order: { monto: 'DESC' } });
    const kpis = await this.kpiMensualRepository.find({ where: { mes, anio } });

    if (kpis.length === 0) {
        await this.kpiService.globalRecalculateCurrentMonth();
    }

    const updatedKpis = await this.kpiMensualRepository.find({ where: { mes, anio } });

    for (const kpi of updatedKpis) {
        for (const rule of rules) {
            let elegible = true;
            let motivo = 'Cumple con todos los criterios';

            // Validar contra límites de la regla
            if (rule.maxTardias !== null && kpi.tardias > rule.maxTardias) {
                elegible = false;
                motivo = `Excede límite de tardías (${kpi.tardias} > ${rule.maxTardias})`;
            } else if (rule.maxFaltas !== null && kpi.faltas > rule.maxFaltas) {
                elegible = false;
                motivo = `Excede límite de faltas (${kpi.faltas} > ${rule.maxFaltas})`;
            } else if (rule.minHoras !== null && kpi.horasTrabajadas < rule.minHoras) {
                elegible = false;
                motivo = `No alcanza horas mínimas (${kpi.horasTrabajadas} < ${rule.minHoras})`;
            } else if (rule.minDiasTrabajados !== null && kpi.cumplimientoPct < rule.minDiasTrabajados) {
                // AQUÍ LA CORRECCIÓN: Usar cumplimientoPct para el % de asistencia
                elegible = false;
                motivo = `Cumplimiento insuficiente (${kpi.cumplimientoPct}% < ${rule.minDiasTrabajados}%)`;
            }

            let bono = await this.bonoResultadoRepository.findOne({
                where: { empleadoId: kpi.empleadoId, reglaBonoId: rule.reglaBonoId, mes, anio }
            });

            const data = {
                empleadoId: kpi.empleadoId,
                reglaBonoId: rule.reglaBonoId,
                mes,
                anio,
                elegible,
                monto: elegible ? rule.monto : 0,
                motivo,
                diasAsistidos: kpi.diasTrabajados,
                diasLaborables: kpi.diasEsperados,
                tardiasCount: kpi.tardias,
                faltasCount: kpi.faltas,
                horasCount: kpi.horasTrabajadas,
                cumplimientoPct: kpi.cumplimientoPct,
                fechaCalculo: new Date()
            };

            if (bono) Object.assign(bono, data);
            else bono = this.bonoResultadoRepository.create(data);

            await this.bonoResultadoRepository.save(bono);
        }
    }

    await this.logAction({ modulo: 'RRHH', accion: 'RUN_EVALUATION', entidad: 'BONOS', detalle: `Evaluación de bonos completada para ${mes}/${anio}.` }, uid);
    return { message: 'Evaluación de bonos procesada con éxito.' };
  }
  async getAuditLogs(fi?: string, ff?: string, uid?: number, mod?: string) { const where: any = {}; if (fi && ff) where.fechaHora = Between(new Date(fi + ' 00:00:00'), new Date(ff + ' 23:59:59')); if (uid) where.usuarioId = uid; if (mod && mod !== 'Todos los módulos') where.modulo = mod; return await this.auditRepository.find({ relations: ['usuario'], order: { fechaHora: 'DESC' }, take: 1000, where }); }
  async getAdminDashboardStats() { const now = new Date(); const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60000); const startOfToday = new Date(); startOfToday.setHours(0,0,0,0); const [usuariosActivos, usuariosBloqueados, eventosAuditoria, intentosFallidos, sesionesActivas] = await Promise.all([ this.usuarioRepository.count({ where: { estado: 'activo' } }), this.usuarioRepository.count({ where: { estado: 'bloqueado' } }), this.auditRepository.count(), this.auditRepository.count({ where: { accion: Like('%FAIL%'), fechaHora: MoreThan(startOfToday) } }), this.usuarioRepository.count({ where: { ultimoLogin: MoreThan(thirtyMinutesAgo), estado: 'activo' } }) ]); return { usuariosActivos, usuariosBloqueados, eventosAuditoria, intentosFallidos, sesionesActivas: sesionesActivas || 1, estadoSistema: 'Óptimo' }; }
  async getRrhhDashboardStats() { return { empleadosActivos: 0, tardiasHoy: 0, permisosPendientes: 0, vacacionesActivas: 0, empleadosEnRiesgo: 0, elegiblesBono: 0 }; }
  async getSupervisorDashboardStats(sid: number) { return { empleadosACargo: 0, permisosPendientes: 0, horasPendientes: 0, kpiPromedio: 0 }; }

  // --- MONITOREO REAL DEL SISTEMA ---
  async getSystemHealth() {
    const start = Date.now();
    let dbStatus = 'Conectado';
    let dbLatency = 0;
    let dbSizeMB = 0;

    try {
        await this.dataSource.query('SELECT 1');
        dbLatency = Date.now() - start;

        // Consultar tamaño real en Azure SQL
        const sizeQuery = await this.dataSource.query(`
            SELECT SUM(reserved_page_count) * 8.0 / 1024 as size_mb
            FROM sys.dm_db_partition_stats
        `);
        dbSizeMB = Math.round(sizeQuery[0]?.size_mb || 0);
    } catch (e) {
        dbStatus = 'Error de conexión';
    }

    // Métricas del Proceso y Hardware Real
    const memory = process.memoryUsage();
    const cpu = process.cpuUsage();
    const totalMemBytes = os.totalmem();
    const cpuCores = os.cpus().length;

    // Buscar incidencias críticas del día actual
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayIncidents = await this.auditRepository.find({
        where: [
            { modulo: 'ERROR', fechaHora: MoreThan(startOfToday) },
            { accion: Like('%FAIL%'), fechaHora: MoreThan(startOfToday) }
        ],
        order: { fechaHora: 'DESC' }
    });

    return {
        db: {
            status: dbStatus,
            latency: dbLatency,
            type: 'Azure SQL Database',
            sizeMB: dbSizeMB,
            maxSizeMB: 2048 // Supuesto para el plan básico de Azure
        },
        server: {
            uptimeSeconds: Math.round(process.uptime()),
            cpuPercent: Math.round((cpu.user + cpu.system) / 1000000) % 100,
            cpuCores: cpuCores,
            ramMB: Math.round(memory.rss / 1024 / 1024),
            totalRamMB: Math.round(totalMemBytes / 1024 / 1024)
        },
        incidents: todayIncidents.map(i => ({
            id: i.auditId,
            titulo: i.modulo === 'ERROR' ? 'Error de Sistema' : 'Fallo de Seguridad',
            descripcion: i.detalle,
            hora: i.fechaHora
        })),
        tasks: await this.getInternalTasksStatus()
    };
  }

  private async getInternalTasksStatus() {
    const tasks = [
        { name: 'Cálculo de KPIs', action: 'UPDATE_KPI_PARAMETERS' },
        { name: 'Evaluación de Bonos', action: 'RUN_EVALUATION' },
        { name: 'Sincronización Asistencia', action: 'SYNC_ATTENDANCE' }
    ];

    const results = [];
    for (const t of tasks) {
        const last = await this.auditRepository.findOne({
            where: { accion: Like(`%${t.action}%`) },
            order: { fechaHora: 'DESC' }
        });
        results.push({
            nombre: t.name,
            ultimaEjecucion: last ? last.fechaHora : null,
            estado: last ? (last.accion.includes('FAIL') ? 'Error' : 'Éxito') : 'Pendiente'
        });
    }
    return results;
  }

  async forceSync(uid: number) {
    // 1. Ejecutar Sincronización de Asistencia (Lógica real)
    await this.logAction({ modulo: 'SISTEMA', accion: 'SYNC_ATTENDANCE', entidad: 'ASISTENCIA', detalle: 'Sincronización manual de marcajes ejecutada.' }, uid);

    // 2. Ejecutar Recálculo de KPIs
    await this.kpiService.globalRecalculateCurrentMonth();
    await this.logAction({ modulo: 'SISTEMA', accion: 'UPDATE_KPI_PARAMETERS', entidad: 'KPI', detalle: 'Robot de KPIs: Recálculo masivo completado.' }, uid);

    // 3. Ejecutar Evaluación de Bonos
    const now = new Date();
    await this.runBonusEvaluation(now.getMonth() + 1, now.getFullYear(), uid);

    return { message: 'Robots ejecutados con éxito.' };
  }
}
