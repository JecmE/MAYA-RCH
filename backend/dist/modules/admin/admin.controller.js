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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    getShifts() {
        return this.adminService.getShifts();
    }
    createShift(createDto, req) {
        return this.adminService.createShift(createDto, req.user.usuarioId);
    }
    updateShift(id, updateDto, req) {
        return this.adminService.updateShift(id, updateDto, req.user.usuarioId);
    }
    deactivateShift(id, req) {
        return this.adminService.deactivateShift(id, req.user.usuarioId);
    }
    getKpiParameters() {
        return this.adminService.getKpiParameters();
    }
    updateKpiParameters(updateDto, req) {
        return this.adminService.updateKpiParameters(updateDto, req.user.usuarioId);
    }
    getBonusRules() {
        return this.adminService.getBonusRules();
    }
    createBonusRule(createDto, req) {
        return this.adminService.createBonusRule(createDto, req.user.usuarioId);
    }
    getAuditLogs(fechaInicio, fechaFin, usuarioId, modulo) {
        return this.adminService.getAuditLogs(fechaInicio, fechaFin, usuarioId, modulo);
    }
    getRoles() {
        return this.adminService.getRoles();
    }
    getAdminDashboard() {
        return this.adminService.getAdminDashboardStats();
    }
    getRrhhDashboard() {
        return this.adminService.getRrhhDashboardStats();
    }
    getSupervisorDashboard(req) {
        return this.adminService.getSupervisorDashboardStats(req.user.empleadoId);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('shifts'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getShifts", null);
__decorate([
    (0, common_1.Post)('shifts'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createShift", null);
__decorate([
    (0, common_1.Put)('shifts/:id'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateShift", null);
__decorate([
    (0, common_1.Delete)('shifts/:id'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deactivateShift", null);
__decorate([
    (0, common_1.Get)('kpi-parameters'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getKpiParameters", null);
__decorate([
    (0, common_1.Put)('kpi-parameters'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateKpiParameters", null);
__decorate([
    (0, common_1.Get)('bonus-rules'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getBonusRules", null);
__decorate([
    (0, common_1.Post)('bonus-rules'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createBonusRule", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Query)('fechaInicio')),
    __param(1, (0, common_1.Query)('fechaFin')),
    __param(2, (0, common_1.Query)('usuarioId')),
    __param(3, (0, common_1.Query)('modulo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)('roles'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getRoles", null);
__decorate([
    (0, common_1.Get)('dashboard/admin'),
    (0, roles_decorator_1.Roles)('Administrador'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAdminDashboard", null);
__decorate([
    (0, common_1.Get)('dashboard/rrhh'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getRrhhDashboard", null);
__decorate([
    (0, common_1.Get)('dashboard/supervisor'),
    (0, roles_decorator_1.Roles)('Supervisor'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getSupervisorDashboard", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map