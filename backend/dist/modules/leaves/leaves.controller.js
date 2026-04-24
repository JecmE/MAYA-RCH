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
exports.LeavesController = void 0;
const common_1 = require("@nestjs/common");
const leaves_service_1 = require("./leaves.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let LeavesController = class LeavesController {
    constructor(leavesService) {
        this.leavesService = leavesService;
    }
    getTypes(todos) {
        return this.leavesService.getTiposPermiso(todos === 'true');
    }
    createType(dto, req) {
        return this.leavesService.createTipoPermiso(dto, req.user.usuarioId);
    }
    updateType(id, dto, req) {
        return this.leavesService.updateTipoPermiso(id, dto, req.user.usuarioId);
    }
    getAllRequests() {
        return this.leavesService.getAllRequests();
    }
    getAllBalances() {
        return this.leavesService.getAllBalances();
    }
    getMovements() {
        return this.leavesService.getVacationMovements();
    }
    createRequest(createDto, req) {
        return this.leavesService.createRequest(createDto, req.user.empleadoId);
    }
    getMyRequests(req) {
        return this.leavesService.getMyRequests(req.user.empleadoId);
    }
    getPending(req) {
        return this.leavesService.getPendingRequests(req.user.empleadoId);
    }
    approve(id, body, req) {
        return this.leavesService.approveRequest(id, body.comentario || body.comentarios, req.user.usuarioId);
    }
    reject(id, body, req) {
        return this.leavesService.rejectRequest(id, body.comentario || body.comentarios, req.user.usuarioId);
    }
    getVacationBalance(req) {
        return this.leavesService.getVacationBalance(req.user.empleadoId);
    }
    getEmployeeVacationBalance(employeeId) {
        return this.leavesService.getVacationBalance(employeeId);
    }
    adjustBalance(dto, req) {
        return this.leavesService.adjustVacationBalance(dto, req.user.usuarioId);
    }
    getAttachment(fileName, res) {
        return this.leavesService.getAttachment(fileName, res);
    }
};
exports.LeavesController = LeavesController;
__decorate([
    (0, common_1.Get)('types'),
    __param(0, (0, common_1.Query)('todos')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeavesController.prototype, "getTypes", null);
__decorate([
    (0, common_1.Post)('types'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LeavesController.prototype, "createType", null);
__decorate([
    (0, common_1.Put)('types/:id'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], LeavesController.prototype, "updateType", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LeavesController.prototype, "getAllRequests", null);
__decorate([
    (0, common_1.Get)('balances'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LeavesController.prototype, "getAllBalances", null);
__decorate([
    (0, common_1.Get)('movements'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LeavesController.prototype, "getMovements", null);
__decorate([
    (0, common_1.Post)('request'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LeavesController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Get)('my-requests'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LeavesController.prototype, "getMyRequests", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, roles_decorator_1.Roles)('Supervisor', 'RRHH', 'Administrador'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LeavesController.prototype, "getPending", null);
__decorate([
    (0, common_1.Put)(':id/approve'),
    (0, roles_decorator_1.Roles)('Supervisor', 'RRHH', 'Administrador'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], LeavesController.prototype, "approve", null);
__decorate([
    (0, common_1.Put)(':id/reject'),
    (0, roles_decorator_1.Roles)('Supervisor', 'RRHH', 'Administrador'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], LeavesController.prototype, "reject", null);
__decorate([
    (0, common_1.Get)('vacation-balance'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LeavesController.prototype, "getVacationBalance", null);
__decorate([
    (0, common_1.Get)('vacation-balance/:employeeId'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Param)('employeeId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], LeavesController.prototype, "getEmployeeVacationBalance", null);
__decorate([
    (0, common_1.Post)('balances/adjust'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LeavesController.prototype, "adjustBalance", null);
__decorate([
    (0, common_1.Get)('attachment/:fileName'),
    __param(0, (0, common_1.Param)('fileName')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeavesController.prototype, "getAttachment", null);
exports.LeavesController = LeavesController = __decorate([
    (0, common_1.Controller)('leaves'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [leaves_service_1.LeavesService])
], LeavesController);
//# sourceMappingURL=leaves.controller.js.map