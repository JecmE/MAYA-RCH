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
exports.Acumulacion = void 0;
const typeorm_1 = require("typeorm");
const parametro_sistema_entity_1 = require("./parametro-sistema.entity");
let Acumulacion = class Acumulacion {
};
exports.Acumulacion = Acumulacion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'acumulacion_id' }),
    __metadata("design:type", Number)
], Acumulacion.prototype, "acumulacionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parametro_id' }),
    __metadata("design:type", Number)
], Acumulacion.prototype, "parametroId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vac_dias_por_anio', nullable: true }),
    __metadata("design:type", Number)
], Acumulacion.prototype, "vacDiasPorAnio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vac_dias_por_mes', type: 'decimal', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Acumulacion.prototype, "vacDiasPorMes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vac_acumula_desde_fecha_ingreso', nullable: true }),
    __metadata("design:type", Boolean)
], Acumulacion.prototype, "vacAcumulaDesdeFechaIngreso", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vac_meses_minimos_para_solicitar', nullable: true }),
    __metadata("design:type", Number)
], Acumulacion.prototype, "vacMesesMinimosParaSolicitar", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vac_tope_acumulado_dias', nullable: true }),
    __metadata("design:type", Number)
], Acumulacion.prototype, "vacTopeAcumuladoDias", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => parametro_sistema_entity_1.ParametroSistema),
    (0, typeorm_1.JoinColumn)({ name: 'parametro_id' }),
    __metadata("design:type", parametro_sistema_entity_1.ParametroSistema)
], Acumulacion.prototype, "parametro", void 0);
exports.Acumulacion = Acumulacion = __decorate([
    (0, typeorm_1.Entity)('ACUMULACION')
], Acumulacion);
//# sourceMappingURL=acumulacion.entity.js.map