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
import { TimesheetsService } from './timesheets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('timesheets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimesheetsController {
  constructor(private readonly timesheetsService: TimesheetsService) {}

  @Get()
  getMyTimesheets(
    @Req() req: any,
    @Query('fecha_inicio') fecha_inicio?: string,
    @Query('fecha_fin') fecha_fin?: string,
    @Query('proyectoId') proyectoId?: number,
  ) {
    return this.timesheetsService.getMyTimesheets(
      req.user.empleadoId,
      fecha_inicio,
      fecha_fin,
      proyectoId,
    );
  }

  @Post('entry')
  createEntry(@Body() createDto: any, @Req() req: any) {
    return this.timesheetsService.createEntry(createDto, req.user.empleadoId);
  }

  @Get('team')
  @Roles('Supervisor', 'RRHH', 'Administrador')
  getTeamTimesheets(
    @Req() req: any,
    @Query('fecha_inicio') fecha_inicio?: string,
    @Query('fecha_fin') fecha_fin?: string,
  ) {
    return this.timesheetsService.getTeamTimesheets(req.user.empleadoId, fecha_inicio, fecha_fin);
  }

  @Put(':id/approve')
  @Roles('Supervisor', 'RRHH', 'Administrador')
  approve(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Req() req: any) {
    return this.timesheetsService.approve(
      id,
      body.comentario || body.comentarios,
      req.user.usuarioId,
    );
  }

  @Put(':id/reject')
  @Roles('Supervisor', 'RRHH', 'Administrador')
  reject(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Req() req: any) {
    return this.timesheetsService.reject(
      id,
      body.comentario || body.comentarios,
      req.user.usuarioId,
    );
  }

  @Get('report/project-summary')
  @Roles('Supervisor', 'RRHH', 'Administrador')
  getProjectSummary(
    @Query('fecha_inicio') fecha_inicio: string,
    @Query('fecha_fin') fecha_fin: string,
  ) {
    return this.timesheetsService.getProjectSummary(fecha_inicio, fecha_fin);
  }
}
