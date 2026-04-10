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
exports.DecisionPermiso = void 0;
const typeorm_1 = require("typeorm");
const solicitud_permiso_entity_1 = require("./solicitud-permiso.entity");
const usuario_entity_1 = require("./usuario.entity");
let DecisionPermiso = class DecisionPermiso {
};
exports.DecisionPermiso = DecisionPermiso;
DecisionPermiso.DECISION_APROBADO = 'aprobado';
DecisionPermiso.DECISION_RECHAZADO = 'rechazado';
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'decision_id' }),
    __metadata("design:type", Number)
], DecisionPermiso.prototype, "decisionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'solicitud_id' }),
    __metadata("design:type", Number)
], DecisionPermiso.prototype, "solicitudId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id' }),
    __metadata("design:type", Number)
], DecisionPermiso.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], DecisionPermiso.prototype, "decision", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], DecisionPermiso.prototype, "comentario", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_hora' }),
    __metadata("design:type", Date)
], DecisionPermiso.prototype, "fechaHora", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => solicitud_permiso_entity_1.SolicitudPermiso, (sp) => sp.decisiones),
    (0, typeorm_1.JoinColumn)({ name: 'solicitud_id' }),
    __metadata("design:type", solicitud_permiso_entity_1.SolicitudPermiso)
], DecisionPermiso.prototype, "solicitud", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, (user) => user.decisionesPermiso),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], DecisionPermiso.prototype, "usuario", void 0);
exports.DecisionPermiso = DecisionPermiso = __decorate([
    (0, typeorm_1.Entity)('DECISION_PERMISO')
], DecisionPermiso);
//# sourceMappingURL=decision-permiso.entity.js.map