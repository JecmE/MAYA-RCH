"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const reports_controller_1 = require("./reports.controller");
const reports_service_1 = require("./reports.service");
const registro_asistencia_entity_1 = require("../../entities/registro-asistencia.entity");
const solicitud_permiso_entity_1 = require("../../entities/solicitud-permiso.entity");
const registro_tiempo_entity_1 = require("../../entities/registro-tiempo.entity");
const kpi_mensual_entity_1 = require("../../entities/kpi-mensual.entity");
const bono_resultado_entity_1 = require("../../entities/bono-resultado.entity");
const empleado_entity_1 = require("../../entities/empleado.entity");
const vacacion_saldo_entity_1 = require("../../entities/vacacion-saldo.entity");
let ReportsModule = class ReportsModule {
};
exports.ReportsModule = ReportsModule;
exports.ReportsModule = ReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                registro_asistencia_entity_1.RegistroAsistencia,
                solicitud_permiso_entity_1.SolicitudPermiso,
                registro_tiempo_entity_1.RegistroTiempo,
                kpi_mensual_entity_1.KpiMensual,
                bono_resultado_entity_1.BonoResultado,
                empleado_entity_1.Empleado,
                vacacion_saldo_entity_1.VacacionSaldo,
            ]),
        ],
        controllers: [reports_controller_1.ReportsController],
        providers: [reports_service_1.ReportsService],
        exports: [reports_service_1.ReportsService],
    })
], ReportsModule);
//# sourceMappingURL=reports.module.js.map