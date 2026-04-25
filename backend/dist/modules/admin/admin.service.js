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
            await this.dataSource.query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[REGLA_BONO]') AND name = 'monto')
        BEGIN
            ALTER TABLE [dbo].[REGLA_BONO] ADD [monto] DECIMAL(10, 2) DEFAULT 0;
        END
      `);
            const checkPK = await this.dataSource.query(`
        SELECT name FROM sys.columns
        WHERE object_id = OBJECT_ID(N'[dbo].[BONO_RESULTADO]')
        AND name = 'bono_resultado_id'
      `);
            if (checkPK.length === 0) {
                console.log('🔄 Reconstruyendo tabla BONO_RESULTADO para sincronizar columnas...');
                await this.dataSource.query(`IF OBJECT_ID(N'[dbo].[BONO_RESULTADO]', N'U') IS NOT NULL DROP TABLE [dbo].[BONO_RESULTADO]`);
                await this.dataSource.query(`
          CREATE TABLE [dbo].[BONO_RESULTADO] (
            [bono_resultado_id] INT IDENTITY(1,1) PRIMARY KEY,
            [empleado_id] INT NOT NULL,
            [regla_bono_id] INT NOT NULL,
            [mes] INT NOT NULL,
            [anio] INT NOT NULL,
            [elegible] BIT DEFAULT 0,
            [cumplimiento_pct] DECIMAL(5, 2) DEFAULT 0,
            [motivo_no_elegible] NVARCHAR(255),
            [fecha_calculo] DATETIME DEFAULT GETDATE(),
            CONSTRAINT FK_BONO_EMP FOREIGN KEY (empleado_id) REFERENCES EMPLEADO(empleado_id),
            CONSTRAINT FK_BONO_REGLA FOREIGN KEY (regla_bono_id) REFERENCES REGLA_BONO(regla_bono_id)
          )
        `);
            }
        }
        catch (e) { }
    }
    async getShifts() {
        return await this.turnoRepository.find({ order: { nombre: 'ASC' } });
    }
    async createShift(createDto, usuarioId) {
        const turno = this.turnoRepository.create(createDto);
        const saved = await this.turnoRepository.save(turno);
        const s = Array.isArray(saved) ? saved[0] : saved;
        await this.auditRepository.save({
            usuarioId, modulo: 'ADMIN', accion: 'CREATE',
            entidad: 'TURNO', entidadId: s.turnoId,
            detalle: `Turno creado: ${s.nombre}`,
        });
        return this.getShifts();
    }
    async updateShift(id, updateDto, usuarioId) {
        const turno = await this.turnoRepository.findOne({ where: { turnoId: id } });
        if (!turno)
            throw new common_1.NotFoundException('Turno no encontrado');
        Object.assign(turno, updateDto);
        await this.turnoRepository.save(turno);
        await this.auditRepository.save({
            usuarioId, modulo: 'ADMIN', accion: 'UPDATE',
            entidad: 'TURNO', entidadId: id,
            detalle: `Turno actualizado: ${turno.nombre}`,
        });
        return this.getShifts();
    }
    async deactivateShift(id, usuarioId) {
        const turno = await this.turnoRepository.findOne({ where: { turnoId: id } });
        if (!turno)
            throw new common_1.NotFoundException('Turno no encontrado');
        turno.activo = false;
        await this.turnoRepository.save(turno);
        await this.auditRepository.save({
            usuarioId, modulo: 'ADMIN', accion: 'DEACTIVATE',
            entidad: 'TURNO', entidadId: id,
            detalle: `Turno desactivado: ${turno.nombre}`,
        });
        return { message: 'Desactivado' };
    }
    async getBonusRules() {
        return await this.reglaBonoRepository.find({ order: { monto: 'DESC' } });
    }
    async createBonusRule(createDto, usuarioId) {
        const regla = this.reglaBonoRepository.create(createDto);
        const saved = await this.reglaBonoRepository.save(regla);
        const r = Array.isArray(saved) ? saved[0] : saved;
        await this.auditRepository.save({
            usuarioId, modulo: 'ADMIN', accion: 'CREATE_BONUS_RULE',
            entidad: 'REGLA_BONO', entidadId: r.reglaBonoId,
            detalle: `Regla creada: ${r.nombre}`,
        });
        return this.getBonusRules();
    }
    async updateBonusRule(id, updateDto, usuarioId) {
        const regla = await this.reglaBonoRepository.findOne({ where: { reglaBonoId: id } });
        if (!regla)
            throw new common_1.NotFoundException('No encontrado');
        Object.assign(regla, updateDto);
        await this.reglaBonoRepository.save(regla);
        await this.auditRepository.save({
            usuarioId, modulo: 'ADMIN', accion: 'UPDATE_BONUS_RULE',
            entidad: 'REGLA_BONO', entidadId: id,
            detalle: `Regla actualizada: ${regla.nombre}`,
        });
        return this.getBonusRules();
    }
    async deleteBonusRule(id, usuarioId) {
        const regla = await this.reglaBonoRepository.findOne({ where: { reglaBonoId: id } });
        if (!regla)
            throw new common_1.NotFoundException('No encontrado');
        regla.activo = false;
        await this.reglaBonoRepository.save(regla);
        return this.getBonusRules();
    }
    async runBonusEvaluation(mes, anio, usuarioId) {
        const reglas = await this.reglaBonoRepository.find({
            where: { activo: true },
            order: { monto: 'DESC', minDiasTrabajados: 'DESC' }
        });
        const empleados = await this.empleadoRepository.find({ where: { activo: true } });
        if (reglas.length === 0) {
            await this.bonoResultadoRepository.delete({ mes, anio });
            return { message: 'Todos los bonos han sido desactivados al no haber reglas vigentes.' };
        }
        const today = new Date();
        const fechaInicio = new Date(anio, mes - 1, 1);
        const fechaFin = (mes === today.getMonth() + 1 && anio === today.getFullYear()) ? today : new Date(anio, mes, 0);
        let diasLaborables = 0;
        const temp = new Date(fechaInicio);
        while (temp <= fechaFin) {
            if (temp.getDay() !== 0 && temp.getDay() !== 6)
                diasLaborables++;
            temp.setDate(temp.getDate() + 1);
        }
        for (const emp of empleados) {
            const asistencias = await this.registroAsistenciaRepository.find({
                where: { empleadoId: emp.empleadoId, fecha: (0, typeorm_2.Between)(fechaInicio, fechaFin) }
            });
            const totalDiasAsistidos = asistencias.length;
            const totalTardias = asistencias.filter(a => a.minutosTardia > 0).length;
            const totalFaltas = Math.max(0, diasLaborables - totalDiasAsistidos);
            const totalHoras = asistencias.reduce((sum, a) => sum + Number(a.horasTrabajadas || 0), 0);
            const pctAsistencia = (totalDiasAsistidos / (diasLaborables || 1)) * 100;
            let reglaGanadora = null;
            for (const r of reglas) {
                let cumple = true;
                if (pctAsistencia < (r.minDiasTrabajados || 0))
                    cumple = false;
                if (totalTardias > (r.maxTardias ?? 999))
                    cumple = false;
                if (totalFaltas > (r.maxFaltas ?? 999))
                    cumple = false;
                if (totalHoras < (r.minHoras || 0))
                    cumple = false;
                if (cumple) {
                    reglaGanadora = r;
                    break;
                }
            }
            let resultado = await this.bonoResultadoRepository.findOne({ where: { empleadoId: emp.empleadoId, mes, anio } });
            if (!resultado) {
                resultado = this.bonoResultadoRepository.create({ empleadoId: emp.empleadoId, mes, anio, fechaCalculo: new Date() });
            }
            resultado.reglaBonoId = reglaGanadora ? reglaGanadora.reglaBonoId : reglas[reglas.length - 1].reglaBonoId;
            resultado.elegible = !!reglaGanadora;
            resultado.cumplimientoPct = Math.round(pctAsistencia * 100) / 100;
            resultado.motivoNoElegible = reglaGanadora ? 'Cumple criterios de: ' + reglaGanadora.nombre : 'No califica.';
            await this.bonoResultadoRepository.save(resultado);
        }
        return { message: `Evaluación completada con ${reglas.length} reglas.` };
    }
    async getAuditLogs(fechaInicio, fechaFin, usuarioId, modulo) {
        const where = {};
        if (fechaInicio && fechaFin)
            where.fechaHora = (0, typeorm_2.Between)(new Date(fechaInicio), new Date(fechaFin));
        if (usuarioId)
            where.usuarioId = usuarioId;
        if (modulo)
            where.modulo = modulo;
        return await this.auditRepository.find({ relations: ['usuario'], order: { fechaHora: 'DESC' }, take: 500, where });
    }
    async getAdminDashboardStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return {
            usuariosActivos: await this.usuarioRepository.count({ where: { estado: 'activo' } }),
            usuariosBloqueados: await this.usuarioRepository.count({ where: { estado: (0, typeorm_2.Not)('activo') } }),
            eventosAuditoria: await this.auditRepository.count({ where: { fechaHora: (0, typeorm_2.MoreThanOrEqual)(today) } }),
            estadoSistema: 'Óptimo'
        };
    }
    async getRrhhDashboardStats() {
        return {
            empleadosActivos: await this.empleadoRepository.count({ where: { activo: true } }),
            tardiasHoy: await this.registroAsistenciaRepository.count({ where: { fecha: new Date(), minutosTardia: (0, typeorm_2.MoreThan)(0) } }),
            permisosPendientes: await this.solicitudPermisoRepository.count({ where: { estado: 'pendiente' } }),
            vacacionesActivas: 0, empleadosEnRiesgo: 0, empleadosConTurnoInactivo: 0
        };
    }
    async getSupervisorDashboardStats(supervisorId) {
        return {
            empleadosACargo: await this.empleadoRepository.count({ where: { supervisorId, activo: true } }),
            permisosPendientes: await this.solicitudPermisoRepository.createQueryBuilder('sp').innerJoin('sp.empleado', 'emp').where('emp.supervisorId = :supervisorId AND sp.estado = :estado', { supervisorId, estado: 'pendiente' }).getCount(),
            horasPendientes: await this.registroTiempoRepository.createQueryBuilder('rt').innerJoin('rt.empleado', 'emp').where('emp.supervisorId = :supervisorId AND rt.estado = :estado', { supervisorId, estado: 'pendiente' }).getCount(),
            kpiPromedio: 0
        };
    }
    async getRoles() { return await this.rolRepository.find(); }
    async getAssignments() { return await this.empleadoTurnoRepository.find({ relations: ['empleado', 'turno'], where: { activo: true } }); }
    async assignShift(dto, uid) {
        await this.empleadoTurnoRepository.update({ empleadoId: dto.empleadoId }, { activo: false });
        await this.empleadoTurnoRepository.save(this.empleadoTurnoRepository.create({ ...dto, activo: true }));
        return this.getAssignments();
    }
    async getKpiParameters() {
        const params = await this.parametroRepository.find({ where: { activo: true } });
        const res = {};
        params.forEach(p => res[p.clave] = p.valor);
        return res;
    }
    async updateKpiParameters(dto, uid) {
        for (const [k, v] of Object.entries(dto)) {
            await this.parametroRepository.update({ clave: k }, { valor: v });
        }
        return this.getKpiParameters();
    }
    sanitizeString(str) {
        if (!str)
            return '';
        return str.replace(/Rodr\?guez/g, 'Rodríguez').replace(/Mart\?nez/g, 'Martínez').replace(/Fern\?ndez/g, 'Fernández').replace(/Garc\?a/g, 'García').replace(/L\?pez/g, 'López').replace(/Tecnolog\?a/g, 'Tecnología').replace(/Mart\?n/g, 'Martín').replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ã¡/g, 'á');
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