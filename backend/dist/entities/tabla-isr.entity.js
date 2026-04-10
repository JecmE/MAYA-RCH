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
exports.TablaIsr = void 0;
const typeorm_1 = require("typeorm");
let TablaIsr = class TablaIsr {
};
exports.TablaIsr = TablaIsr;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'isr_id' }),
    __metadata("design:type", Number)
], TablaIsr.prototype, "isrId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TablaIsr.prototype, "anio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rango_desde', type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], TablaIsr.prototype, "rangoDesde", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rango_hasta', type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], TablaIsr.prototype, "rangoHasta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], TablaIsr.prototype, "porcentaje", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cuota_fijo', type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], TablaIsr.prototype, "cuotaFijo", void 0);
exports.TablaIsr = TablaIsr = __decorate([
    (0, typeorm_1.Entity)('TABLA_ISR')
], TablaIsr);
//# sourceMappingURL=tabla-isr.entity.js.map