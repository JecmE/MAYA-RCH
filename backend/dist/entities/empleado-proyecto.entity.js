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
exports.EmpleadoProyecto = void 0;
const typeorm_1 = require("typeorm");
const empleado_entity_1 = require("./empleado.entity");
const proyecto_entity_1 = require("./proyecto.entity");
let EmpleadoProyecto = class EmpleadoProyecto {
};
exports.EmpleadoProyecto = EmpleadoProyecto;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'emp_proy_id' }),
    __metadata("design:type", Number)
], EmpleadoProyecto.prototype, "empProyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'empleado_id' }),
    __metadata("design:type", Number)
], EmpleadoProyecto.prototype, "empleadoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'proyecto_id' }),
    __metadata("design:type", Number)
], EmpleadoProyecto.prototype, "proyectoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_inicio', type: 'date' }),
    __metadata("design:type", Date)
], EmpleadoProyecto.prototype, "fecha_inicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_fin', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], EmpleadoProyecto.prototype, "fecha_fin", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Boolean)
], EmpleadoProyecto.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => empleado_entity_1.Empleado, (emp) => emp.empleadoProyectos),
    (0, typeorm_1.JoinColumn)({ name: 'empleado_id' }),
    __metadata("design:type", empleado_entity_1.Empleado)
], EmpleadoProyecto.prototype, "empleado", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => proyecto_entity_1.Proyecto, (proy) => proy.empleadoProyectos),
    (0, typeorm_1.JoinColumn)({ name: 'proyecto_id' }),
    __metadata("design:type", proyecto_entity_1.Proyecto)
], EmpleadoProyecto.prototype, "proyecto", void 0);
exports.EmpleadoProyecto = EmpleadoProyecto = __decorate([
    (0, typeorm_1.Entity)('EMPLEADO_PROYECTO'),
    (0, typeorm_1.Unique)(['empleadoId', 'proyectoId'])
], EmpleadoProyecto);
//# sourceMappingURL=empleado-proyecto.entity.js.map