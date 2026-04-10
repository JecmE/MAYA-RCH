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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanillaEmpleado = void 0;
const typeorm_1 = require("typeorm");
const periodo_planilla_entity_1 = require("./periodo-planilla.entity");
const empleado_entity_1 = require("./empleado.entity");
const movimiento_planilla_entity_1 = require("./movimiento-planilla.entity");
let PlanillaEmpleado = class PlanillaEmpleado {
};
exports.PlanillaEmpleado = PlanillaEmpleado;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'planilla_emp_id' }),
    __metadata("design:type", Number)
], PlanillaEmpleado.prototype, "planillaEmpId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'periodo_id' }),
    __metadata("design:type", Number)
], PlanillaEmpleado.prototype, "periodoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'empleado_id' }),
    __metadata("design:type", Number)
], PlanillaEmpleado.prototype, "empleadoId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_calculo' }),
    __metadata("design:type", Date)
], PlanillaEmpleado.prototype, "fechaCalculo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tarifa_hora_usada', type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], PlanillaEmpleado.prototype, "tarifaHoraUsada", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'horas_pagables', type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], PlanillaEmpleado.prototype, "horasPagables", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'monto_bruto', type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], PlanillaEmpleado.prototype, "montoBruto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_bonificaciones', type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PlanillaEmpleado.prototype, "totalBonificaciones", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_deducciones', type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PlanillaEmpleado.prototype, "totalDeducciones", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'monto_neto', type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], PlanillaEmpleado.prototype, "montoNeto", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => periodo_planilla_entity_1.PeriodoPlanilla, (pp) => pp.planillasEmpleado),
    (0, typeorm_1.JoinColumn)({ name: 'periodo_id' }),
    __metadata("design:type", periodo_planilla_entity_1.PeriodoPlanilla)
], PlanillaEmpleado.prototype, "periodo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => empleado_entity_1.Empleado, (emp) => emp.planillasEmpleado),
    (0, typeorm_1.JoinColumn)({ name: 'empleado_id' }),
    __metadata("design:type", empleado_entity_1.Empleado)
], PlanillaEmpleado.prototype, "empleado", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => movimiento_planilla_entity_1.MovimientoPlanilla, (mp) => mp.planillaEmpleado),
    __metadata("design:type", Array)
], PlanillaEmpleado.prototype, "movimientos", void 0);
exports.PlanillaEmpleado = PlanillaEmpleado = __decorate([
    (0, typeorm_1.Entity)('PLANILLA_EMPLEADO'),
    (0, typeorm_1.Unique)(['periodoId', 'empleadoId'])
], PlanillaEmpleado);
//# sourceMappingURL=planilla-empleado.entity.js.map