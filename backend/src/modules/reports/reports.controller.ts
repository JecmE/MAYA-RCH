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
  getMonthlyAttendance(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('departamento') departamento?: string
  ) {
    return this.reportsService.getMonthlyAttendance(fechaInicio, fechaFin, departamento);
  }

  @Get('bonus-eligibility')
  @Roles('RRHH', 'Administrador')
  getBonusEligibility(
    @Query('mes') mes: number,
    @Query('anio') anio: number,
    @Query('departamento') departamento?: string
  ) {
    return this.reportsService.getBonusEligibility(mes, anio, departamento);
  }

  @Get('project-hours')
  @Roles('RRHH', 'Administrador')
  getProjectHours(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('departamento') departamento?: string,
    @Query('proyecto') proyecto?: string
  ) {
    return this.reportsService.getProjectHours(fechaInicio, fechaFin, departamento, proyecto);
  }

  @Get('vacation-balances')
  @Roles('RRHH', 'Administrador')
  getVacationBalances(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('departamento') departamento?: string
  ) {
    return this.reportsService.getVacationReport(fechaInicio, fechaFin, departamento);
  }

  @Get('departments')
  @Roles('RRHH', 'Administrador')
  getDepartments() {
    return this.reportsService.getUniqueDepartments();
  }
}
