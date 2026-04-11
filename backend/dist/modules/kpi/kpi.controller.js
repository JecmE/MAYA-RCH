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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiController = void 0;
const common_1 = require("@nestjs/common");
const kpi_service_1 = require("./kpi.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let KpiController = class KpiController {
    constructor(kpiService) {
        this.kpiService = kpiService;
    }
    getEmployeeDashboard(req, mes, anio) {
        return this.kpiService.getEmployeeDashboard(req.user.empleadoId, mes, anio);
    }
    getSupervisorDashboard(req, mes, anio) {
        return this.kpiService.getSupervisorDashboard(req.user.empleadoId, mes, anio);
    }
    getHrDashboard(mes, anio) {
        return this.kpiService.getHrDashboard(mes, anio);
    }
    getEmployeeClassification(req, mes, anio) {
        return this.kpiService.getEmployeeClassification(req.user.empleadoId, mes, anio);
    }
    getEmployeeProfile(id) {
        return this.kpiService.getEmployeeProfile(id);
    }
};
exports.KpiController = KpiController;
__decorate([
    (0, common_1.Get)('dashboard/employee'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('mes')),
    __param(2, (0, common_1.Query)('anio')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", void 0)
], KpiController.prototype, "getEmployeeDashboard", null);
__decorate([
    (0, common_1.Get)('dashboard/supervisor'),
    (0, roles_decorator_1.Roles)('Supervisor', 'RRHH', 'Administrador'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('mes')),
    __param(2, (0, common_1.Query)('anio')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", void 0)
], KpiController.prototype, "getSupervisorDashboard", null);
__decorate([
    (0, common_1.Get)('dashboard/hr'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Query)('mes')),
    __param(1, (0, common_1.Query)('anio')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], KpiController.prototype, "getHrDashboard", null);
__decorate([
    (0, common_1.Get)('employee-classification'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('mes')),
    __param(2, (0, common_1.Query)('anio')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", void 0)
], KpiController.prototype, "getEmployeeClassification", null);
__decorate([
    (0, common_1.Get)('employee/:id/profile'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], KpiController.prototype, "getEmployeeProfile", null);
exports.KpiController = KpiController = __decorate([
    (0, common_1.Controller)('kpi'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [kpi_service_1.KpiService])
], KpiController);
//# sourceMappingURL=kpi.controller.js.map