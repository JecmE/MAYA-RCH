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
            const checkPK = await this.dataSource.query(`SELECT name FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BONO_RESULTADO]') AND name = 'bono_resultado_id'`);
            if (checkPK.length === 0) {
                await this.dataSource.query(`IF OBJECT_ID(N'[dbo].[BONO_RESULTADO]', N'U') IS NOT NULL DROP TABLE [dbo].[BONO_RESULTADO]`);
                await this.dataSource.query(`CREATE TABLE [dbo].[BONO_RESULTADO] ([bono_resultado_id] INT IDENTITY(1,1) PRIMARY KEY,[empleado_id] INT NOT NULL,[regla_bono_id] INT NOT NULL,[mes] INT NOT NULL,[anio] INT NOT NULL,[elegible] BIT DEFAULT 0,[cumplimiento_pct] DECIMAL(5, 2) DEFAULT 0,[dias_asistidos] INT DEFAULT 0,[dias_laborables] INT DEFAULT 0,[tardias_count] INT DEFAULT 0,[faltas_count] INT DEFAULT 0,[horas_count] DECIMAL(10, 2) DEFAULT 0,[motivo_no_elegible] NVARCHAR(255),[fecha_calculo] DATETIME DEFAULT GETDATE(),CONSTRAINT FK_BONO_EMP FOREIGN KEY (empleado_id) REFERENCES EMPLEADO(empleado_id),CONSTRAINT FK_BONO_REGLA FOREIGN KEY (regla_bono_id) REFERENCES REGLA_BONO(regla_bono_id))`);
            }
        }
        catch (e) { }
    }
    async getShifts() { return await this.turnoRepository.find({ order: { nombre: 'ASC' } }); }
    async createShift(dto, uid) {
        const s = await this.turnoRepository.save(this.turnoRepository.create(dto));
        const saved = Array.isArray(s) ? s[0] : s;
        await this.auditRepository.save({ usuarioId: uid, modulo: 'ADMIN', accion: 'CREATE', entidad: 'TURNO', entidadId: saved.turnoId, detalle: `Turno: ${saved.nombre}` });
        return this.getShifts();
    }
    async updateShift(id, dto, uid) {
        const existing = await this.turnoRepository.findOne({ where: { turnoId: id } });
        if (!existing)
            throw new common_1.NotFoundException('No encontrado');
        const { turnoId, ...data } = dto;
        Object.assign(existing, data);
        await this.turnoRepository.save(existing);
        return this.getShifts();
    }
    async deactivateShift(id, uid) { await this.turnoRepository.update(id, { activo: false }); return { message: 'OK' }; }
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
    async assignShift(dto, uid) {
        if (dto.id && dto.activo === false) {
            await this.empleadoTurnoRepository.update(dto.id, { activo: false, fechaFin: new Date() });
            return this.getAssignments();
        }
        if (dto.empleadoId) {
            const fInicio = dto.fechaInicio || new Date().toISOString().split('T')[0];
            const fFin = dto.fechaFin === '' ? null : dto.fechaFin;
            await this.empleadoTurnoRepository.update({ empleadoId: dto.empleadoId }, { activo: false });
            const newAssignment = this.empleadoTurnoRepository.create({
                empleadoId: dto.empleadoId,
                turnoId: dto.turnoId,
                fechaInicio: fInicio,
                fechaFin: fFin,
                activo: dto.activo !== undefined ? dto.activo : true
            });
            await this.empleadoTurnoRepository.save(newAssignment);
        }
        return this.getAssignments();
    }
    async getBonusRules() { return await this.reglaBonoRepository.find({ order: { monto: 'DESC' } }); }
    async createBonusRule(dto, uid) {
        if (!dto.vigenciaInicio)
            dto.vigenciaInicio = new Date().toISOString().split('T')[0];
        const r = await this.reglaBonoRepository.save(this.reglaBonoRepository.create(dto));
        const saved = Array.isArray(r) ? r[0] : r;
        await this.auditRepository.save({ usuarioId: uid, modulo: 'ADMIN', accion: 'CREATE_BONUS_RULE', entidad: 'REGLA_BONO', entidadId: saved.reglaBonoId, detalle: `Regla: ${saved.nombre}` });
        return this.getBonusRules();
    }
    async updateBonusRule(id, dto, uid) {
        const existing = await this.reglaBonoRepository.findOne({ where: { reglaBonoId: id } });
        if (!existing)
            throw new common_1.NotFoundException('No encontrado');
        const { reglaBonoId, ...data } = dto;
        if (!data.vigenciaInicio)
            data.vigenciaInicio = new Date().toISOString().split('T')[0];
        Object.assign(existing, data);
        await this.reglaBonoRepository.save(existing);
        return this.getBonusRules();
    }
    async deleteBonusRule(id, uid) { await this.reglaBonoRepository.update(id, { activo: false }); return this.getBonusRules(); }
    async runBonusEvaluation(mes, anio, usuarioId) {
        const reglas = await this.reglaBonoRepository.find({ where: { activo: true }, order: { monto: 'DESC', minDiasTrabajados: 'DESC' } });
        const empleados = await this.empleadoRepository.find({ where: { activo: true } });
        if (reglas.length === 0) {
            await this.bonoResultadoRepository.delete({ mes, anio });
            return { message: 'Bonos limpiados.' };
        }
        const today = new Date();
        const fI = new Date(anio, mes - 1, 1);
        const fF = (mes === today.getMonth() + 1 && anio === today.getFullYear()) ? today : new Date(anio, mes, 0);
        let dL = 0;
        const tmp = new Date(fI);
        while (tmp <= fF) {
            if (tmp.getDay() !== 0 && tmp.getDay() !== 6)
                dL++;
            tmp.setDate(tmp.getDate() + 1);
        }
        for (const emp of empleados) {
            const asistencias = await this.registroAsistenciaRepository.find({ where: { empleadoId: emp.empleadoId, fecha: (0, typeorm_2.Between)(fI, fF) } });
            const tD = asistencias.length;
            const tT = asistencias.filter(a => Number(a.minutosTardia) > 0).length;
            const tF = Math.max(0, dL - tD);
            const tH = asistencias.reduce((sum, a) => sum + Number(a.horasTrabajadas || 0), 0);
            const pct = (tD / (dL || 1)) * 100;
            let win = null;
            for (const r of reglas) {
                let ok = true;
                if (pct < (r.minDiasTrabajados || 0))
                    ok = false;
                if (tT > (r.maxTardias ?? 999))
                    ok = false;
                if (tF > (r.maxFaltas ?? 999))
                    ok = false;
                if (tH < (r.minHoras || 0))
                    ok = false;
                if (ok) {
                    win = r;
                    break;
                }
            }
            let res = await this.bonoResultadoRepository.findOne({ where: { empleadoId: emp.empleadoId, mes, anio } });
            if (!res)
                res = this.bonoResultadoRepository.create({ empleadoId: emp.empleadoId, mes, anio });
            res.reglaBonoId = win ? win.reglaBonoId : reglas[reglas.length - 1].reglaBonoId;
            res.elegible = !!win;
            res.cumplimientoPct = Math.round(pct * 100) / 100;
            res.diasAsistidos = tD;
            res.diasLaborables = dL;
            res.tardiasCount = tT;
            res.faltasCount = tF;
            res.horasCount = tH;
            res.motivoNoElegible = win ? 'Cumple criterios de: ' + win.nombre : 'No califica.';
            await this.bonoResultadoRepository.save(res);
        }
        return { message: 'Evaluación exitosa.' };
    }
    async getAuditLogs(fi, ff, uid, mod) {
        const where = {};
        if (fi && ff)
            where.fechaHora = (0, typeorm_2.Between)(new Date(fi), new Date(ff));
        if (uid)
            where.usuarioId = uid;
        if (mod)
            where.modulo = mod;
        return await this.auditRepository.find({ relations: ['usuario'], order: { fechaHora: 'DESC' }, take: 500, where });
    }
    async getAdminDashboardStats() { return { usuariosActivos: await this.usuarioRepository.count({ where: { estado: 'activo' } }), usuariosBloqueados: 0, eventosAuditoria: 0, estadoSistema: 'Óptimo' }; }
    async getRrhhDashboardStats() { return { empleadosActivos: await this.empleadoRepository.count({ where: { activo: true } }), tardiasHoy: 0, permisosPendientes: await this.solicitudPermisoRepository.count({ where: { estado: 'pendiente' } }), vacacionesActivas: 0, empleadosEnRiesgo: 0, empleadosConTurnoInactivo: 0 }; }
    async getSupervisorDashboardStats(sid) { return { empleadosACargo: await this.empleadoRepository.count({ where: { supervisorId: sid, activo: true } }), permisosPendientes: 0, horasPendientes: 0, kpiPromedio: 0 }; }
    async getRoles() { return await this.rolRepository.find(); }
    async getKpiParameters() { const p = await this.parametroRepository.find({ where: { activo: true } }); const r = {}; p.forEach(x => r[x.clave] = x.valor); return r; }
    async updateKpiParameters(dto, uid) { for (const [k, v] of Object.entries(dto)) {
        await this.parametroRepository.update({ clave: k }, { valor: v });
    } return this.getKpiParameters(); }
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