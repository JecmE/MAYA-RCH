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
exports.Rol = void 0;
const typeorm_1 = require("typeorm");
const usuario_entity_1 = require("./usuario.entity");
let Rol = class Rol {
};
exports.Rol = Rol;
Rol.ROL_EMPLEADO = 'Empleado';
Rol.ROL_SUPERVISOR = 'Supervisor';
Rol.ROL_RRHH = 'RRHH';
Rol.ROL_ADMIN = 'Administrador';
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'rol_id' }),
    __metadata("design:type", Number)
], Rol.prototype, "rolId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, unique: true }),
    __metadata("design:type", String)
], Rol.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Rol.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => usuario_entity_1.Usuario, (user) => user.roles),
    __metadata("design:type", Array)
], Rol.prototype, "usuarios", void 0);
exports.Rol = Rol = __decorate([
    (0, typeorm_1.Entity)('ROL')
], Rol);
//# sourceMappingURL=rol.entity.js.map