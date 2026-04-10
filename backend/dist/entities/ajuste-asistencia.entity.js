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
exports.AjusteAsistencia = void 0;
const typeorm_1 = require("typeorm");
const registro_asistencia_entity_1 = require("./registro-asistencia.entity");
const usuario_entity_1 = require("./usuario.entity");
let AjusteAsistencia = class AjusteAsistencia {
};
exports.AjusteAsistencia = AjusteAsistencia;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'ajuste_id' }),
    __metadata("design:type", Number)
], AjusteAsistencia.prototype, "ajusteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'asistencia_id' }),
    __metadata("design:type", Number)
], AjusteAsistencia.prototype, "asistenciaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id' }),
    __metadata("design:type", Number)
], AjusteAsistencia.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campo_modificado', length: 50 }),
    __metadata("design:type", String)
], AjusteAsistencia.prototype, "campoModificado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'valor_anterior', length: 255 }),
    __metadata("design:type", String)
], AjusteAsistencia.prototype, "valorAnterior", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'valor_nuevo', length: 255 }),
    __metadata("design:type", String)
], AjusteAsistencia.prototype, "valorNuevo", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], AjusteAsistencia.prototype, "motivo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_hora' }),
    __metadata("design:type", Date)
], AjusteAsistencia.prototype, "fechaHora", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => registro_asistencia_entity_1.RegistroAsistencia, (ra) => ra.ajustes),
    (0, typeorm_1.JoinColumn)({ name: 'asistencia_id' }),
    __metadata("design:type", registro_asistencia_entity_1.RegistroAsistencia)
], AjusteAsistencia.prototype, "asistencia", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, (user) => user.ajustes),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], AjusteAsistencia.prototype, "usuario", void 0);
exports.AjusteAsistencia = AjusteAsistencia = __decorate([
    (0, typeorm_1.Entity)('AJUSTE_ASISTENCIA')
], AjusteAsistencia);
//# sourceMappingURL=ajuste-asistencia.entity.js.map