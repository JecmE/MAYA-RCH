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
exports.RegistroAsistencia = void 0;
const typeorm_1 = require("typeorm");
const empleado_entity_1 = require("./empleado.entity");
const empleado_turno_entity_1 = require("./empleado-turno.entity");
const ajuste_asistencia_entity_1 = require("./ajuste-asistencia.entity");
let RegistroAsistencia = class RegistroAsistencia {
};
exports.RegistroAsistencia = RegistroAsistencia;
RegistroAsistencia.ESTADO_COMPLETADA = 'completada';
RegistroAsistencia.ESTADO_INCOMPLETA = 'incompleta';
RegistroAsistencia.ESTADO_PENDIENTE = 'pendiente';
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'asistencia_id' }),
    __metadata("design:type", Number)
], RegistroAsistencia.prototype, "asistenciaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'empleado_id' }),
    __metadata("design:type", Number)
], RegistroAsistencia.prototype, "empleadoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'empleado_turno_id', nullable: true }),
    __metadata("design:type", Number)
], RegistroAsistencia.prototype, "empleadoTurnoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], RegistroAsistencia.prototype, "fecha", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hora_entrada_real', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], RegistroAsistencia.prototype, "horaEntradaReal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hora_salida_real', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], RegistroAsistencia.prototype, "horaSalidaReal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'minutos_tardia', default: 0 }),
    __metadata("design:type", Number)
], RegistroAsistencia.prototype, "minutosTardia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'horas_trabajadas', type: 'decimal', precision: 6, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RegistroAsistencia.prototype, "horasTrabajadas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estado_jornada', length: 20, default: 'pendiente' }),
    __metadata("design:type", String)
], RegistroAsistencia.prototype, "estadoJornada", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], RegistroAsistencia.prototype, "observacion", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => empleado_entity_1.Empleado, (emp) => emp.registrosAsistencia),
    (0, typeorm_1.JoinColumn)({ name: 'empleado_id' }),
    __metadata("design:type", empleado_entity_1.Empleado)
], RegistroAsistencia.prototype, "empleado", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => empleado_turno_entity_1.EmpleadoTurno, (et) => et.registrosAsistencia, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'empleado_turno_id' }),
    __metadata("design:type", empleado_turno_entity_1.EmpleadoTurno)
], RegistroAsistencia.prototype, "empleadoTurno", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ajuste_asistencia_entity_1.AjusteAsistencia, (aj) => aj.asistencia),
    __metadata("design:type", Array)
], RegistroAsistencia.prototype, "ajustes", void 0);
exports.RegistroAsistencia = RegistroAsistencia = __decorate([
    (0, typeorm_1.Entity)('REGISTRO_ASISTENCIA')
], RegistroAsistencia);
//# sourceMappingURL=registro-asistencia.entity.js.map