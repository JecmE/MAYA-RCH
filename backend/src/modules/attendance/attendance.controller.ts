import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  async checkIn(@Req() req: any) {
    return this.attendanceService.registerEntry(req.user.empleadoId, req.user.usuarioId);
  }

  @Post('check-out')
  async checkOut(@Req() req: any) {
    return this.attendanceService.registerExit(req.user.empleadoId, req.user.usuarioId);
  }

  @Get('today')
  async getTodayStatus(@Req() req: any) {
    return this.attendanceService.getTodayStatus(req.user.empleadoId);
  }

  @Get('history')
  async getHistory(
    @Req() req: any,
    @Query('fecha_inicio') fecha_inicio?: string,
    @Query('fecha_fin') fecha_fin?: string,
  ) {
    return this.attendanceService.getHistory(req.user.empleadoId, fecha_inicio, fecha_fin);
  }

  @Get('employee/:id')
  @Roles('Supervisor', 'RRHH', 'Administrador')
  async getEmployeeHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('fecha_inicio') fecha_inicio?: string,
    @Query('fecha_fin') fecha_fin?: string,
  ) {
    return this.attendanceService.getHistory(id, fecha_inicio, fecha_fin);
  }

  @Put('adjust/:id')
  @Roles('RRHH', 'Administrador')
  async adjustAttendance(
    @Param('id', ParseIntPipe) id: number,
    @Body() adjustDto: any,
    @Req() req: any,
  ) {
    return this.attendanceService.adjustAttendance(id, adjustDto, req.user.usuarioId);
  }

  @Get('team')
  @Roles('Supervisor', 'RRHH', 'Administrador')
  async getTeamAttendance(@Req() req: any, @Query('fecha') fecha?: string) {
    return this.attendanceService.getTeamAttendance(req.user.empleadoId, fecha);
  }
}
