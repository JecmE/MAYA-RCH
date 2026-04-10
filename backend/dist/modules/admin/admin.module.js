"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
const turno_entity_1 = require("../../entities/turno.entity");
const empleado_turno_entity_1 = require("../../entities/empleado-turno.entity");
const tipo_permiso_entity_1 = require("../../entities/tipo-permiso.entity");
const parametro_sistema_entity_1 = require("../../entities/parametro-sistema.entity");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
const rol_entity_1 = require("../../entities/rol.entity");
const regla_bono_entity_1 = require("../../entities/regla-bono.entity");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                turno_entity_1.Turno,
                empleado_turno_entity_1.EmpleadoTurno,
                tipo_permiso_entity_1.TipoPermiso,
                parametro_sistema_entity_1.ParametroSistema,
                audit_log_entity_1.AuditLog,
                rol_entity_1.Rol,
                regla_bono_entity_1.ReglaBono,
            ]),
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService],
        exports: [admin_service_1.AdminService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map