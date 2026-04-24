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
exports.PeriodoPlanilla = void 0;
const typeorm_1 = require("typeorm");
const planilla_empleado_entity_1 = require("./planilla-empleado.entity");
let PeriodoPlanilla = class PeriodoPlanilla {
};
exports.PeriodoPlanilla = PeriodoPlanilla;
PeriodoPlanilla.TIPO_SEMANAL = 'semanal';
PeriodoPlanilla.TIPO_QUINCENAL = 'quincenal';
PeriodoPlanilla.TIPO_MENSUAL = 'mensual';
PeriodoPlanilla.ESTADO_ABIERTO = 'abierto';
PeriodoPlanilla.ESTADO_CERRADO = 'cerrado';
PeriodoPlanilla.ESTADO_PROCESADO = 'procesado';
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'periodo_id' }),
    __metadata("design:type", Number)
], PeriodoPlanilla.prototype, "periodoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], PeriodoPlanilla.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_inicio', type: 'date' }),
    __metadata("design:type", Date)
], PeriodoPlanilla.prototype, "fecha_inicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_fin', type: 'date' }),
    __metadata("design:type", Date)
], PeriodoPlanilla.prototype, "fecha_fin", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'mensual' }),
    __metadata("design:type", String)
], PeriodoPlanilla.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'abierto' }),
    __metadata("design:type", String)
], PeriodoPlanilla.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => planilla_empleado_entity_1.PlanillaEmpleado, (pe) => pe.periodo),
    __metadata("design:type", Array)
], PeriodoPlanilla.prototype, "planillasEmpleado", void 0);
exports.PeriodoPlanilla = PeriodoPlanilla = __decorate([
    (0, typeorm_1.Entity)('PERIODO_PLANILLA')
], PeriodoPlanilla);
//# sourceMappingURL=periodo-planilla.entity.js.map