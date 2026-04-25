import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  DataSource,
  Like,
  Not,
  MoreThanOrEqual,
  MoreThan,
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
      const checkPK = await this.dataSource.query(`SELECT name FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BONO_RESULTADO]') AND name = 'bono_resultado_id'`);
      if (checkPK.length === 0) {
        await this.dataSource.query(`IF OBJECT_ID(N'[dbo].[BONO_RESULTADO]', N'U') IS NOT NULL DROP TABLE [dbo].[BONO_RESULTADO]`);
        await this.dataSource.query(`CREATE TABLE [dbo].[BONO_RESULTADO] ([bono_resultado_id] INT IDENTITY(1,1) PRIMARY KEY,[empleado_id] INT NOT NULL,[regla_bono_id] INT NOT NULL,[mes] INT NOT NULL,[anio] INT NOT NULL,[elegible] BIT DEFAULT 0,[cumplimiento_pct] DECIMAL(5, 2) DEFAULT 0,[dias_asistidos] INT DEFAULT 0,[dias_laborables] INT DEFAULT 0,[tardias_count] INT DEFAULT 0,[faltas_count] INT DEFAULT 0,[horas_count] DECIMAL(10, 2) DEFAULT 0,[motivo_no_elegible] NVARCHAR(255),[fecha_calculo] DATETIME DEFAULT GETDATE(),CONSTRAINT FK_BONO_EMP FOREIGN KEY (empleado_id) REFERENCES EMPLEADO(empleado_id),CONSTRAINT FK_BONO_REGLA FOREIGN KEY (regla_bono_id) REFERENCES REGLA_BONO(regla_bono_id))`);
      }
    } catch (e) {}
  }

  // Turnos
  async getShifts() { return await this.turnoRepository.find({ order: { nombre: 'ASC' } }); }
  async createShift(dto: any, uid: number) {
    const s = await this.turnoRepository.save(this.turnoRepository.create(dto));
    const saved = Array.isArray(s) ? s[0] : s;
    await this.auditRepository.save({ usuarioId: uid, modulo: 'ADMIN', accion: 'CREATE', entidad: 'TURNO', entidadId: saved.turnoId, detalle: `Turno: ${saved.nombre}` });
    return this.getShifts();
  }
  async updateShift(id: number, dto: any, uid: number) {
    const existing = await this.turnoRepository.findOne({ where: { turnoId: id } });
    if (!existing) throw new NotFoundException('No encontrado');
    const { turnoId, ...data } = dto;
    Object.assign(existing, data);
    await this.turnoRepository.save(existing);
    return this.getShifts();
  }
  async deactivateShift(id: number, uid: number) { await this.turnoRepository.update(id, { activo: false }); return { message: 'OK' }; }

  // Asignaciones
  async getAssignments() {
    const assignments = await this.empleadoTurnoRepository.find({
      relations: ['empleado', 'turno'],
      where: { activo: true },
      order: { fechaInicio: 'DESC' }
    });

    return assignments.map(a => ({
      id: a.empleadoTurnoId,
      empleadoId: a.empleadoId,
      empleadoNombre: `${a.empleado?.nombres} ${a.empleado?.apellidos}`,
      turnoId: a.turnoId,
      turnoNombre: a.turno?.nombre,
      fechaInicio: a.fechaInicio,
      fechaFin: a.fechaFin,
      activo: a.activo
    }));
  }

  async assignShift(dto: any, uid: number) {
    // Si es una finalización (solo viene ID y activo: false)
    if (dto.id && dto.activo === false) {
      await this.empleadoTurnoRepository.update(dto.id, { activo: false, fechaFin: new Date() });
      return this.getAssignments();
    }

    // Si es nueva asignación
    if (dto.empleadoId) {
      // 1. Limpiar fechas vacías
      const fInicio = dto.fechaInicio || new Date().toISOString().split('T')[0];
      const fFin = dto.fechaFin === '' ? null : dto.fechaFin;

      // 2. Desactivar turnos anteriores del empleado
      await this.empleadoTurnoRepository.update({ empleadoId: dto.empleadoId }, { activo: false });

      // 3. Crear nueva asignación limpia
      const newAssignment = this.empleadoTurnoRepository.create({
        empleadoId: dto.empleadoId,
        turnoId: dto.turnoId,
        fechaInicio: fInicio as any,
        fechaFin: fFin as any,
        activo: dto.activo !== undefined ? dto.activo : true
      });

      await this.empleadoTurnoRepository.save(newAssignment);
    }

    return this.getAssignments();
  }

  // Reglas
  async getBonusRules() { return await this.reglaBonoRepository.find({ order: { monto: 'DESC' } }); }
  async createBonusRule(dto: any, uid: number) {
    if (!dto.vigenciaInicio) dto.vigenciaInicio = new Date().toISOString().split('T')[0];
    const r = await this.reglaBonoRepository.save(this.reglaBonoRepository.create(dto));
    const saved = Array.isArray(r) ? r[0] : r;
    await this.auditRepository.save({ usuarioId: uid, modulo: 'ADMIN', accion: 'CREATE_BONUS_RULE', entidad: 'REGLA_BONO', entidadId: saved.reglaBonoId, detalle: `Regla: ${saved.nombre}` });
    return this.getBonusRules();
  }
  async updateBonusRule(id: number, dto: any, uid: number) {
    const existing = await this.reglaBonoRepository.findOne({ where: { reglaBonoId: id } });
    if (!existing) throw new NotFoundException('No encontrado');
    const { reglaBonoId, ...data } = dto;
    if (!data.vigenciaInicio) data.vigenciaInicio = new Date().toISOString().split('T')[0];
    Object.assign(existing, data);
    await this.reglaBonoRepository.save(existing);
    return this.getBonusRules();
  }
  async deleteBonusRule(id: number, uid: number) { await this.reglaBonoRepository.update(id, { activo: false }); return this.getBonusRules(); }

  // Evaluación
  async runBonusEvaluation(mes: number, anio: number, usuarioId: number) {
    const reglas = await this.reglaBonoRepository.find({ where: { activo: true }, order: { monto: 'DESC', minDiasTrabajados: 'DESC' } });
    const empleados = await this.empleadoRepository.find({ where: { activo: true } });
    if (reglas.length === 0) { await this.bonoResultadoRepository.delete({ mes, anio }); return { message: 'Bonos limpiados.' }; }

    const today = new Date();
    const fI = new Date(anio, mes - 1, 1);
    const fF = (mes === today.getMonth() + 1 && anio === today.getFullYear()) ? today : new Date(anio, mes, 0);

    let dL = 0; const tmp = new Date(fI);
    while(tmp <= fF) { if (tmp.getDay() !== 0 && tmp.getDay() !== 6) dL++; tmp.setDate(tmp.getDate() + 1); }

    for (const emp of empleados) {
      const asistencias = await this.registroAsistenciaRepository.find({ where: { empleadoId: emp.empleadoId, fecha: Between(fI, fF) as any } });
      const tD = asistencias.length;
      const tT = asistencias.filter(a => Number(a.minutosTardia) > 0).length;
      const tF = Math.max(0, dL - tD);
      const tH = asistencias.reduce((sum, a) => sum + Number(a.horasTrabajadas || 0), 0);
      const pct = (tD / (dL || 1)) * 100;

      let win = null;
      for (const r of reglas) {
        let ok = true;
        if (pct < (r.minDiasTrabajados || 0)) ok = false;
        if (tT > (r.maxTardias ?? 999)) ok = false;
        if (tF > (r.maxFaltas ?? 999)) ok = false;
        if (tH < (r.minHoras || 0)) ok = false;
        if (ok) { win = r; break; }
      }

      let res = await this.bonoResultadoRepository.findOne({ where: { empleadoId: emp.empleadoId, mes, anio } });
      if (!res) res = this.bonoResultadoRepository.create({ empleadoId: emp.empleadoId, mes, anio });

      res.reglaBonoId = win ? win.reglaBonoId : reglas[reglas.length - 1].reglaBonoId;
      res.elegible = !!win;
      res.cumplimientoPct = Math.round(pct * 100) / 100;
      res.diasAsistidos = tD; res.diasLaborables = dL; res.tardiasCount = tT; res.faltasCount = tF; res.horasCount = tH;
      res.motivoNoElegible = win ? 'Cumple criterios de: ' + win.nombre : 'No califica.';
      await this.bonoResultadoRepository.save(res);
    }
    return { message: 'Evaluación exitosa.' };
  }

  // Auditoría
  async getAuditLogs(fi?: string, ff?: string, uid?: number, mod?: string) {
    const where: any = {};
    if (fi && ff) where.fechaHora = Between(new Date(fi), new Date(ff));
    if (uid) where.usuarioId = uid;
    if (mod) where.modulo = mod;
    return await this.auditRepository.find({ relations: ['usuario'], order: { fechaHora: 'DESC' }, take: 500, where });
  }

  async getAdminDashboardStats() {
    const [usuariosActivos, usuariosBloqueados, eventosAuditoria] = await Promise.all([
      this.usuarioRepository.count({ where: { estado: 'activo' } }),
      this.usuarioRepository.count({ where: { estado: 'bloqueado' } }),
      this.auditRepository.count()
    ]);

    return {
      usuariosActivos,
      usuariosBloqueados,
      eventosAuditoria,
      intentosFallidos: 0, // Mock for now
      sesionesActivas: 0, // Mock for now
      estadoSistema: 'Óptimo'
    };
  }
  async getRrhhDashboardStats() { return { empleadosActivos: await this.empleadoRepository.count({ where: { activo: true } }), tardiasHoy: 0, permisosPendientes: await this.solicitudPermisoRepository.count({ where: { estado: 'pendiente' } }), vacacionesActivas: 0, empleadosEnRiesgo: 0, empleadosConTurnoInactivo: 0 }; }
  async getSupervisorDashboardStats(sid: number) { return { empleadosACargo: await this.empleadoRepository.count({ where: { supervisorId: sid, activo: true } }), permisosPendientes: 0, horasPendientes: 0, kpiPromedio: 0 }; }
  async getRoles() { return await this.rolRepository.find(); }
  async getKpiParameters() { const p = await this.parametroRepository.find({ where: { activo: true } }); const r = {}; p.forEach(x => r[x.clave] = x.valor); return r; }
  async updateKpiParameters(dto: any, uid: number) { for (const [k, v] of Object.entries(dto)) { await this.parametroRepository.update({ clave: k }, { valor: v as string }); } return this.getKpiParameters(); }
}
