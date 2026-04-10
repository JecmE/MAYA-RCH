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
exports.VacacionSaldo = void 0;
const typeorm_1 = require("typeorm");
const empleado_entity_1 = require("./empleado.entity");
let VacacionSaldo = class VacacionSaldo {
    get diasTotales() {
        return this.diasDisponibles + this.diasUsados;
    }
};
exports.VacacionSaldo = VacacionSaldo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'saldo_id' }),
    __metadata("design:type", Number)
], VacacionSaldo.prototype, "saldoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'empleado_id', unique: true }),
    __metadata("design:type", Number)
], VacacionSaldo.prototype, "empleadoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dias_disponibles', default: 0 }),
    __metadata("design:type", Number)
], VacacionSaldo.prototype, "diasDisponibles", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dias_usados', default: 0 }),
    __metadata("design:type", Number)
], VacacionSaldo.prototype, "diasUsados", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_corte', type: 'date' }),
    __metadata("design:type", Date)
], VacacionSaldo.prototype, "fechaCorte", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => empleado_entity_1.Empleado, (emp) => emp.vacacionSaldo),
    (0, typeorm_1.JoinColumn)({ name: 'empleado_id' }),
    __metadata("design:type", empleado_entity_1.Empleado)
], VacacionSaldo.prototype, "empleado", void 0);
exports.VacacionSaldo = VacacionSaldo = __decorate([
    (0, typeorm_1.Entity)('VACACION_SALDO')
], VacacionSaldo);
//# sourceMappingURL=vacacion-saldo.entity.js.map