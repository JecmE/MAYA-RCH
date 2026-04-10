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
exports.AuditLog = void 0;
const typeorm_1 = require("typeorm");
const usuario_entity_1 = require("./usuario.entity");
let AuditLog = class AuditLog {
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'audit_id' }),
    __metadata("design:type", Number)
], AuditLog.prototype, "auditId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id', nullable: true }),
    __metadata("design:type", Number)
], AuditLog.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_hora' }),
    __metadata("design:type", Date)
], AuditLog.prototype, "fechaHora", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], AuditLog.prototype, "modulo", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], AuditLog.prototype, "accion", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], AuditLog.prototype, "entidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entidad_id', nullable: true }),
    __metadata("design:type", Number)
], AuditLog.prototype, "entidadId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "detalle", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, (user) => user.auditLogs, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], AuditLog.prototype, "usuario", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)('AUDIT_LOG')
], AuditLog);
//# sourceMappingURL=audit-log.entity.js.map