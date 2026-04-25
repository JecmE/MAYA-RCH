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
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const periodo_planilla_entity_1 = require("../../entities/periodo-planilla.entity");
const planilla_empleado_entity_1 = require("../../entities/planilla-empleado.entity");
const concepto_planilla_entity_1 = require("../../entities/concepto-planilla.entity");
const movimiento_planilla_entity_1 = require("../../entities/movimiento-planilla.entity");
const empleado_entity_1 = require("../../entities/empleado.entity");
const bono_resultado_entity_1 = require("../../entities/bono-resultado.entity");
const registro_asistencia_entity_1 = require("../../entities/registro-asistencia.entity");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
let PayrollService = class PayrollService {
    constructor(periodoRepository, planillaEmpleadoRepository, conceptoRepository, movimientoRepository, empleadoRepository, bonoRepository, asistenciaRepository, auditRepository) {
        this.periodoRepository = periodoRepository;
        this.planillaEmpleadoRepository = planillaEmpleadoRepository;
        this.conceptoRepository = conceptoRepository;
        this.movimientoRepository = movimientoRepository;
        this.empleadoRepository = empleadoRepository;
        this.bonoRepository = bonoRepository;
        this.asistenciaRepository = asistenciaRepository;
        this.auditRepository = auditRepository;
    }
    async createPeriod(createDto, usuarioId) {
        const periodo = this.periodoRepository.create({ ...createDto, estado: periodo_planilla_entity_1.PeriodoPlanilla.ESTADO_ABIERTO });
        const saved = await this.periodoRepository.save(periodo);
        const s = Array.isArray(saved) ? saved[0] : saved;
        return { periodoId: s.periodoId, nombre: s.nombre };
    }
    async calculatePayroll(periodoId, usuarioId) {
        const periodo = await this.periodoRepository.findOne({ where: { periodoId } });
        if (!periodo)
            throw new common_1.NotFoundException('Periodo no encontrado');
        const empleados = await this.empleadoRepository.find({ where: { activo: true } });
        const resultados = [];
        const dateFin = new Date(periodo.fechaFin);
        const year = dateFin.getFullYear();
        const month = dateFin.getMonth() + 1;
        for (const emp of empleados) {
            const asistencias = await this.asistenciaRepository.find({
                where: { empleadoId: emp.empleadoId, fecha: (0, typeorm_2.Between)(periodo.fechaInicio, periodo.fechaFin) }
            });
            const horas = asistencias.reduce((sum, a) => sum + Number(a.horasTrabajadas || 0), 0);
            const montoSalario = horas * (Number(emp.tarifaHora) || 45.5);
            const bonoReal = await this.bonoRepository.findOne({
                where: { empleadoId: emp.empleadoId, mes: month, anio: year },
                relations: ['reglaBono'],
                order: { fechaCalculo: 'DESC' }
            });
            const montoBonos = bonoReal && bonoReal.elegible ? Number(bonoReal.reglaBono?.monto || 0) : 0;
            const igss = montoSalario * 0.0483;
            const neto = (montoSalario + montoBonos) - igss;
            resultados.push({
                empleadoId: emp.empleadoId,
                nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
                horasTrabajadas: horas,
                montoBruto: montoSalario,
                totalBonificaciones: montoBonos,
                totalDeducciones: igss,
                montoNeto: neto
            });
        }
        return {
            mensaje: 'Cálculo de nómina completado exitosamente (Modo Pro-forma)',
            resultados
        };
    }
    async closePeriod(periodoId, usuarioId) {
        await this.periodoRepository.update(periodoId, { estado: periodo_planilla_entity_1.PeriodoPlanilla.ESTADO_CERRADO });
        return { message: 'Periodo cerrado correctamente. Boletas publicadas para los empleados.' };
    }
    async getMyPaycheck(empleadoId, periodoId) {
        const periodo = periodoId
            ? await this.periodoRepository.findOne({ where: { periodoId } })
            : await this.periodoRepository.findOne({ order: { fechaInicio: 'DESC' } });
        if (!periodo)
            return { message: 'Periodo no encontrado' };
        const emp = await this.empleadoRepository.findOne({ where: { empleadoId } });
        const dateFin = new Date(periodo.fechaFin);
        const year = dateFin.getFullYear();
        const month = dateFin.getMonth() + 1;
        const asistencias = await this.asistenciaRepository.find({
            where: { empleadoId, fecha: (0, typeorm_2.Between)(periodo.fechaInicio, periodo.fechaFin) }
        });
        const horas = asistencias.reduce((sum, a) => sum + Number(a.horasTrabajadas || 0), 0);
        const montoSalario = horas * (Number(emp?.tarifaHora) || 45.5);
        const bonoReal = await this.bonoRepository.findOne({
            where: { empleadoId, mes: month, anio: year },
            relations: ['reglaBono'],
            order: { fechaCalculo: 'DESC' }
        });
        let montoBonos = 0;
        let nombreBono = 'Sin Bonificación (Eval. Pendiente)';
        if (bonoReal) {
            if (bonoReal.elegible) {
                montoBonos = Number(bonoReal.reglaBono?.monto || 0);
                nombreBono = bonoReal.reglaBono?.nombre || 'Bono Desempeño';
            }
            else {
                nombreBono = 'Bono Incentivo (No califica)';
            }
        }
        else {
            const reglasActivas = await this.dataSourceQuery(`SELECT COUNT(*) as total FROM REGLA_BONO WHERE activo = 1`);
            if (reglasActivas[0].total === 0) {
                nombreBono = 'Sin Bonificaciones (No hay reglas)';
            }
        }
        const igss = montoSalario * 0.0483;
        const neto = (montoSalario + montoBonos) - igss;
        return {
            periodo: { nombre: periodo.nombre, fechaInicio: periodo.fechaInicio, fechaFin: periodo.fechaFin },
            montoBruto: montoSalario,
            totalBonificaciones: montoBonos,
            totalDeducciones: igss,
            montoNeto: neto,
            movimientos: [
                { concepto: 'Salario Base (Horas marcadas)', tipo: 'ingreso', monto: montoSalario },
                { concepto: nombreBono, tipo: 'ingreso', monto: montoBonos },
                { concepto: 'IGSS Laboral (4.83%)', tipo: 'deduccion', monto: igss }
            ]
        };
    }
    async getMyPeriods(empleadoId) {
        return await this.periodoRepository.find({ order: { fechaInicio: 'DESC' }, take: 12 });
    }
    async getPeriods() { return await this.periodoRepository.find({ order: { fechaInicio: 'DESC' } }); }
    async getConcepts() { return await this.conceptoRepository.find({ where: { activo: true } }); }
    async seedTestData() { return { message: 'OK' }; }
    async dataSourceQuery(query) {
        try {
            const ds = this.periodoRepository.manager.connection;
            return await ds.query(query);
        }
        catch {
            return [{ total: 0 }];
        }
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(periodo_planilla_entity_1.PeriodoPlanilla)),
    __param(1, (0, typeorm_1.InjectRepository)(planilla_empleado_entity_1.PlanillaEmpleado)),
    __param(2, (0, typeorm_1.InjectRepository)(concepto_planilla_entity_1.ConceptoPlanilla)),
    __param(3, (0, typeorm_1.InjectRepository)(movimiento_planilla_entity_1.MovimientoPlanilla)),
    __param(4, (0, typeorm_1.InjectRepository)(empleado_entity_1.Empleado)),
    __param(5, (0, typeorm_1.InjectRepository)(bono_resultado_entity_1.BonoResultado)),
    __param(6, (0, typeorm_1.InjectRepository)(registro_asistencia_entity_1.RegistroAsistencia)),
    __param(7, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map