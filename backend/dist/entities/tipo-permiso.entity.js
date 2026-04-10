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
exports.TipoPermiso = void 0;
const typeorm_1 = require("typeorm");
const solicitud_permiso_entity_1 = require("./solicitud-permiso.entity");
let TipoPermiso = class TipoPermiso {
};
exports.TipoPermiso = TipoPermiso;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'tipo_permiso_id' }),
    __metadata("design:type", Number)
], TipoPermiso.prototype, "tipoPermisoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], TipoPermiso.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'requiere_documento', default: 0 }),
    __metadata("design:type", Boolean)
], TipoPermiso.prototype, "requiereDocumento", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'descuenta_vacaciones', default: 0 }),
    __metadata("design:type", Boolean)
], TipoPermiso.prototype, "descuentaVacaciones", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Boolean)
], TipoPermiso.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => solicitud_permiso_entity_1.SolicitudPermiso, (sp) => sp.tipoPermiso),
    __metadata("design:type", Array)
], TipoPermiso.prototype, "solicitudes", void 0);
exports.TipoPermiso = TipoPermiso = __decorate([
    (0, typeorm_1.Entity)('TIPO_PERMISO')
], TipoPermiso);
//# sourceMappingURL=tipo-permiso.entity.js.map