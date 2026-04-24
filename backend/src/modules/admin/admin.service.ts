import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  IsNull,
  Not,
  MoreThanOrEqual,
  MoreThan,
  LessThanOrEqual,
  Between,
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

@Injectable()
export class AdminService {
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
  ) {}

  async getShifts() {
    const turnos = await this.turnoRepository.find({
      order: { nombre: 'ASC' },
    });

    return turnos.map((t) => ({
      turnoId: t.turnoId,
      nombre: t.nombre,
      horaEntrada: t.horaEntrada,
      horaSalida: t.horaSalida,
      toleranciaMinutos: t.toleranciaMinutos,
      horasEsperadasDia: t.horasEsperadasDia,
      dias: t.dias,
      activo: t.activo
    }));
  }

  async createShift(createDto: any, usuarioId: number) {
    const turno = this.turnoRepository.create({
      ...createDto,
      dias: Array.isArray(createDto.dias) ? createDto.dias.join(',') : createDto.dias
    });
    const saved = (await this.turnoRepository.save(turno)) as unknown as Turno;

    await this.auditRepository.save({
      usuarioId,
      modulo: 'ADMIN',
      accion: 'CREATE_SHIFT',
      entidad: 'TURNO',
      entidadId: saved.turnoId,
      detalle: `Turno creado: ${saved.nombre}`,
    });

    return this.getShifts();
  }

  async updateShift(id: number, updateDto: any, usuarioId: number) {
    const turno = await this.turnoRepository.findOne({
      where: { turnoId: id },
    });

    if (!turno) {
      throw new NotFoundException('Turno no encontrado');
    }

    const updateData = { ...updateDto };
    if (updateData.dias && Array.isArray(updateData.dias)) {
      updateData.dias = updateData.dias.join(',');
    }

    Object.assign(turno, updateData);
    await this.turnoRepository.save(turno);

    await this.auditRepository.save({
      usuarioId,
      modulo: 'ADMIN',
      accion: 'UPDATE_SHIFT',
      entidad: 'TURNO',
      entidadId: id,
      detalle: `Turno actualizado: ${turno.nombre}`,
    });

    return this.getShifts();
  }

  async deactivateShift(id: number, usuarioId: number) {
    const turno = await this.turnoRepository.findOne({
      where: { turnoId: id },
    });

    if (!turno) {
      throw new NotFoundException('Turno no encontrado');
    }

    turno.activo = false;
    await this.turnoRepository.save(turno);

    await this.auditRepository.save({
      usuarioId,
      modulo: 'ADMIN',
      accion: 'DEACTIVATE_SHIFT',
      entidad: 'TURNO',
      entidadId: id,
      detalle: `Turno desactivado: ${turno.nombre}`,
    });

    return { message: 'Turno desactivado' };
  }

  async getAssignments() {
    // Usamos una consulta personalizada para obtener solo la asignación más reciente de cada empleado
    // y evitar duplicados en la lista de RRHH.
    const query = this.empleadoTurnoRepository
      .createQueryBuilder('et')
      .innerJoinAndSelect('et.empleado', 'e')
      .innerJoinAndSelect('et.turno', 't')
      .where(qb => {
        const subQuery = qb
          .subQuery()
          .select('MAX(st.empleadoTurnoId)')
          .from(EmpleadoTurno, 'st')
          .groupBy('st.empleadoId')
          .getQuery();
        return 'et.empleadoTurnoId IN ' + subQuery;
      })
      .orderBy('e.nombres', 'ASC');

    const assignments = await query.getMany();

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

  async assignShift(assignDto: any, usuarioId: number) {
    if (assignDto.id) {
      const existing = await this.empleadoTurnoRepository.findOne({ where: { empleadoTurnoId: assignDto.id } });
      if (existing) {
        existing.activo = assignDto.activo !== undefined ? assignDto.activo : false;
        if (!existing.activo) existing.fechaFin = new Date();
        else existing.fechaFin = null;
        await this.empleadoTurnoRepository.save(existing);
        return this.getAssignments();
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(assignDto.fechaInicio);
    startDate.setHours(0, 0, 0, 0);

    if (startDate <= today) {
      // REGLA 1: Cambio inmediato. Desactivamos TODO lo anterior.
      await this.empleadoTurnoRepository.update(
        { empleadoId: assignDto.empleadoId },
        { activo: false, fechaFin: new Date() }
      );
    } else {
      // REGLA 2: Cambio futuro. Borramos cualquier otra programación pendiente (mañana en adelante)
      // para que este nuevo sea el único que "gane".
      const futureAssignments = await this.empleadoTurnoRepository.find({
        where: { empleadoId: assignDto.empleadoId, activo: true }
      });

      for (const fa of futureAssignments) {
        const faDate = new Date(fa.fechaInicio);
        faDate.setHours(0,0,0,0);
        if (faDate > today) {
           // Si no tiene asistencias vinculadas, lo borramos. Si tiene (raro), lo desactivamos.
           await this.empleadoTurnoRepository.delete(fa.empleadoTurnoId).catch(() => {
             this.empleadoTurnoRepository.update(fa.empleadoTurnoId, { activo: false });
           });
        }
      }
    }

    // Insertamos el nuevo horario (El que "olvida" a los demás)
    const assignment = this.empleadoTurnoRepository.create({
      empleadoId: assignDto.empleadoId,
      turnoId: assignDto.turnoId,
      fechaInicio: assignDto.fechaInicio,
      fechaFin: null,
      activo: assignDto.activo !== undefined ? assignDto.activo : true
    });

    await this.empleadoTurnoRepository.save(assignment);
    return this.getAssignments();
  }

  async getKpiParameters() {
    const parametros = await this.parametroRepository.find({
      where: { activo: true },
    });

    const result: any = {};

    for (const p of parametros) {
      result[p.clave] = p.valor;
    }

    return result;
  }

  async updateKpiParameters(updateDto: any, usuarioId: number) {
    for (const [clave, valor] of Object.entries(updateDto)) {
      let parametro = await this.parametroRepository.findOne({
        where: { clave },
      });

      if (parametro) {
        parametro.valor = valor as string;
        await this.parametroRepository.save(parametro);
      } else {
        parametro = this.parametroRepository.create({
          clave,
          valor: valor as string,
          usuarioIdActualiza: usuarioId,
          activo: true,
        });
        await this.parametroRepository.save(parametro);
      }
    }

    await this.auditRepository.save({
      usuarioId,
      modulo: 'ADMIN',
      accion: 'UPDATE_PARAMETERS',
      entidad: 'PARAMETRO_SISTEMA',
      detalle: 'Parámetros de KPI actualizados',
    });

    return this.getKpiParameters();
  }

  async getBonusRules() {
    const reglas = await this.reglaBonoRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });

    return reglas.map((r) => ({
      reglaBonoId: r.reglaBonoId,
      nombre: r.nombre,
      activo: r.activo,
      minDiasTrabajados: r.minDiasTrabajados,
      maxTardias: r.maxTardias,
      maxFaltas: r.maxFaltas,
      minHoras: r.minHoras,
      vigenciaInicio: r.vigenciaInicio,
      vigenciaFin: r.vigenciaFin,
    }));
  }

  async createBonusRule(createDto: any, usuarioId: number) {
    const regla = this.reglaBonoRepository.create(createDto);
    const saved = (await this.reglaBonoRepository.save(regla)) as unknown as ReglaBono;

    await this.auditRepository.save({
      usuarioId,
      modulo: 'ADMIN',
      accion: 'CREATE_BONUS_RULE',
      entidad: 'REGLA_BONO',
      entidadId: saved.reglaBonoId,
      detalle: `Regla de bono creada: ${saved.nombre}`,
    });

    return this.getBonusRules();
  }

  async getAuditLogs(fechaInicio?: string, fechaFin?: string, usuarioId?: number, modulo?: string) {
    const where: any = {};

    if (fechaInicio && fechaFin) {
      where.fechaHora = new Date(fechaInicio);
    } else if (fechaFin) {
      where.fechaHora = new Date(fechaFin);
    }

    if (usuarioId) {
      where.usuarioId = usuarioId;
    }

    if (modulo) {
      where.modulo = modulo;
    }

    const logs = await this.auditRepository.find({
      where,
      relations: ['usuario'],
      order: { fechaHora: 'DESC' },
      take: 500,
    });

    return logs.map((l) => ({
      auditId: l.auditId,
      fechaHora: l.fechaHora,
      usuario: 'Sistema',
      modulo: l.modulo,
      accion: l.accion,
      entidad: l.entidad,
      entidadId: l.entidadId,
      detalle: l.detalle,
    }));
  }

  async getRoles() {
    const roles = await this.rolRepository.find();
    return roles.map((r) => ({
      rolId: r.rolId,
      nombre: r.nombre,
      descripcion: r.descripcion,
    }));
  }

  async getAdminDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [activeUsers, blockedUsers, auditEventsToday] = await Promise.all([
      this.usuarioRepository.count({ where: { estado: 'activo' } }),
      this.usuarioRepository.count({ where: { estado: Not('activo') } }),
      this.auditRepository.count({
        where: { fechaHora: MoreThanOrEqual(today) },
      }),
    ]);

    return {
      usuariosActivos: activeUsers,
      usuariosBloqueados: blockedUsers,
      eventosAuditoria: auditEventsToday,
      estadoSistema: 'Óptimo',
    };
  }

  async getRrhhDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const [activeEmployees, pendingPermissions, tardiasToday, employeesAtRisk, activeVacations, employeesWithInactiveShifts] =
      await Promise.all([
        this.empleadoRepository.count({ where: { activo: true } }),
        this.solicitudPermisoRepository.count({ where: { estado: 'pendiente' } }),
        this.registroAsistenciaRepository.count({
          where: {
            fecha: today as any,
            minutosTardia: MoreThan(0),
          },
        }),
        this.kpiMensualRepository
          .createQueryBuilder('kpi')
          .where('kpi.anio = :anio', { anio: currentYear })
          .andWhere('kpi.mes = :mes', { mes: currentMonth })
          .andWhere('kpi.clasificacion IN (:...clasificaciones)', {
            clasificaciones: ['En riesgo', 'En observacion'],
          })
          .getCount(),
        this.solicitudPermisoRepository
          .createQueryBuilder('sp')
          .innerJoin('sp.tipoPermiso', 'tp')
          .where('sp.estado = :estado', { estado: 'aprobado' })
          .andWhere('tp.descuentaVacaciones = :descuenta', { descuenta: 1 })
          .andWhere(':today BETWEEN sp.fechaInicio AND sp.fechaFin', { today })
          .getCount(),
        this.empleadoTurnoRepository
          .createQueryBuilder('et')
          .innerJoin('et.turno', 't')
          .where('et.activo = :activeAssignment', { activeAssignment: true })
          .andWhere('t.activo = :inactiveShift', { inactiveShift: false })
          .getCount(),
      ]);

    return {
      empleadosActivos: activeEmployees,
      tardiasHoy: tardiasToday,
      permisosPendientes: pendingPermissions,
      vacacionesActivas: activeVacations,
      empleadosEnRiesgo: employeesAtRisk,
      empleadosConTurnoInactivo: employeesWithInactiveShifts,
    };
  }

  async getSupervisorDashboardStats(supervisorId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const [teamSize, pendingPermissions, teamTardias, teamKpis, pendingTimesheets] =
      await Promise.all([
        this.empleadoRepository.count({ where: { supervisorId, activo: true } }),
        this.solicitudPermisoRepository
          .createQueryBuilder('sp')
          .innerJoin('sp.empleado', 'emp')
          .where('emp.supervisorId = :supervisorId', { supervisorId })
          .andWhere('sp.estado = :estado', { estado: 'pendiente' })
          .getCount(),
        this.registroAsistenciaRepository
          .createQueryBuilder('ra')
          .innerJoin('ra.empleado', 'emp')
          .where('emp.supervisorId = :supervisorId', { supervisorId })
          .andWhere('ra.fecha >= :today', { today })
          .andWhere('ra.fecha < :tomorrow', { tomorrow })
          .andWhere('ra.minutosTardia > 0')
          .getCount(),
        this.kpiMensualRepository
          .createQueryBuilder('kpi')
          .innerJoin('kpi.empleado', 'emp')
          .where('emp.supervisorId = :supervisorId', { supervisorId })
          .andWhere('kpi.anio = :anio', { anio: currentYear })
          .andWhere('kpi.mes = :mes', { mes: currentMonth })
          .select('AVG(kpi.cumplimientoPct)', 'avgCumplimiento')
          .getRawOne(),
        this.registroTiempoRepository
          .createQueryBuilder('rt')
          .innerJoin('rt.empleado', 'emp')
          .where('emp.supervisorId = :supervisorId', { supervisorId })
          .andWhere('rt.estado = :estado', { estado: 'pendiente' })
          .getCount(),
      ]);

    return {
      empleadosACargo: teamSize,
      permisosPendientes: pendingPermissions,
      horasPendientes: pendingTimesheets,
      kpiPromedio: teamKpis?.avgCumplimiento ? Math.round(Number(teamKpis.avgCumplimiento)) : 0,
    };
  }
}
