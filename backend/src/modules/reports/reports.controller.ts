import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly-attendance')
  @Roles('RRHH', 'Administrador')
  getMonthlyAttendance(@Query('mes') mes: number, @Query('anio') anio: number) {
    return this.reportsService.getMonthlyAttendance(mes, anio);
  }

  @Get('bonus-eligibility')
  @Roles('RRHH', 'Administrador')
  getBonusEligibility(@Query('mes') mes: number, @Query('anio') anio: number) {
    return this.reportsService.getBonusEligibility(mes, anio);
  }

  @Get('project-hours')
  @Roles('RRHH', 'Administrador')
  getProjectHours(@Query('fecha_inicio') fecha_inicio: string, @Query('fecha_fin') fecha_fin: string) {
    return this.reportsService.getProjectHours(fecha_inicio, fecha_fin);
  }
}
