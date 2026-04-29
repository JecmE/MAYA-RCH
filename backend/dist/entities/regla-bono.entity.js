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
exports.ReglaBono = void 0;
const typeorm_1 = require("typeorm");
const bono_resultado_entity_1 = require("./bono-resultado.entity");
let ReglaBono = class ReglaBono {
};
exports.ReglaBono = ReglaBono;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'regla_bono_id' }),
    __metadata("design:type", Number)
], ReglaBono.prototype, "reglaBonoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], ReglaBono.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'min_dias_trabajados', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], ReglaBono.prototype, "minDiasTrabajados", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_tardias', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], ReglaBono.prototype, "maxTardias", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_faltas', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], ReglaBono.prototype, "maxFaltas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'min_horas', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], ReglaBono.prototype, "minHoras", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'monto', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ReglaBono.prototype, "monto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vigencia_inicio', type: 'date' }),
    __metadata("design:type", Date)
], ReglaBono.prototype, "vigenciaInicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vigencia_fin', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], ReglaBono.prototype, "vigenciaFin", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Boolean)
], ReglaBono.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => bono_resultado_entity_1.BonoResultado, (br) => br.reglaBono),
    __metadata("design:type", Array)
], ReglaBono.prototype, "resultados", void 0);
exports.ReglaBono = ReglaBono = __decorate([
    (0, typeorm_1.Entity)('REGLA_BONO')
], ReglaBono);
//# sourceMappingURL=regla-bono.entity.js.map