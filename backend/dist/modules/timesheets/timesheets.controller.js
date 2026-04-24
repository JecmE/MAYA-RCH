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
exports.TimesheetsController = void 0;
const common_1 = require("@nestjs/common");
const timesheets_service_1 = require("./timesheets.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let TimesheetsController = class TimesheetsController {
    constructor(timesheetsService) {
        this.timesheetsService = timesheetsService;
    }
    getMyTimesheets(req, fecha_inicio, fecha_fin, proyectoId) {
        return this.timesheetsService.getMyTimesheets(req.user.empleadoId, fecha_inicio, fecha_fin, proyectoId);
    }
    createEntry(createDto, req) {
        return this.timesheetsService.createEntry(createDto, req.user.empleadoId);
    }
    getTeamTimesheets(req, fecha_inicio, fecha_fin) {
        return this.timesheetsService.getTeamTimesheets(req.user.empleadoId, fecha_inicio, fecha_fin);
    }
    approve(id, body, req) {
        return this.timesheetsService.approve(id, body.comentario || body.comentarios, req.user.usuarioId);
    }
    reject(id, body, req) {
        return this.timesheetsService.reject(id, body.comentario || body.comentarios, req.user.usuarioId);
    }
    getProjectSummary(fecha_inicio, fecha_fin) {
        return this.timesheetsService.getProjectSummary(fecha_inicio, fecha_fin);
    }
};
exports.TimesheetsController = TimesheetsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('fecha_inicio')),
    __param(2, (0, common_1.Query)('fecha_fin')),
    __param(3, (0, common_1.Query)('proyectoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Number]),
    __metadata("design:returntype", void 0)
], TimesheetsController.prototype, "getMyTimesheets", null);
__decorate([
    (0, common_1.Post)('entry'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TimesheetsController.prototype, "createEntry", null);
__decorate([
    (0, common_1.Get)('team'),
    (0, roles_decorator_1.Roles)('Supervisor', 'RRHH', 'Administrador'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('fecha_inicio')),
    __param(2, (0, common_1.Query)('fecha_fin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], TimesheetsController.prototype, "getTeamTimesheets", null);
__decorate([
    (0, common_1.Put)(':id/approve'),
    (0, roles_decorator_1.Roles)('Supervisor', 'RRHH', 'Administrador'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], TimesheetsController.prototype, "approve", null);
__decorate([
    (0, common_1.Put)(':id/reject'),
    (0, roles_decorator_1.Roles)('Supervisor', 'RRHH', 'Administrador'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], TimesheetsController.prototype, "reject", null);
__decorate([
    (0, common_1.Get)('report/project-summary'),
    (0, roles_decorator_1.Roles)('Supervisor', 'RRHH', 'Administrador'),
    __param(0, (0, common_1.Query)('fecha_inicio')),
    __param(1, (0, common_1.Query)('fecha_fin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TimesheetsController.prototype, "getProjectSummary", null);
exports.TimesheetsController = TimesheetsController = __decorate([
    (0, common_1.Controller)('timesheets'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [timesheets_service_1.TimesheetsService])
], TimesheetsController);
//# sourceMappingURL=timesheets.controller.js.map