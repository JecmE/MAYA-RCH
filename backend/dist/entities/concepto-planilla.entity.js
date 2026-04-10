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
exports.ConceptoPlanilla = void 0;
const typeorm_1 = require("typeorm");
const movimiento_planilla_entity_1 = require("./movimiento-planilla.entity");
let ConceptoPlanilla = class ConceptoPlanilla {
};
exports.ConceptoPlanilla = ConceptoPlanilla;
ConceptoPlanilla.TIPO_INGRESO = 'ingreso';
ConceptoPlanilla.TIPO_DEDUCCION = 'deduccion';
ConceptoPlanilla.MODO_FIJO = 'fijo';
ConceptoPlanilla.MODO_PORCENTAJE = 'porcentaje';
ConceptoPlanilla.MODO_HORAS = 'horas';
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'concepto_id' }),
    __metadata("design:type", Number)
], ConceptoPlanilla.prototype, "conceptoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, unique: true }),
    __metadata("design:type", String)
], ConceptoPlanilla.prototype, "codigo", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], ConceptoPlanilla.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], ConceptoPlanilla.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'modo_calculo', length: 30 }),
    __metadata("design:type", String)
], ConceptoPlanilla.prototype, "modoCalculo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'base_calculo', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], ConceptoPlanilla.prototype, "baseCalculo", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Boolean)
], ConceptoPlanilla.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => movimiento_planilla_entity_1.MovimientoPlanilla, (mp) => mp.concepto),
    __metadata("design:type", Array)
], ConceptoPlanilla.prototype, "movimientos", void 0);
exports.ConceptoPlanilla = ConceptoPlanilla = __decorate([
    (0, typeorm_1.Entity)('CONCEPTO_PLANILLA')
], ConceptoPlanilla);
//# sourceMappingURL=concepto-planilla.entity.js.map