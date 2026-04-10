"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const payroll_controller_1 = require("./payroll.controller");
const payroll_service_1 = require("./payroll.service");
const periodo_planilla_entity_1 = require("../../entities/periodo-planilla.entity");
const planilla_empleado_entity_1 = require("../../entities/planilla-empleado.entity");
const concepto_planilla_entity_1 = require("../../entities/concepto-planilla.entity");
const movimiento_planilla_entity_1 = require("../../entities/movimiento-planilla.entity");
const tabla_isr_entity_1 = require("../../entities/tabla-isr.entity");
const empleado_entity_1 = require("../../entities/empleado.entity");
const bono_resultado_entity_1 = require("../../entities/bono-resultado.entity");
const registro_asistencia_entity_1 = require("../../entities/registro-asistencia.entity");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
let PayrollModule = class PayrollModule {
};
exports.PayrollModule = PayrollModule;
exports.PayrollModule = PayrollModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                periodo_planilla_entity_1.PeriodoPlanilla,
                planilla_empleado_entity_1.PlanillaEmpleado,
                concepto_planilla_entity_1.ConceptoPlanilla,
                movimiento_planilla_entity_1.MovimientoPlanilla,
                tabla_isr_entity_1.TablaIsr,
                empleado_entity_1.Empleado,
                bono_resultado_entity_1.BonoResultado,
                registro_asistencia_entity_1.RegistroAsistencia,
                audit_log_entity_1.AuditLog,
            ]),
        ],
        controllers: [payroll_controller_1.PayrollController],
        providers: [payroll_service_1.PayrollService],
        exports: [payroll_service_1.PayrollService],
    })
], PayrollModule);
//# sourceMappingURL=payroll.module.js.map