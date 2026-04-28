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
exports.Usuario = void 0;
const typeorm_1 = require("typeorm");
const empleado_entity_1 = require("./empleado.entity");
const rol_entity_1 = require("./rol.entity");
const decision_permiso_entity_1 = require("./decision-permiso.entity");
const ajuste_asistencia_entity_1 = require("./ajuste-asistencia.entity");
const audit_log_entity_1 = require("./audit-log.entity");
const aprobacion_tiempo_entity_1 = require("./aprobacion-tiempo.entity");
const reset_password_token_entity_1 = require("./reset-password-token.entity");
let Usuario = class Usuario {
    get isActivo() {
        return this.estado === 'activo';
    }
};
exports.Usuario = Usuario;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'usuario_id' }),
    __metadata("design:type", Number)
], Usuario.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'empleado_id', unique: true }),
    __metadata("design:type", Number)
], Usuario.prototype, "empleadoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, unique: true }),
    __metadata("design:type", String)
], Usuario.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password_hash', length: 255 }),
    __metadata("design:type", String)
], Usuario.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'activo' }),
    __metadata("design:type", String)
], Usuario.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ultimo_login', nullable: true }),
    __metadata("design:type", Date)
], Usuario.prototype, "ultimoLogin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ultimo_ip', length: 50, nullable: true }),
    __metadata("design:type", String)
], Usuario.prototype, "ultimoIp", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'session_version', default: 1 }),
    __metadata("design:type", Number)
], Usuario.prototype, "sessionVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cambio_password_obligatorio', default: true }),
    __metadata("design:type", Boolean)
], Usuario.prototype, "cambioPasswordObligatorio", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => empleado_entity_1.Empleado, (emp) => emp.usuario),
    (0, typeorm_1.JoinColumn)({ name: 'empleado_id' }),
    __metadata("design:type", empleado_entity_1.Empleado)
], Usuario.prototype, "empleado", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => rol_entity_1.Rol, (rol) => rol.usuarios),
    (0, typeorm_1.JoinTable)({
        name: 'USUARIO_ROL',
        joinColumn: { name: 'usuario_id', referencedColumnName: 'usuarioId' },
        inverseJoinColumn: { name: 'rol_id', referencedColumnName: 'rolId' },
    }),
    __metadata("design:type", Array)
], Usuario.prototype, "roles", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => decision_permiso_entity_1.DecisionPermiso, (dp) => dp.usuario),
    __metadata("design:type", Array)
], Usuario.prototype, "decisionesPermiso", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ajuste_asistencia_entity_1.AjusteAsistencia, (aa) => aa.usuario),
    __metadata("design:type", Array)
], Usuario.prototype, "ajustes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => audit_log_entity_1.AuditLog, (al) => al.usuario),
    __metadata("design:type", Array)
], Usuario.prototype, "auditLogs", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => aprobacion_tiempo_entity_1.AprobacionTiempo, (at) => at.usuario),
    __metadata("design:type", Array)
], Usuario.prototype, "aprobacionesTiempo", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => reset_password_token_entity_1.ResetPasswordToken, (rpt) => rpt.usuario),
    __metadata("design:type", Array)
], Usuario.prototype, "resetPasswordTokens", void 0);
exports.Usuario = Usuario = __decorate([
    (0, typeorm_1.Entity)('USUARIO')
], Usuario);
//# sourceMappingURL=usuario.entity.js.map