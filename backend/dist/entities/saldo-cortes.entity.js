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
exports.SaldoCortes = void 0;
const typeorm_1 = require("typeorm");
const parametro_sistema_entity_1 = require("./parametro-sistema.entity");
let SaldoCortes = class SaldoCortes {
};
exports.SaldoCortes = SaldoCortes;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'saldo_cortes_id' }),
    __metadata("design:type", Number)
], SaldoCortes.prototype, "saldoCortesId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parametro_id' }),
    __metadata("design:type", Number)
], SaldoCortes.prototype, "parametroId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vac_corte_anual_fecha', length: 10, nullable: true }),
    __metadata("design:type", String)
], SaldoCortes.prototype, "vacCorteAnualFecha", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vac_permite_arreo_dias', nullable: true }),
    __metadata("design:type", Boolean)
], SaldoCortes.prototype, "vacPermiteArreoDias", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vac_max_arreo_dias', nullable: true }),
    __metadata("design:type", Number)
], SaldoCortes.prototype, "vacMaxArreoDias", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vac_vence_arreo_en_meses', nullable: true }),
    __metadata("design:type", Number)
], SaldoCortes.prototype, "vacVenceArreoEnMeses", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => parametro_sistema_entity_1.ParametroSistema),
    (0, typeorm_1.JoinColumn)({ name: 'parametro_id' }),
    __metadata("design:type", parametro_sistema_entity_1.ParametroSistema)
], SaldoCortes.prototype, "parametro", void 0);
exports.SaldoCortes = SaldoCortes = __decorate([
    (0, typeorm_1.Entity)('SALDO_CORTES')
], SaldoCortes);
//# sourceMappingURL=saldo-cortes.entity.js.map