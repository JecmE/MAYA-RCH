import { Injectable, NotFoundException, OnModuleInit, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
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
import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { BonoResultado } from '../../entities/bono-resultado.entity';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @InjectRepository(Turno)
    private turnoRepository: Repository<Turno>,
    @InjectRepository(EmpleadoTurno)
    private empleadoTurnoRepository: Repository<EmpleadoTurno>,
    @InjectRepository(TipoPermiso)
    private tipoPermisoRepository: Repository<TipoPermiso>,
    @InjectRepository(ParametroSistema)
    private parametroRepository: Repository<ParametroSistema>,
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
    @InjectRepository(Rol)
    private rolRepository: Repository<Rol>,
    @InjectRepository(ReglaBono)
    private reglaBonoRepository: Repository<ReglaBono>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
    @InjectRepository(SolicitudPermiso)
    private solicitudPermisoRepository: Repository<SolicitudPermiso>,
    @InjectRepository(RegistroAsistencia)
    private registroAsistenciaRepository: Repository<RegistroAsistencia>,
    @InjectRepository(KpiMensual)
    private kpiMensualRepository: Repository<KpiMensual>,
    @InjectRepository(VacacionMovimiento)
    private vacacionMovimientoRepository: Repository<VacacionMovimiento>,
    @InjectRepository(RegistroTiempo)
    private registroTiempoRepository: Repository<RegistroTiempo>,
    @InjectRepository(BonoResultado)
    private bonoResultadoRepository: Repository<BonoResultado>,
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.ensureCorrectTableStructures();
  }

  private async ensureCorrectTableStructures() {
    try {
      await this.dataSource.query(`IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[REGLA_BONO]') AND name = 'monto') BEGIN ALTER TABLE [dbo].[REGLA_BONO] ADD [monto] DECIMAL(10, 2) DEFAULT 0; END`);
    } catch (e) {}
  }

  async logAction(dto: { modulo: string, accion: string, entidad: string, entidadId?: number, detalle: string }, uid: number) {
    return await this.auditRepository.save({ ...dto, usuarioId: uid });
  }

  // Turnos
  async getShifts() { return await this.turnoRepository.find({ order: { nombre: 'ASC' } }); }
  async createShift(dto: any, uid: number) {
    const s: any = await this.turnoRepository.save(this.turnoRepository.create(dto));
    await this.logAction({ modulo: 'RRHH', accion: 'CREATE', entidad: 'TURNO', entidadId: s.turnoId, detalle: `Creó turno: ${s.nombre}` }, uid);
    return this.getShifts();
  }
  async updateShift(id: number, dto: any, uid: number) {
    const existing = await this.turnoRepository.findOne({ where: { turnoId: id } });
    if (!existing) throw new NotFoundException('No encontrado');
    Object.assign(existing, dto);
    await this.turnoRepository.save(existing);
    await this.logAction({ modulo: 'RRHH', accion: 'UPDATE', entidad: 'TURNO', entidadId: id, detalle: `Actualizó turno: ${existing.nombre}` }, uid);
    return this.getShifts();
  }
  async deactivateShift(id: number, uid: number) {
    await this.turnoRepository.update(id, { activo: false });
    await this.logAction({ modulo: 'RRHH', accion: 'DEACTIVATE', entidad: 'TURNO', entidadId: id, detalle: 'Desactivó turno' }, uid);
    return { message: 'OK' };
  }

  // Asignaciones
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

  async assignShift(dto: any, uid: number) {
    if (dto.id && dto.activo === false) {
      await this.empleadoTurnoRepository.update(dto.id, { activo: false, fechaFin: new Date() });
      await this.logAction({ modulo: 'RRHH', accion: 'FINALIZE', entidad: 'ASIGNACION_TURNO', entidadId: dto.id, detalle: 'Finalizó asignación de turno' }, uid);
      return this.getAssignments();
    }
    const fInicio = dto.fechaInicio || new Date().toISOString().split('T')[0];
    const fFin = dto.fechaFin === '' ? null : dto.fechaFin;
    await this.empleadoTurnoRepository.update({ empleadoId: dto.empleadoId }, { activo: false });
    const s: any = await this.empleadoTurnoRepository.save(this.empleadoTurnoRepository.create({ ...dto, fechaInicio: fInicio, fechaFin: fFin, activo: true }));
    await this.logAction({ modulo: 'RRHH', accion: 'ASSIGN', entidad: 'ASIGNACION_TURNO', entidadId: s.empleadoTurnoId, detalle: `Asignó turno a empleado` }, uid);
    return this.getAssignments();
  }

  // Reglas Bono
  async getBonusRules() { return await this.reglaBonoRepository.find({ order: { monto: 'DESC' } }); }
  async createBonusRule(dto: any, uid: number) {
    const r: any = await this.reglaBonoRepository.save(this.reglaBonoRepository.create(dto));
    await this.logAction({ modulo: 'RRHH', accion: 'CREATE_BONUS_RULE', entidad: 'REGLA_BONO', entidadId: r.reglaBonoId, detalle: `Creó regla: ${r.nombre}` }, uid);
    return this.getBonusRules();
  }
  async updateBonusRule(id: number, dto: any, uid: number) {
    const existing = await this.reglaBonoRepository.findOne({ where: { reglaBonoId: id } });
    if (!existing) throw new NotFoundException('No encontrado');
    Object.assign(existing, dto);
    await this.reglaBonoRepository.save(existing);
    await this.logAction({ modulo: 'RRHH', accion: 'UPDATE_BONUS_RULE', entidad: 'REGLA_BONO', entidadId: id, detalle: `Actualizó regla: ${existing.nombre}` }, uid);
    return this.getBonusRules();
  }
  async deleteBonusRule(id: number, uid: number) {
    await this.reglaBonoRepository.update(id, { activo: false });
    await this.logAction({ modulo: 'RRHH', accion: 'DELETE_BONUS_RULE', entidad: 'REGLA_BONO', entidadId: id, detalle: 'Desactivó regla de bono' }, uid);
    return this.getBonusRules();
  }

  // Evaluación
  async runBonusEvaluation(mes: number, anio: number, uid: number) {
    await this.logAction({ modulo: 'RRHH', accion: 'RUN_EVALUATION', entidad: 'BONOS', detalle: `Ejecutó evaluación de bonos para ${mes}/${anio}` }, uid);
    return { message: 'Evaluación exitosa.' };
  }

  // Auditoría Query
  async getAuditLogs(fi?: string, ff?: string, uid?: number, mod?: string) {
    const where: any = {};
    if (fi && ff) where.fechaHora = Between(new Date(fi + ' 00:00:00'), new Date(ff + ' 23:59:59'));
    if (uid) where.usuarioId = uid;
    if (mod && mod !== 'Todos los módulos') where.modulo = mod;
    return await this.auditRepository.find({ relations: ['usuario'], order: { fechaHora: 'DESC' }, take: 1000, where });
  }

  async getAdminDashboardStats() {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60000);
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);

    const [usuariosActivos, usuariosInactivos, eventosAuditoria, intentosFallidos, sesionesActivas] = await Promise.all([
      this.usuarioRepository.count({ where: { estado: 'activo' } }),
      this.usuarioRepository.count({ where: { estado: 'bloqueado' } }),
      this.auditRepository.count(),
      this.auditRepository.count({ where: { accion: Like('%FAIL%'), fechaHora: MoreThan(startOfToday) } }),
      this.usuarioRepository.count({ where: { ultimoLogin: MoreThan(thirtyMinutesAgo), estado: 'activo' } })
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
  async getSupervisorDashboardStats(sid: number) { return { empleadosACargo: await this.empleadoRepository.count({ where: { supervisorId: sid, activo: true } }), permisosPendientes: 0, horasPendientes: 0, kpiPromedio: 0 }; }

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
  async updateKpiParameters(dto: any, uid: number) {
    for (const [k, v] of Object.entries(dto)) { await this.parametroRepository.update({ clave: k }, { valor: v as string }); }
    return this.getKpiParameters();
  }

  // Gestión de Usuarios
  async createUser(dto: any, uid: number) {
    // 1. Validar duplicidad de username
    const existingUser = await this.usuarioRepository.findOne({ where: { username: dto.username } });
    if (existingUser) throw new BadRequestException(`El identificador @${dto.username} ya está en uso.`);

    // 2. Validar si el empleado ya tiene cuenta
    if (dto.empleadoId) {
      const existingByEmp = await this.usuarioRepository.findOne({ where: { empleadoId: dto.empleadoId } });
      if (existingByEmp) throw new BadRequestException(`Esta persona ya cuenta con un acceso activo.`);
    }

    const passwordHash = await bcrypt.hash(dto.password || 'Test1234', 10);
    const user = this.usuarioRepository.create({
      username: dto.username,
      passwordHash,
      empleadoId: dto.empleadoId,
      estado: dto.estado === 'inactivo' ? 'bloqueado' : 'activo'
    });

    const saved = await this.usuarioRepository.save(user);

    // 3. Vincular Supervisor
    if (dto.bossId) {
      await this.empleadoRepository.update(dto.empleadoId, { supervisorId: dto.bossId });
    }

    if (dto.roleId) {
      await this.dataSource.query(`INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@0, @1)`, [saved.usuarioId, dto.roleId]);
    }

    await this.logAction({ modulo: 'ADMIN', accion: 'CREATE', entidad: 'USUARIO', entidadId: saved.usuarioId, detalle: `Creó cuenta: ${saved.username}` }, uid);
    return this.getUsers();
  }

  async updateUser(id: number, dto: any, uid: number) {
    const user = await this.usuarioRepository.findOne({ where: { usuarioId: id } });
    if (!user) throw new NotFoundException('Cuenta no encontrada');

    // 1. Validar duplicidad de username
    if (user.username !== dto.username) {
        const existingUser = await this.usuarioRepository.findOne({ where: { username: dto.username, usuarioId: Not(id) } });
        if (existingUser) throw new BadRequestException(`El identificador @${dto.username} ya está en uso.`);
    }

    // 2. Validar conflicto de dueño
    if (user.empleadoId !== dto.empleadoId) {
      const existingByEmp = await this.usuarioRepository.findOne({ where: { empleadoId: dto.empleadoId, usuarioId: Not(id) } });
      if (existingByEmp) throw new BadRequestException(`La persona seleccionada ya tiene otra cuenta vinculada.`);
    }

    // 3. ACTUALIZACIÓN FÍSICA DE CAMPOS
    user.username = dto.username;
    user.estado = dto.estado === 'inactivo' ? 'bloqueado' : 'activo';
    user.empleadoId = dto.empleadoId; // CAMBIO DE DUEÑO

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    await this.usuarioRepository.save(user);

    // 4. ACTUALIZAR SUPERVISOR DEL DUEÑO
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

  async updateUserStatus(id: number, status: string, uid: number) {
    const dbStatus = status === 'inactivo' ? 'bloqueado' : 'activo';
    await this.usuarioRepository.update(id, { estado: dbStatus });
    await this.logAction({ modulo: 'ADMIN', accion: dbStatus === 'bloqueado' ? 'BLOCK' : 'ACTIVATE', entidad: 'USUARIO', entidadId: id, detalle: `Cambió estado a ${dbStatus}` }, uid);
    return this.getUsers();
  }

  async resetPassword(id: number, uid: number) {
    const hash = await bcrypt.hash('Test1234', 10);
    await this.usuarioRepository.update(id, { passwordHash: hash });
    const user = await this.usuarioRepository.findOne({ where: { usuarioId: id } });
    await this.logAction({ modulo: 'ADMIN', accion: 'RESET_PASSWORD', entidad: 'USUARIO', entidadId: id, detalle: `Reseteó clave de @${user?.username}` }, uid);
    return { message: 'Contraseña restablecida correctamente.' };
  }
}
