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
exports.EmpleadoTurno = void 0;
const typeorm_1 = require("typeorm");
const empleado_entity_1 = require("./empleado.entity");
const turno_entity_1 = require("./turno.entity");
const registro_asistencia_entity_1 = require("./registro-asistencia.entity");
let EmpleadoTurno = class EmpleadoTurno {
};
exports.EmpleadoTurno = EmpleadoTurno;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'empleado_turno_id' }),
    __metadata("design:type", Number)
], EmpleadoTurno.prototype, "empleadoTurnoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'empleado_id' }),
    __metadata("design:type", Number)
], EmpleadoTurno.prototype, "empleadoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'turno_id' }),
    __metadata("design:type", Number)
], EmpleadoTurno.prototype, "turnoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_inicio', type: 'date' }),
    __metadata("design:type", Date)
], EmpleadoTurno.prototype, "fecha_inicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_fin', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], EmpleadoTurno.prototype, "fecha_fin", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Boolean)
], EmpleadoTurno.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => empleado_entity_1.Empleado, (emp) => emp.empleadoTurnos),
    (0, typeorm_1.JoinColumn)({ name: 'empleado_id' }),
    __metadata("design:type", empleado_entity_1.Empleado)
], EmpleadoTurno.prototype, "empleado", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => turno_entity_1.Turno, (turno) => turno.empleadoTurnos),
    (0, typeorm_1.JoinColumn)({ name: 'turno_id' }),
    __metadata("design:type", turno_entity_1.Turno)
], EmpleadoTurno.prototype, "turno", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => registro_asistencia_entity_1.RegistroAsistencia, (ra) => ra.empleadoTurno),
    __metadata("design:type", Array)
], EmpleadoTurno.prototype, "registrosAsistencia", void 0);
exports.EmpleadoTurno = EmpleadoTurno = __decorate([
    (0, typeorm_1.Entity)('EMPLEADO_TURNO')
], EmpleadoTurno);
//# sourceMappingURL=empleado-turno.entity.js.map