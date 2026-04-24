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
exports.Proyecto = void 0;
const typeorm_1 = require("typeorm");
const departamento_entity_1 = require("./departamento.entity");
const empleado_proyecto_entity_1 = require("./empleado-proyecto.entity");
const registro_tiempo_entity_1 = require("./registro-tiempo.entity");
let Proyecto = class Proyecto {
};
exports.Proyecto = Proyecto;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'proyecto_id' }),
    __metadata("design:type", Number)
], Proyecto.prototype, "proyectoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'departamento_id', nullable: true }),
    __metadata("design:type", Number)
], Proyecto.prototype, "departamentoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, unique: true }),
    __metadata("design:type", String)
], Proyecto.prototype, "codigo", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Proyecto.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], Proyecto.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Proyecto.prototype, "responsable", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Boolean)
], Proyecto.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => departamento_entity_1.Departamento, (dept) => dept.proyectos, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'departamento_id' }),
    __metadata("design:type", departamento_entity_1.Departamento)
], Proyecto.prototype, "departamento", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => empleado_proyecto_entity_1.EmpleadoProyecto, (ep) => ep.proyecto),
    __metadata("design:type", Array)
], Proyecto.prototype, "empleadoProyectos", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => registro_tiempo_entity_1.RegistroTiempo, (rt) => rt.proyecto),
    __metadata("design:type", Array)
], Proyecto.prototype, "registrosTiempo", void 0);
exports.Proyecto = Proyecto = __decorate([
    (0, typeorm_1.Entity)('PROYECTO')
], Proyecto);
//# sourceMappingURL=proyecto.entity.js.map