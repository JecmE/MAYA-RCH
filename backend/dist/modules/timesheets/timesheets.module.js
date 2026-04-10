"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimesheetsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const timesheets_controller_1 = require("./timesheets.controller");
const timesheets_service_1 = require("./timesheets.service");
const registro_tiempo_entity_1 = require("../../entities/registro-tiempo.entity");
const proyecto_entity_1 = require("../../entities/proyecto.entity");
const empleado_entity_1 = require("../../entities/empleado.entity");
const aprobacion_tiempo_entity_1 = require("../../entities/aprobacion-tiempo.entity");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
let TimesheetsModule = class TimesheetsModule {
};
exports.TimesheetsModule = TimesheetsModule;
exports.TimesheetsModule = TimesheetsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([registro_tiempo_entity_1.RegistroTiempo, proyecto_entity_1.Proyecto, empleado_entity_1.Empleado, aprobacion_tiempo_entity_1.AprobacionTiempo, audit_log_entity_1.AuditLog]),
        ],
        controllers: [timesheets_controller_1.TimesheetsController],
        providers: [timesheets_service_1.TimesheetsService],
        exports: [timesheets_service_1.TimesheetsService],
    })
], TimesheetsModule);
//# sourceMappingURL=timesheets.module.js.map