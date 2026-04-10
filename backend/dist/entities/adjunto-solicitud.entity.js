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
exports.AdjuntoSolicitud = void 0;
const typeorm_1 = require("typeorm");
const solicitud_permiso_entity_1 = require("./solicitud-permiso.entity");
let AdjuntoSolicitud = class AdjuntoSolicitud {
};
exports.AdjuntoSolicitud = AdjuntoSolicitud;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'adjunto_id' }),
    __metadata("design:type", Number)
], AdjuntoSolicitud.prototype, "adjuntoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'solicitud_id' }),
    __metadata("design:type", Number)
], AdjuntoSolicitud.prototype, "solicitudId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre_archivo', length: 255 }),
    __metadata("design:type", String)
], AdjuntoSolicitud.prototype, "nombreArchivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ruta_url', length: 500 }),
    __metadata("design:type", String)
], AdjuntoSolicitud.prototype, "rutaUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_mime', length: 100 }),
    __metadata("design:type", String)
], AdjuntoSolicitud.prototype, "tipoMime", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_subida' }),
    __metadata("design:type", Date)
], AdjuntoSolicitud.prototype, "fechaSubida", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => solicitud_permiso_entity_1.SolicitudPermiso, (sp) => sp.adjuntos),
    (0, typeorm_1.JoinColumn)({ name: 'solicitud_id' }),
    __metadata("design:type", solicitud_permiso_entity_1.SolicitudPermiso)
], AdjuntoSolicitud.prototype, "solicitud", void 0);
exports.AdjuntoSolicitud = AdjuntoSolicitud = __decorate([
    (0, typeorm_1.Entity)('ADJUNTO_SOLICITUD')
], AdjuntoSolicitud);
//# sourceMappingURL=adjunto-solicitud.entity.js.map