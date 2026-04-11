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
}
