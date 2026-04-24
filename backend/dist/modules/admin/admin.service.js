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
let AdminService = class AdminService {
    constructor(turnoRepository, empleadoTurnoRepository, tipoPermisoRepository, parametroRepository, auditRepository, rolRepository, reglaBonoRepository, usuarioRepository, empleadoRepository, solicitudPermisoRepository, registroAsistenciaRepository, kpiMensualRepository, vacacionMovimientoRepository, registroTiempoRepository) {
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
    }
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
    async createShift(createDto, usuarioId) {
        const turno = this.turnoRepository.create({
            ...createDto,
            dias: Array.isArray(createDto.dias) ? createDto.dias.join(',') : createDto.dias
        });
        const saved = (await this.turnoRepository.save(turno));
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
    async updateShift(id, updateDto, usuarioId) {
        const turno = await this.turnoRepository.findOne({
            where: { turnoId: id },
        });
        if (!turno) {
            throw new common_1.NotFoundException('Turno no encontrado');
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
    async deactivateShift(id, usuarioId) {
        const turno = await this.turnoRepository.findOne({
            where: { turnoId: id },
        });
        if (!turno) {
            throw new common_1.NotFoundException('Turno no encontrado');
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
        const query = this.empleadoTurnoRepository
            .createQueryBuilder('et')
            .innerJoinAndSelect('et.empleado', 'e')
            .innerJoinAndSelect('et.turno', 't')
            .where(qb => {
            const subQuery = qb
                .subQuery()
                .select('MAX(st.empleadoTurnoId)')
                .from(empleado_turno_entity_1.EmpleadoTurno, 'st')
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
    async assignShift(assignDto, usuarioId) {
        if (assignDto.id) {
            const existing = await this.empleadoTurnoRepository.findOne({ where: { empleadoTurnoId: assignDto.id } });
            if (existing) {
                existing.activo = assignDto.activo !== undefined ? assignDto.activo : false;
                if (!existing.activo)
                    existing.fechaFin = new Date();
                else
                    existing.fechaFin = null;
                await this.empleadoTurnoRepository.save(existing);
                return this.getAssignments();
            }
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(assignDto.fechaInicio);
        startDate.setHours(0, 0, 0, 0);
        if (startDate <= today) {
            await this.empleadoTurnoRepository.update({ empleadoId: assignDto.empleadoId }, { activo: false, fechaFin: new Date() });
        }
        else {
            const futureAssignments = await this.empleadoTurnoRepository.find({
                where: { empleadoId: assignDto.empleadoId, activo: true }
            });
            for (const fa of futureAssignments) {
                const faDate = new Date(fa.fechaInicio);
                faDate.setHours(0, 0, 0, 0);
                if (faDate > today) {
                    await this.empleadoTurnoRepository.delete(fa.empleadoTurnoId).catch(() => {
                        this.empleadoTurnoRepository.update(fa.empleadoTurnoId, { activo: false });
                    });
                }
            }
        }
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
        const result = {};
        for (const p of parametros) {
            result[p.clave] = p.valor;
        }
        return result;
    }
    async updateKpiParameters(updateDto, usuarioId) {
        for (const [clave, valor] of Object.entries(updateDto)) {
            let parametro = await this.parametroRepository.findOne({
                where: { clave },
            });
            if (parametro) {
                parametro.valor = valor;
                await this.parametroRepository.save(parametro);
            }
            else {
                parametro = this.parametroRepository.create({
                    clave,
                    valor: valor,
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
    async createBonusRule(createDto, usuarioId) {
        const regla = this.reglaBonoRepository.create(createDto);
        const saved = (await this.reglaBonoRepository.save(regla));
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
    async getAuditLogs(fechaInicio, fechaFin, usuarioId, modulo) {
        const where = {};
        if (fechaInicio && fechaFin) {
            where.fechaHora = new Date(fechaInicio);
        }
        else if (fechaFin) {
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
            this.usuarioRepository.count({ where: { estado: (0, typeorm_2.Not)('activo') } }),
            this.auditRepository.count({
                where: { fechaHora: (0, typeorm_2.MoreThanOrEqual)(today) },
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
        const [activeEmployees, pendingPermissions, tardiasToday, employeesAtRisk, activeVacations, employeesWithInactiveShifts] = await Promise.all([
            this.empleadoRepository.count({ where: { activo: true } }),
            this.solicitudPermisoRepository.count({ where: { estado: 'pendiente' } }),
            this.registroAsistenciaRepository.count({
                where: {
                    fecha: today,
                    minutosTardia: (0, typeorm_2.MoreThan)(0),
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
    async getSupervisorDashboardStats(supervisorId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        const [teamSize, pendingPermissions, teamTardias, teamKpis, pendingTimesheets] = await Promise.all([
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
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map