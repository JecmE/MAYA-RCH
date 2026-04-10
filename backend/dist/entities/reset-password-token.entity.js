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
exports.ResetPasswordToken = void 0;
const typeorm_1 = require("typeorm");
const usuario_entity_1 = require("./usuario.entity");
let ResetPasswordToken = class ResetPasswordToken {
};
exports.ResetPasswordToken = ResetPasswordToken;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'reset_id' }),
    __metadata("design:type", Number)
], ResetPasswordToken.prototype, "resetId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id' }),
    __metadata("design:type", Number)
], ResetPasswordToken.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'token_hash', length: 255 }),
    __metadata("design:type", String)
], ResetPasswordToken.prototype, "tokenHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_creacion', type: 'datetime' }),
    __metadata("design:type", Date)
], ResetPasswordToken.prototype, "fechaCreacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_expira', type: 'datetime' }),
    __metadata("design:type", Date)
], ResetPasswordToken.prototype, "fechaExpira", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Boolean)
], ResetPasswordToken.prototype, "usado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_uso', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], ResetPasswordToken.prototype, "fechaUso", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_solicitud', length: 45, nullable: true }),
    __metadata("design:type", String)
], ResetPasswordToken.prototype, "ipSolicitud", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent', length: 255, nullable: true }),
    __metadata("design:type", String)
], ResetPasswordToken.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, (user) => user.resetPasswordTokens),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], ResetPasswordToken.prototype, "usuario", void 0);
exports.ResetPasswordToken = ResetPasswordToken = __decorate([
    (0, typeorm_1.Entity)('RESET_PASSWORD_TOKEN')
], ResetPasswordToken);
//# sourceMappingURL=reset-password-token.entity.js.map