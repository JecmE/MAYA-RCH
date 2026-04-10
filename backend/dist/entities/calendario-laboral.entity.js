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
exports.CalendarioLaboral = void 0;
const typeorm_1 = require("typeorm");
const parametro_sistema_entity_1 = require("./parametro-sistema.entity");
let CalendarioLaboral = class CalendarioLaboral {
};
exports.CalendarioLaboral = CalendarioLaboral;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'calendario_laboral_id' }),
    __metadata("design:type", Number)
], CalendarioLaboral.prototype, "calendarioLaboralId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parametro_id' }),
    __metadata("design:type", Number)
], CalendarioLaboral.prototype, "parametroId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vac_cuenta_sabados', nullable: true }),
    __metadata("design:type", Boolean)
], CalendarioLaboral.prototype, "vacCuentaSabados", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vac_cuenta_domingos', nullable: true }),
    __metadata("design:type", Boolean)
], CalendarioLaboral.prototype, "vacCuentaDomingos", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vac_cuenta_feriados', nullable: true }),
    __metadata("design:type", Boolean)
], CalendarioLaboral.prototype, "vacCuentaFeriados", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vac_feriados_lista', length: 500, nullable: true }),
    __metadata("design:type", String)
], CalendarioLaboral.prototype, "vacFeriadosLista", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => parametro_sistema_entity_1.ParametroSistema),
    (0, typeorm_1.JoinColumn)({ name: 'parametro_id' }),
    __metadata("design:type", parametro_sistema_entity_1.ParametroSistema)
], CalendarioLaboral.prototype, "parametro", void 0);
exports.CalendarioLaboral = CalendarioLaboral = __decorate([
    (0, typeorm_1.Entity)('CALENDARIO_LABORAL')
], CalendarioLaboral);
//# sourceMappingURL=calendario-laboral.entity.js.map