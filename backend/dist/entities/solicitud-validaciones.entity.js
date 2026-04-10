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
exports.SolicitudValidaciones = void 0;
const typeorm_1 = require("typeorm");
const parametro_sistema_entity_1 = require("./parametro-sistema.entity");
let SolicitudValidaciones = class SolicitudValidaciones {
};
exports.SolicitudValidaciones = SolicitudValidaciones;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'solicitud_validaciones_id' }),
    __metadata("design:type", Number)
], SolicitudValidaciones.prototype, "solicitudValidacionesId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parametro_id' }),
    __metadata("design:type", Number)
], SolicitudValidaciones.prototype, "parametroId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vac_min_dias_por_solicitud', nullable: true }),
    __metadata("design:type", Number)
], SolicitudValidaciones.prototype, "vacMinDiasPorSolicitud", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vac_max_dias_por_solicitud', nullable: true }),
    __metadata("design:type", Number)
], SolicitudValidaciones.prototype, "vacMaxDiasPorSolicitud", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vac_anticipacion_min_dias', nullable: true }),
    __metadata("design:type", Number)
], SolicitudValidaciones.prototype, "vacAnticipacionMinDias", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vac_permite_medio_dia', nullable: true }),
    __metadata("design:type", Boolean)
], SolicitudValidaciones.prototype, "vacPermiteMedioDia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vac_permite_por_horas', nullable: true }),
    __metadata("design:type", Boolean)
], SolicitudValidaciones.prototype, "vacPermitePorHoras", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vac_requiere_aprobacion_supervisor', nullable: true }),
    __metadata("design:type", Boolean)
], SolicitudValidaciones.prototype, "vacRequiereAprobacionSupervisor", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => parametro_sistema_entity_1.ParametroSistema),
    (0, typeorm_1.JoinColumn)({ name: 'parametro_id' }),
    __metadata("design:type", parametro_sistema_entity_1.ParametroSistema)
], SolicitudValidaciones.prototype, "parametro", void 0);
exports.SolicitudValidaciones = SolicitudValidaciones = __decorate([
    (0, typeorm_1.Entity)('SOLICITUD_VALIDACIONES')
], SolicitudValidaciones);
//# sourceMappingURL=solicitud-validaciones.entity.js.map