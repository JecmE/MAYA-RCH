import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('shifts')
  @Roles('RRHH', 'Administrador')
  getShifts() {
    return this.adminService.getShifts();
  }

  @Post('shifts')
  @Roles('RRHH', 'Administrador')
  createShift(@Body() createDto: any, @Req() req: any) {
    return this.adminService.createShift(createDto, req.user.usuarioId);
  }

  @Put('shifts/:id')
  @Roles('RRHH', 'Administrador')
  updateShift(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any, @Req() req: any) {
    return this.adminService.updateShift(id, updateDto, req.user.usuarioId);
  }

  @Delete('shifts/:id')
  @Roles('RRHH', 'Administrador')
  deactivateShift(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.adminService.deactivateShift(id, req.user.usuarioId);
  }

  @Get('shifts/assignments')
  @Roles('RRHH', 'Administrador')
  getAssignments() {
    return this.adminService.getAssignments();
  }

  @Post('shifts/assignments')
  @Roles('RRHH', 'Administrador')
  assignShift(@Body() assignDto: any, @Req() req: any) {
    return this.adminService.assignShift(assignDto, req.user.usuarioId);
  }

  @Get('kpi-parameters')
  @Roles('RRHH', 'Administrador')
  getKpiParameters() {
    return this.adminService.getKpiParameters();
  }

  @Put('kpi-parameters')
  @Roles('RRHH', 'Administrador')
  updateKpiParameters(@Body() updateDto: any, @Req() req: any) {
    return this.adminService.updateKpiParameters(updateDto, req.user.usuarioId);
  }

  @Get('bonus-rules')
  @Roles('RRHH', 'Administrador')
  getBonusRules() {
    return this.adminService.getBonusRules();
  }

  @Post('bonus-rules')
  @Roles('RRHH', 'Administrador')
  createBonusRule(@Body() createDto: any, @Req() req: any) {
    return this.adminService.createBonusRule(createDto, req.user.usuarioId);
  }

  @Post('bonus/evaluate')
  @Roles('RRHH', 'Administrador')
  runEvaluation(@Body() body: { mes: number, anio: number }, @Req() req: any) {
    return this.adminService.runBonusEvaluation(body.mes, body.anio, req.user.usuarioId);
  }

  @Put('bonus-rules/:id')
  @Roles('RRHH', 'Administrador')
  updateBonusRule(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: any,
    @Req() req: any,
  ) {
    return this.adminService.updateBonusRule(id, updateDto, req.user.usuarioId);
  }

  @Delete('bonus-rules/:id')
  @Roles('RRHH', 'Administrador')
  deleteBonusRule(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.adminService.deleteBonusRule(id, req.user.usuarioId);
  }

  @Get('audit-logs')
  @Roles('RRHH', 'Administrador')
  getAuditLogs(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('usuarioId') usuarioId?: number,
    @Query('modulo') modulo?: string,
  ) {
    return this.adminService.getAuditLogs(fechaInicio, fechaFin, usuarioId, modulo);
  }

  @Get('roles')
  getRoles() {
    return this.adminService.getRoles();
  }

  @Post('roles')
  @Roles('Administrador')
  createRole(@Body() dto: any, @Req() req: any) {
    return this.adminService.createRole(dto, req.user.usuarioId);
  }

  @Delete('roles/:id')
  @Roles('Administrador')
  deleteRole(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.adminService.deleteRole(id, req.user.usuarioId);
  }

  @Get('roles/:id/permissions')
  // Eliminamos @Roles('Administrador') para permitir que cualquier usuario logueado
  // descargue sus propios permisos para construir su menú lateral.
  getRolePermissions(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getRolePermissions(id);
  }

  @Put('roles/:id/permissions')
  @Roles('Administrador')
  updateRolePermissions(@Param('id', ParseIntPipe) id: number, @Body() perms: any[], @Req() req: any) {
    return this.adminService.updateRolePermissions(id, perms, req.user.usuarioId);
  }

  @Get('dashboard/admin')
  @Roles('Administrador')
  getAdminDashboard() {
    return this.adminService.getAdminDashboardStats();
  }

  @Get('dashboard/rrhh')
  @Roles('RRHH', 'Administrador')
  getRrhhDashboard() {
    return this.adminService.getRrhhDashboardStats();
  }

  @Get('dashboard/supervisor')
  @Roles('Supervisor')
  getSupervisorDashboard(@Req() req: any) {
    return this.adminService.getSupervisorDashboardStats(req.user.empleadoId);
  }

  // Gestión de Usuarios
  @Get('users')
  @Roles('Administrador')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Post('users')
  @Roles('Administrador')
  createUser(@Body() dto: any, @Req() req: any) {
    return this.adminService.createUser(dto, req.user.usuarioId);
  }

  @Put('users/:id')
  @Roles('Administrador')
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @Req() req: any) {
    return this.adminService.updateUser(id, dto, req.user.usuarioId);
  }

  @Put('users/:id/status')
  @Roles('Administrador')
  toggleUserStatus(@Param('id', ParseIntPipe) id: number, @Body() body: { status: string }, @Req() req: any) {
    return this.adminService.updateUserStatus(id, body.status, req.user.usuarioId);
  }

  @Post('users/:id/reset-password')
  @Roles('Administrador')
  resetPassword(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.adminService.resetPassword(id, req.user.usuarioId);
  }

  @Post('users/:id/invalidate-session')
  @Roles('Administrador')
  invalidateSession(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.adminService.invalidateUserSession(id, req.user.usuarioId);
  }
}
