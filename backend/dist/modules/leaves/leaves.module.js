"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeavesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const leaves_controller_1 = require("./leaves.controller");
const leaves_service_1 = require("./leaves.service");
const solicitud_permiso_entity_1 = require("../../entities/solicitud-permiso.entity");
const tipo_permiso_entity_1 = require("../../entities/tipo-permiso.entity");
const decision_permiso_entity_1 = require("../../entities/decision-permiso.entity");
const adjunto_solicitud_entity_1 = require("../../entities/adjunto-solicitud.entity");
const vacacion_saldo_entity_1 = require("../../entities/vacacion-saldo.entity");
const vacacion_movimiento_entity_1 = require("../../entities/vacacion-movimiento.entity");
const empleado_entity_1 = require("../../entities/empleado.entity");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
let LeavesModule = class LeavesModule {
};
exports.LeavesModule = LeavesModule;
exports.LeavesModule = LeavesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                solicitud_permiso_entity_1.SolicitudPermiso,
                tipo_permiso_entity_1.TipoPermiso,
                decision_permiso_entity_1.DecisionPermiso,
                adjunto_solicitud_entity_1.AdjuntoSolicitud,
                vacacion_saldo_entity_1.VacacionSaldo,
                vacacion_movimiento_entity_1.VacacionMovimiento,
                empleado_entity_1.Empleado,
                audit_log_entity_1.AuditLog,
            ]),
        ],
        controllers: [leaves_controller_1.LeavesController],
        providers: [leaves_service_1.LeavesService],
        exports: [leaves_service_1.LeavesService],
    })
], LeavesModule);
//# sourceMappingURL=leaves.module.js.map