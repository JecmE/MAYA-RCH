import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('periods')
  @Roles('RRHH', 'Administrador')
  getPeriods() {
    return this.payrollService.getPeriods();
  }

  @Post('periods')
  @Roles('RRHH', 'Administrador')
  createPeriod(@Body() createDto: any, @Req() req: any) {
    return this.payrollService.createPeriod(createDto, req.user.usuarioId);
  }

  @Post('periods/:id/calculate')
  @Roles('RRHH', 'Administrador')
  calculatePayroll(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.payrollService.calculatePayroll(id, req.user.usuarioId);
  }

  @Post('periods/:id/close')
  @Roles('RRHH', 'Administrador')
  closePeriod(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.payrollService.closePeriod(id, req.user.usuarioId);
  }

  @Get('my-paycheck')
  getMyPaycheck(@Req() req: any, @Query('periodoId') periodoId?: number) {
    return this.payrollService.getMyPaycheck(req.user.empleadoId, periodoId);
  }

  @Get('concepts')
  @Roles('RRHH', 'Administrador')
  getConcepts() {
    return this.payrollService.getConcepts();
  }
}
