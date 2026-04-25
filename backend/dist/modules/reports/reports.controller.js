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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    getMonthlyAttendance(fechaInicio, fechaFin, departamento) {
        return this.reportsService.getMonthlyAttendance(fechaInicio, fechaFin, departamento);
    }
    getBonusEligibility(mes, anio, fechaInicio, fechaFin, departamento, proyecto) {
        if (fechaInicio && fechaFin) {
            return this.reportsService.getBonusEligibilityByRange(fechaInicio, fechaFin, departamento, proyecto);
        }
        return this.reportsService.getBonusEligibility(Number(mes), Number(anio), departamento);
    }
    getProjectHours(fechaInicio, fechaFin, departamento, proyecto) {
        return this.reportsService.getProjectHours(fechaInicio, fechaFin, departamento, proyecto);
    }
    getVacationBalances(fechaInicio, fechaFin, departamento, proyecto) {
        return this.reportsService.getVacationReport(fechaInicio, fechaFin, departamento, proyecto);
    }
    getDepartments() {
        return this.reportsService.getUniqueDepartments();
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('monthly-attendance'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Query)('fechaInicio')),
    __param(1, (0, common_1.Query)('fechaFin')),
    __param(2, (0, common_1.Query)('departamento')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getMonthlyAttendance", null);
__decorate([
    (0, common_1.Get)('bonus-eligibility'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Query)('mes')),
    __param(1, (0, common_1.Query)('anio')),
    __param(2, (0, common_1.Query)('fechaInicio')),
    __param(3, (0, common_1.Query)('fechaFin')),
    __param(4, (0, common_1.Query)('departamento')),
    __param(5, (0, common_1.Query)('proyecto')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getBonusEligibility", null);
__decorate([
    (0, common_1.Get)('project-hours'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Query)('fechaInicio')),
    __param(1, (0, common_1.Query)('fechaFin')),
    __param(2, (0, common_1.Query)('departamento')),
    __param(3, (0, common_1.Query)('proyecto')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getProjectHours", null);
__decorate([
    (0, common_1.Get)('vacation-balances'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Query)('fechaInicio')),
    __param(1, (0, common_1.Query)('fechaFin')),
    __param(2, (0, common_1.Query)('departamento')),
    __param(3, (0, common_1.Query)('proyecto')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getVacationBalances", null);
__decorate([
    (0, common_1.Get)('departments'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getDepartments", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map