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
exports.Turno = void 0;
const typeorm_1 = require("typeorm");
const empleado_turno_entity_1 = require("./empleado-turno.entity");
let Turno = class Turno {
};
exports.Turno = Turno;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'turno_id' }),
    __metadata("design:type", Number)
], Turno.prototype, "turnoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Turno.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hora_entrada', type: 'time' }),
    __metadata("design:type", String)
], Turno.prototype, "horaEntrada", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hora_salida', type: 'time' }),
    __metadata("design:type", String)
], Turno.prototype, "horaSalida", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tolerancia_minutos', default: 0 }),
    __metadata("design:type", Number)
], Turno.prototype, "toleranciaMinutos", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'horas_esperadas_dia', type: 'decimal', precision: 4, scale: 2, default: 8 }),
    __metadata("design:type", Number)
], Turno.prototype, "horasEsperadasDia", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true, default: 'Lun,Mar,Mie,Jue,Vie' }),
    __metadata("design:type", String)
], Turno.prototype, "dias", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Boolean)
], Turno.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => empleado_turno_entity_1.EmpleadoTurno, (et) => et.turno),
    __metadata("design:type", Array)
], Turno.prototype, "empleadoTurnos", void 0);
exports.Turno = Turno = __decorate([
    (0, typeorm_1.Entity)('TURNO')
], Turno);
//# sourceMappingURL=turno.entity.js.map