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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const attendance_service_1 = require("./attendance.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let AttendanceController = class AttendanceController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    async checkIn(req) {
        return this.attendanceService.registerEntry(req.user.empleadoId, req.user.usuarioId);
    }
    async checkOut(req) {
        return this.attendanceService.registerExit(req.user.empleadoId, req.user.usuarioId);
    }
    async getTodayStatus(req) {
        return this.attendanceService.getTodayStatus(req.user.empleadoId);
    }
    async getHistory(req, fechaInicio, fechaFin) {
        return this.attendanceService.getHistory(req.user.empleadoId, fechaInicio, fechaFin);
    }
    async getEmployeeHistory(id, fechaInicio, fechaFin) {
        return this.attendanceService.getHistory(id, fechaInicio, fechaFin);
    }
    async adjustAttendance(id, adjustDto, req) {
        return this.attendanceService.adjustAttendance(id, adjustDto, req.user.usuarioId);
    }
    async getTeamAttendance(req, fecha) {
        return this.attendanceService.getTeamAttendance(req.user.empleadoId, fecha);
    }
    async getAllAttendance(fechaInicio, fechaFin) {
        return this.attendanceService.getAllAttendance(fechaInicio, fechaFin);
    }
    async getAdjustmentHistory() {
        return this.attendanceService.getAdjustmentHistory();
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('check-in'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Post)('check-out'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "checkOut", null);
__decorate([
    (0, common_1.Get)('today'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getTodayStatus", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('fechaInicio')),
    __param(2, (0, common_1.Query)('fechaFin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('employee/:id'),
    (0, roles_decorator_1.Roles)('Supervisor', 'RRHH', 'Administrador'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('fechaInicio')),
    __param(2, (0, common_1.Query)('fechaFin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getEmployeeHistory", null);
__decorate([
    (0, common_1.Put)('adjust/:id'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "adjustAttendance", null);
__decorate([
    (0, common_1.Get)('team'),
    (0, roles_decorator_1.Roles)('Supervisor', 'RRHH', 'Administrador'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('fecha')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getTeamAttendance", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __param(0, (0, common_1.Query)('fechaInicio')),
    __param(1, (0, common_1.Query)('fechaFin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getAllAttendance", null);
__decorate([
    (0, common_1.Get)('adjustments/history'),
    (0, roles_decorator_1.Roles)('RRHH', 'Administrador'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getAdjustmentHistory", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.Controller)('attendance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map