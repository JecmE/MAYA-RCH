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
exports.SolicitudPermiso = void 0;
const typeorm_1 = require("typeorm");
const empleado_entity_1 = require("./empleado.entity");
const tipo_permiso_entity_1 = require("./tipo-permiso.entity");
const decision_permiso_entity_1 = require("./decision-permiso.entity");
const adjunto_solicitud_entity_1 = require("./adjunto-solicitud.entity");
const vacacion_movimiento_entity_1 = require("./vacacion-movimiento.entity");
let SolicitudPermiso = class SolicitudPermiso {
};
exports.SolicitudPermiso = SolicitudPermiso;
SolicitudPermiso.ESTADO_PENDIENTE = 'pendiente';
SolicitudPermiso.ESTADO_APROBADO = 'aprobado';
SolicitudPermiso.ESTADO_RECHAZADO = 'rechazado';
SolicitudPermiso.ESTADO_CANCELADO = 'cancelado';
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'solicitud_id' }),
    __metadata("design:type", Number)
], SolicitudPermiso.prototype, "solicitudId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'empleado_id' }),
    __metadata("design:type", Number)
], SolicitudPermiso.prototype, "empleadoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_permiso_id' }),
    __metadata("design:type", Number)
], SolicitudPermiso.prototype, "tipoPermisoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_inicio', type: 'date' }),
    __metadata("design:type", Date)
], SolicitudPermiso.prototype, "fechaInicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_fin', type: 'date' }),
    __metadata("design:type", Date)
], SolicitudPermiso.prototype, "fechaFin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'horas_inicio', type: 'time', nullable: true }),
    __metadata("design:type", String)
], SolicitudPermiso.prototype, "horasInicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'horas_fin', type: 'time', nullable: true }),
    __metadata("design:type", String)
], SolicitudPermiso.prototype, "horasFin", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], SolicitudPermiso.prototype, "motivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'pendiente' }),
    __metadata("design:type", String)
], SolicitudPermiso.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_solicitud' }),
    __metadata("design:type", Date)
], SolicitudPermiso.prototype, "fechaSolicitud", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => empleado_entity_1.Empleado, (emp) => emp.solicitudes),
    (0, typeorm_1.JoinColumn)({ name: 'empleado_id' }),
    __metadata("design:type", empleado_entity_1.Empleado)
], SolicitudPermiso.prototype, "empleado", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tipo_permiso_entity_1.TipoPermiso, (tp) => tp.solicitudes),
    (0, typeorm_1.JoinColumn)({ name: 'tipo_permiso_id' }),
    __metadata("design:type", tipo_permiso_entity_1.TipoPermiso)
], SolicitudPermiso.prototype, "tipoPermiso", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => decision_permiso_entity_1.DecisionPermiso, (dp) => dp.solicitud),
    __metadata("design:type", Array)
], SolicitudPermiso.prototype, "decisiones", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => adjunto_solicitud_entity_1.AdjuntoSolicitud, (adj) => adj.solicitud),
    __metadata("design:type", Array)
], SolicitudPermiso.prototype, "adjuntos", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => vacacion_movimiento_entity_1.VacacionMovimiento, (vm) => vm.solicitud),
    __metadata("design:type", Array)
], SolicitudPermiso.prototype, "vacacionMovimientos", void 0);
exports.SolicitudPermiso = SolicitudPermiso = __decorate([
    (0, typeorm_1.Entity)('SOLICITUD_PERMISO')
], SolicitudPermiso);
//# sourceMappingURL=solicitud-permiso.entity.js.map