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
exports.AprobacionTiempo = void 0;
const typeorm_1 = require("typeorm");
const registro_tiempo_entity_1 = require("./registro-tiempo.entity");
const usuario_entity_1 = require("./usuario.entity");
let AprobacionTiempo = class AprobacionTiempo {
};
exports.AprobacionTiempo = AprobacionTiempo;
AprobacionTiempo.DECISION_APROBADO = 'aprobado';
AprobacionTiempo.DECISION_RECHAZADO = 'rechazado';
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'aprobacion_id' }),
    __metadata("design:type", Number)
], AprobacionTiempo.prototype, "aprobacionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tiempo_id' }),
    __metadata("design:type", Number)
], AprobacionTiempo.prototype, "tiempoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id' }),
    __metadata("design:type", Number)
], AprobacionTiempo.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], AprobacionTiempo.prototype, "decision", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], AprobacionTiempo.prototype, "comentario", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_hora' }),
    __metadata("design:type", Date)
], AprobacionTiempo.prototype, "fechaHora", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => registro_tiempo_entity_1.RegistroTiempo, (rt) => rt.aprobaciones),
    (0, typeorm_1.JoinColumn)({ name: 'tiempo_id' }),
    __metadata("design:type", registro_tiempo_entity_1.RegistroTiempo)
], AprobacionTiempo.prototype, "registroTiempo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, (user) => user.aprobacionesTiempo),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], AprobacionTiempo.prototype, "usuario", void 0);
exports.AprobacionTiempo = AprobacionTiempo = __decorate([
    (0, typeorm_1.Entity)('APROBACION_TIEMPO')
], AprobacionTiempo);
//# sourceMappingURL=aprobacion-tiempo.entity.js.map