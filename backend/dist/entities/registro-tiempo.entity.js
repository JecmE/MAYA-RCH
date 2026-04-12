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
exports.RegistroTiempo = void 0;
const typeorm_1 = require("typeorm");
const empleado_entity_1 = require("./empleado.entity");
const proyecto_entity_1 = require("./proyecto.entity");
const aprobacion_tiempo_entity_1 = require("./aprobacion-tiempo.entity");
let RegistroTiempo = class RegistroTiempo {
};
exports.RegistroTiempo = RegistroTiempo;
RegistroTiempo.ESTADO_PENDIENTE = 'pendiente';
RegistroTiempo.ESTADO_APROBADO = 'aprobado';
RegistroTiempo.ESTADO_RECHAZADO = 'rechazado';
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'tiempo_id' }),
    __metadata("design:type", Number)
], RegistroTiempo.prototype, "tiempoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'empleado_id' }),
    __metadata("design:type", Number)
], RegistroTiempo.prototype, "empleadoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'proyecto_id' }),
    __metadata("design:type", Number)
], RegistroTiempo.prototype, "proyectoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10 }),
    __metadata("design:type", String)
], RegistroTiempo.prototype, "fecha", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 4, scale: 2 }),
    __metadata("design:type", Number)
], RegistroTiempo.prototype, "horas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actividad_descripcion', length: 255, nullable: true }),
    __metadata("design:type", String)
], RegistroTiempo.prototype, "actividadDescripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'pendiente' }),
    __metadata("design:type", String)
], RegistroTiempo.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_registro' }),
    __metadata("design:type", Date)
], RegistroTiempo.prototype, "fechaRegistro", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'horas_validadas', type: 'decimal', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RegistroTiempo.prototype, "horasValidadas", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => empleado_entity_1.Empleado, (emp) => emp.registroTiempos),
    (0, typeorm_1.JoinColumn)({ name: 'empleado_id' }),
    __metadata("design:type", empleado_entity_1.Empleado)
], RegistroTiempo.prototype, "empleado", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => proyecto_entity_1.Proyecto, (proy) => proy.registrosTiempo),
    (0, typeorm_1.JoinColumn)({ name: 'proyecto_id' }),
    __metadata("design:type", proyecto_entity_1.Proyecto)
], RegistroTiempo.prototype, "proyecto", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => aprobacion_tiempo_entity_1.AprobacionTiempo, (ap) => ap.registroTiempo),
    __metadata("design:type", Array)
], RegistroTiempo.prototype, "aprobaciones", void 0);
exports.RegistroTiempo = RegistroTiempo = __decorate([
    (0, typeorm_1.Entity)('REGISTRO_TIEMPO')
], RegistroTiempo);
//# sourceMappingURL=registro-tiempo.entity.js.map