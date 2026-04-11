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

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Turno)
    private turnoRepository: Repository<Turno>,
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
  ) {}

  async getShifts() {
    const turnos = await this.turnoRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });

    return turnos.map((t) => ({
      turnoId: t.turnoId,
      nombre: t.nombre,
      horaEntrada: t.horaEntrada,
      horaSalida: t.horaSalida,
      toleranciaMinutos: t.toleranciaMinutos,
      horasEsperadasDia: t.horasEsperadasDia,
    }));
  }

  async createShift(createDto: any, usuarioId: number) {
    const turno = this.turnoRepository.create(createDto);
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

    Object.assign(turno, updateDto);
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

    const [activeEmployees, pendingPermissions, tardiasToday, employeesAtRisk, activeVacations] =
      await Promise.all([
        this.empleadoRepository.count({ where: { activo: true } }),
        this.solicitudPermisoRepository.count({ where: { estado: 'pendiente' } }),
        this.registroAsistenciaRepository.count({
          where: {
            fecha: Between(today, tomorrow),
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
        this.vacacionMovimientoRepository
          .createQueryBuilder('vm')
          .innerJoin('vm.solicitud', 's')
          .where('s.estado = :estado', { estado: 'aprobado' })
          .andWhere('vm.fechaInicio <= :today', { today })
          .andWhere('vm.fechaFin >= :today', { today })
          .getCount(),
      ]);

    return {
      empleadosActivos: activeEmployees,
      tardiasHoy: tardiasToday,
      permisosPendientes: pendingPermissions,
      vacacionesActivas: activeVacations,
      empleadosEnRiesgo: employeesAtRisk,
    };
  }

  async getSupervisorDashboardStats(supervisorId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const [teamSize, pendingPermissions, teamTardias, teamKpis] = await Promise.all([
      this.empleadoRepository.count({ where: { supervisorId } }),
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
    ]);

    return {
      empleadosACargo: teamSize,
      permisosPendientes: pendingPermissions,
      horasPendientes: 0,
      kpiPromedio: teamKpis?.avgCumplimiento ? Math.round(Number(teamKpis.avgCumplimiento)) : 0,
    };
  }
}
