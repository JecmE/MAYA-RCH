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
exports.VacacionMovimiento = void 0;
const typeorm_1 = require("typeorm");
const empleado_entity_1 = require("./empleado.entity");
const solicitud_permiso_entity_1 = require("./solicitud-permiso.entity");
let VacacionMovimiento = class VacacionMovimiento {
};
exports.VacacionMovimiento = VacacionMovimiento;
VacacionMovimiento.TIPO_ACUMULACION = 'acumulacion';
VacacionMovimiento.TIPO_CONSUMO = 'consumo';
VacacionMovimiento.TIPO_AJUSTE = 'ajuste';
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'movimiento_id' }),
    __metadata("design:type", Number)
], VacacionMovimiento.prototype, "movimientoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'empleado_id' }),
    __metadata("design:type", Number)
], VacacionMovimiento.prototype, "empleadoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'solicitud_id', nullable: true }),
    __metadata("design:type", Number)
], VacacionMovimiento.prototype, "solicitudId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], VacacionMovimiento.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VacacionMovimiento.prototype, "dias", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], VacacionMovimiento.prototype, "fecha", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], VacacionMovimiento.prototype, "comentario", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => empleado_entity_1.Empleado, (emp) => emp.vacacionMovimientos),
    (0, typeorm_1.JoinColumn)({ name: 'empleado_id' }),
    __metadata("design:type", empleado_entity_1.Empleado)
], VacacionMovimiento.prototype, "empleado", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => solicitud_permiso_entity_1.SolicitudPermiso, (sp) => sp.vacacionMovimientos, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'solicitud_id' }),
    __metadata("design:type", solicitud_permiso_entity_1.SolicitudPermiso)
], VacacionMovimiento.prototype, "solicitud", void 0);
exports.VacacionMovimiento = VacacionMovimiento = __decorate([
    (0, typeorm_1.Entity)('VACACION_MOVIMIENTO')
], VacacionMovimiento);
//# sourceMappingURL=vacacion-movimiento.entity.js.map