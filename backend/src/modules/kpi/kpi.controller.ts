import { Controller, Get, UseGuards, Req, Query, ParseIntPipe, Param, Put, Body } from '@nestjs/common';
import { KpiService } from './kpi.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('kpi')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get('dashboard/employee')
  getEmployeeDashboard(@Req() req: any, @Query('mes') mes?: number, @Query('anio') anio?: number) {
    return this.kpiService.getEmployeeDashboard(req.user.empleadoId, mes, anio);
  }

  @Get('dashboard/supervisor')
  @Roles('Supervisor', 'RRHH', 'Administrador')
  getSupervisorDashboard(
    @Req() req: any,
    @Query('mes') mes?: number,
    @Query('anio') anio?: number,
  ) {
    return this.kpiService.getSupervisorDashboard(req.user.empleadoId, mes, anio);
  }

  @Get('dashboard/hr')
  @Roles('RRHH', 'Administrador')
  getHrDashboard(@Query('mes') mes?: number, @Query('anio') anio?: number) {
    return this.kpiService.getHrDashboard(mes, anio);
  }

  @Get('employee-classification')
  getEmployeeClassification(
    @Req() req: any,
    @Query('mes') mes?: number,
    @Query('anio') anio?: number,
  ) {
    return this.kpiService.getEmployeeClassification(req.user.empleadoId, mes, anio);
  }

  @Get('employee/:id/profile')
  getEmployeeProfile(@Param('id', ParseIntPipe) id: number) {
    return this.kpiService.getEmployeeProfile(id);
  }

  @Put('observation/:empleadoId')
  @Roles('Supervisor', 'RRHH', 'Administrador')
  saveObservation(
    @Param('empleadoId', ParseIntPipe) empleadoId: number,
    @Body('mes') mes: number,
    @Body('anio') anio: number,
    @Body('observacion') observacion: string,
  ) {
    return this.kpiService.saveObservation(empleadoId, mes, anio, observacion);
  }
}
