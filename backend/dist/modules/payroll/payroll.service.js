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
const tabla_isr_entity_1 = require("../../entities/tabla-isr.entity");
const empleado_entity_1 = require("../../entities/empleado.entity");
const bono_resultado_entity_1 = require("../../entities/bono-resultado.entity");
const registro_asistencia_entity_1 = require("../../entities/registro-asistencia.entity");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
let PayrollService = class PayrollService {
    constructor(periodoRepository, planillaEmpleadoRepository, conceptoRepository, movimientoRepository, isrRepository, empleadoRepository, bonoRepository, asistenciaRepository, auditRepository) {
        this.periodoRepository = periodoRepository;
        this.planillaEmpleadoRepository = planillaEmpleadoRepository;
        this.conceptoRepository = conceptoRepository;
        this.movimientoRepository = movimientoRepository;
        this.isrRepository = isrRepository;
        this.empleadoRepository = empleadoRepository;
        this.bonoRepository = bonoRepository;
        this.asistenciaRepository = asistenciaRepository;
        this.auditRepository = auditRepository;
    }
    async getPeriods() {
        const periodos = await this.periodoRepository.find({
            order: { fechaInicio: 'DESC' },
        });
        return periodos.map((p) => ({
            periodoId: p.periodoId,
            nombre: p.nombre,
            fechaInicio: p.fechaInicio,
            fechaFin: p.fechaFin,
            tipo: p.tipo,
            estado: p.estado,
        }));
    }
    async createPeriod(createDto, usuarioId) {
        const periodo = this.periodoRepository.create({
            ...createDto,
            estado: periodo_planilla_entity_1.PeriodoPlanilla.ESTADO_ABIERTO,
        });
        const saved = (await this.periodoRepository.save(periodo));
        await this.auditRepository.save({
            usuarioId,
            modulo: 'PAYROLL',
            accion: 'CREATE_PERIOD',
            entidad: 'PERIODO_PLANILLA',
            entidadId: saved.periodoId,
            detalle: `Período creado: ${saved.nombre}`,
        });
        return {
            periodoId: saved.periodoId,
            nombre: saved.nombre,
            estado: saved.estado,
            mensaje: 'Período creado exitosamente',
        };
    }
    async calculatePayroll(periodoId, usuarioId) {
        const periodo = await this.periodoRepository.findOne({
            where: { periodoId },
        });
        if (!periodo) {
            throw new common_1.NotFoundException('Período no encontrado');
        }
        if (periodo.estado !== periodo_planilla_entity_1.PeriodoPlanilla.ESTADO_ABIERTO) {
            throw new common_1.BadRequestException('El período no está abierto');
        }
        const empleados = await this.empleadoRepository.find({
            where: { activo: true },
        });
        const year = new Date(periodo.fechaFin).getFullYear();
        const conceptos = await this.conceptoRepository.find({
            where: { activo: true },
        });
        const tablaIsr = await this.isrRepository.find({
            where: { anio: year },
            order: { rangoDesde: 'ASC' },
        });
        const resultados = [];
        for (const emp of empleados) {
            const asistencia = await this.asistenciaRepository.find({
                where: {
                    empleadoId: emp.empleadoId,
                },
            });
            const filteredAsistencia = asistencia.filter((a) => a.fecha >= periodo.fechaInicio && a.fecha <= periodo.fechaFin);
            const horasTrabajadas = filteredAsistencia.reduce((sum, a) => sum + Number(a.horasTrabajadas || 0), 0);
            const tarifa = Number(emp.tarifaHora) || 45.5;
            const montoBruto = horasTrabajadas * tarifa;
            const bonos = await this.bonoRepository.find({
                where: {
                    empleadoId: emp.empleadoId,
                    anio: year,
                    elegible: true,
                },
            });
            const totalBonificaciones = 0;
            const baseImponible = montoBruto + totalBonificaciones;
            const isr = this.calculateISR(baseImponible, tablaIsr);
            const igss = baseImponible * 0.0483;
            const totalDeducciones = isr + igss;
            const montoNeto = baseImponible - totalDeducciones;
            const planillaEmpleado = this.planillaEmpleadoRepository.create({
                periodoId,
                empleadoId: emp.empleadoId,
                tarifaHoraUsada: tarifa,
                horasPagables: horasTrabajadas,
                montoBruto,
                totalBonificaciones,
                totalDeducciones,
                montoNeto,
            });
            const savedPlanilla = await this.planillaEmpleadoRepository.save(planillaEmpleado);
            await this.movimientoRepository.save({
                planillaEmpId: savedPlanilla.planillaEmpId,
                conceptoId: conceptos.find((c) => c.codigo === 'SALARIO')?.conceptoId,
                tipo: concepto_planilla_entity_1.ConceptoPlanilla.TIPO_INGRESO,
                usuarioIdRegista: usuarioId,
                monto: montoBruto,
                esManual: false,
            });
            if (totalBonificaciones > 0) {
                await this.movimientoRepository.save({
                    planillaEmpId: savedPlanilla.planillaEmpId,
                    conceptoId: conceptos.find((c) => c.codigo === 'BONOPUNT')?.conceptoId,
                    tipo: concepto_planilla_entity_1.ConceptoPlanilla.TIPO_INGRESO,
                    usuarioIdRegista: usuarioId,
                    monto: totalBonificaciones,
                    esManual: false,
                });
            }
            await this.movimientoRepository.save({
                planillaEmpId: savedPlanilla.planillaEmpId,
                conceptoId: conceptos.find((c) => c.codigo === 'ISR')?.conceptoId,
                tipo: concepto_planilla_entity_1.ConceptoPlanilla.TIPO_DEDUCCION,
                usuarioIdRegista: usuarioId,
                monto: isr,
                esManual: false,
            });
            await this.movimientoRepository.save({
                planillaEmpId: savedPlanilla.planillaEmpId,
                conceptoId: conceptos.find((c) => c.codigo === 'IGSS')?.conceptoId,
                tipo: concepto_planilla_entity_1.ConceptoPlanilla.TIPO_DEDUCCION,
                usuarioIdRegista: usuarioId,
                monto: igss,
                esManual: false,
            });
            resultados.push({
                empleadoId: emp.empleadoId,
                nombreCompleto: emp.nombreCompleto,
                horasTrabajadas,
                montoBruto,
                totalBonificaciones,
                totalDeducciones,
                montoNeto,
            });
        }
        await this.auditRepository.save({
            usuarioId,
            modulo: 'PAYROLL',
            accion: 'CALCULATE_PAYROLL',
            entidad: 'PERIODO_PLANILLA',
            entidadId: periodoId,
            detalle: `Cálculo de nómina ejecutado para ${resultados.length} empleados`,
        });
        return {
            mensaje: 'Cálculo ejecutado',
            empleadosProcesados: resultados.length,
            resultados,
        };
    }
    async closePeriod(periodoId, usuarioId) {
        const periodo = await this.periodoRepository.findOne({
            where: { periodoId },
        });
        if (!periodo) {
            throw new common_1.NotFoundException('Período no encontrado');
        }
        if (periodo.estado === periodo_planilla_entity_1.PeriodoPlanilla.ESTADO_CERRADO) {
            throw new common_1.BadRequestException('El período ya está cerrado');
        }
        periodo.estado = periodo_planilla_entity_1.PeriodoPlanilla.ESTADO_CERRADO;
        await this.periodoRepository.save(periodo);
        await this.auditRepository.save({
            usuarioId,
            modulo: 'PAYROLL',
            accion: 'CLOSE_PERIOD',
            entidad: 'PERIODO_PLANILLA',
            entidadId: periodoId,
            detalle: `Período cerrado: ${periodo.nombre}`,
        });
        return { message: 'Período cerrado correctamente' };
    }
    async getMyPaycheck(empleadoId, periodoId) {
        let planilla;
        if (periodoId) {
            planilla = await this.planillaEmpleadoRepository.findOne({
                where: { periodoId, empleadoId },
                relations: ['periodo'],
            });
        }
        else {
            planilla = await this.planillaEmpleadoRepository.findOne({
                where: { empleadoId },
                relations: ['periodo'],
                order: { fechaCalculo: 'DESC' },
            });
        }
        if (!planilla) {
            return { message: 'No se encontró boleta de pago' };
        }
        const movimientos = await this.movimientoRepository.find({
            where: { planillaEmpId: planilla.planillaEmpId },
            relations: ['concepto'],
        });
        return {
            periodo: {
                nombre: planilla.periodo?.nombre,
                fechaInicio: planilla.periodo?.fechaInicio,
                fechaFin: planilla.periodo?.fechaFin,
            },
            empleadoId: planilla.empleadoId,
            tarifaHora: planilla.tarifaHoraUsada,
            horasPagables: planilla.horasPagables,
            montoBruto: planilla.montoBruto,
            totalBonificaciones: planilla.totalBonificaciones,
            totalDeducciones: planilla.totalDeducciones,
            montoNeto: planilla.montoNeto,
            movimientos: movimientos.map((m) => ({
                concepto: m.concepto?.nombre,
                tipo: m.tipo,
                monto: m.monto,
            })),
        };
    }
    async getConcepts() {
        const conceptos = await this.conceptoRepository.find({
            where: { activo: true },
        });
        return conceptos.map((c) => ({
            conceptoId: c.conceptoId,
            codigo: c.codigo,
            nombre: c.nombre,
            tipo: c.tipo,
            modoCalculo: c.modoCalculo,
            baseCalculo: c.baseCalculo,
        }));
    }
    calculateISR(baseImponible, tablaIsr) {
        for (const tramo of tablaIsr) {
            if (baseImponible >= Number(tramo.rangoDesde) && baseImponible <= Number(tramo.rangoHasta)) {
                return (Number(tramo.cuotaFijo) +
                    (baseImponible - Number(tramo.rangoDesde)) * (Number(tramo.porcentaje) / 100));
            }
        }
        return 0;
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(periodo_planilla_entity_1.PeriodoPlanilla)),
    __param(1, (0, typeorm_1.InjectRepository)(planilla_empleado_entity_1.PlanillaEmpleado)),
    __param(2, (0, typeorm_1.InjectRepository)(concepto_planilla_entity_1.ConceptoPlanilla)),
    __param(3, (0, typeorm_1.InjectRepository)(movimiento_planilla_entity_1.MovimientoPlanilla)),
    __param(4, (0, typeorm_1.InjectRepository)(tabla_isr_entity_1.TablaIsr)),
    __param(5, (0, typeorm_1.InjectRepository)(empleado_entity_1.Empleado)),
    __param(6, (0, typeorm_1.InjectRepository)(bono_resultado_entity_1.BonoResultado)),
    __param(7, (0, typeorm_1.InjectRepository)(registro_asistencia_entity_1.RegistroAsistencia)),
    __param(8, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map