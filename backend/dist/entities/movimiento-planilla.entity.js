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
exports.MovimientoPlanilla = void 0;
const typeorm_1 = require("typeorm");
const planilla_empleado_entity_1 = require("./planilla-empleado.entity");
const concepto_planilla_entity_1 = require("./concepto-planilla.entity");
const usuario_entity_1 = require("./usuario.entity");
let MovimientoPlanilla = class MovimientoPlanilla {
};
exports.MovimientoPlanilla = MovimientoPlanilla;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'movimiento_id' }),
    __metadata("design:type", Number)
], MovimientoPlanilla.prototype, "movimientoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'planilla_emp_id' }),
    __metadata("design:type", Number)
], MovimientoPlanilla.prototype, "planillaEmpId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'concepto_id' }),
    __metadata("design:type", Number)
], MovimientoPlanilla.prototype, "conceptoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], MovimientoPlanilla.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id_regista' }),
    __metadata("design:type", Number)
], MovimientoPlanilla.prototype, "usuarioIdRegista", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_hora' }),
    __metadata("design:type", Date)
], MovimientoPlanilla.prototype, "fechaHora", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], MovimientoPlanilla.prototype, "monto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'es_manual', default: 0 }),
    __metadata("design:type", Boolean)
], MovimientoPlanilla.prototype, "esManual", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], MovimientoPlanilla.prototype, "comentario", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => planilla_empleado_entity_1.PlanillaEmpleado, (pe) => pe.movimientos),
    (0, typeorm_1.JoinColumn)({ name: 'planilla_emp_id' }),
    __metadata("design:type", planilla_empleado_entity_1.PlanillaEmpleado)
], MovimientoPlanilla.prototype, "planillaEmpleado", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => concepto_planilla_entity_1.ConceptoPlanilla, (cp) => cp.movimientos),
    (0, typeorm_1.JoinColumn)({ name: 'concepto_id' }),
    __metadata("design:type", concepto_planilla_entity_1.ConceptoPlanilla)
], MovimientoPlanilla.prototype, "concepto", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id_regista' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], MovimientoPlanilla.prototype, "usuarioRegistra", void 0);
exports.MovimientoPlanilla = MovimientoPlanilla = __decorate([
    (0, typeorm_1.Entity)('MOVIMIENTO_PLANILLA')
], MovimientoPlanilla);
//# sourceMappingURL=movimiento-planilla.entity.js.map