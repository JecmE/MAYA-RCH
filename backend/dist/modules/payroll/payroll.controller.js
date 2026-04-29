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
exports.PayrollController = void 0;
const common_1 = require("@nestjs/common");
const payroll_service_1 = require("./payroll.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let PayrollController = class PayrollController {
    constructor(payrollService) {
        this.payrollService = payrollService;
    }
    getPeriods() {
        return this.payrollService.getPeriods();
    }
    createPeriod(createDto, req) {
        return this.payrollService.createPeriod(createDto, req.user.usuarioId);
    }
    calculatePayroll(id, req) {
        return this.payrollService.calculatePayroll(id, req.user.usuarioId);
    }
    closePeriod(id, req) {
        return this.payrollService.closePeriod(id, req.user.usuarioId);
    }
    getMyPaycheck(req, periodoId) {
        return this.payrollService.getMyPaycheck(req.user.empleadoId, periodoId);
    }
    getMyPeriods(req) {
        return this.payrollService.getMyPeriods(req.user.empleadoId);
    }
    getConcepts() {
        return this.payrollService.getConcepts();
    }
    seedTestData() {
        return this.payrollService.seedTestData();
    }
};
exports.PayrollController = PayrollController;
__decorate([
    (0, common_1.Get)('periods'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "getPeriods", null);
__decorate([
    (0, common_1.Post)('periods'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "createPeriod", null);
__decorate([
    (0, common_1.Post)('periods/:id/calculate'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "calculatePayroll", null);
__decorate([
    (0, common_1.Post)('periods/:id/close'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "closePeriod", null);
__decorate([
    (0, common_1.Get)('my-paycheck'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('periodoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "getMyPaycheck", null);
__decorate([
    (0, common_1.Get)('my-periods'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "getMyPeriods", null);
__decorate([
    (0, common_1.Get)('concepts'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "getConcepts", null);
__decorate([
    (0, common_1.Post)('seed-test-data'),
    (0, roles_decorator_1.Roles)('Empleado', 'Supervisor', 'RRHH', 'Administrador'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "seedTestData", null);
exports.PayrollController = PayrollController = __decorate([
    (0, common_1.Controller)('payroll'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService])
], PayrollController);
//# sourceMappingURL=payroll.controller.js.map