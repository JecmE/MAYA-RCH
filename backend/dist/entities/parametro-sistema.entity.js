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
exports.ParametroSistema = void 0;
const typeorm_1 = require("typeorm");
const usuario_entity_1 = require("./usuario.entity");
let ParametroSistema = class ParametroSistema {
};
exports.ParametroSistema = ParametroSistema;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'parametro_id' }),
    __metadata("design:type", Number)
], ParametroSistema.prototype, "parametroId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id_actualiza' }),
    __metadata("design:type", Number)
], ParametroSistema.prototype, "usuarioIdActualiza", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, unique: true }),
    __metadata("design:type", String)
], ParametroSistema.prototype, "clave", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], ParametroSistema.prototype, "valor", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], ParametroSistema.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Boolean)
], ParametroSistema.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_actualizacion' }),
    __metadata("design:type", Date)
], ParametroSistema.prototype, "fechaActualizacion", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id_actualiza' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], ParametroSistema.prototype, "usuarioActualiza", void 0);
exports.ParametroSistema = ParametroSistema = __decorate([
    (0, typeorm_1.Entity)('PARAMETRO_SISTEMA')
], ParametroSistema);
//# sourceMappingURL=parametro-sistema.entity.js.map