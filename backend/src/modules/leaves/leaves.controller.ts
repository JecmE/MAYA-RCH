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
  Res,
} from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('leaves')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Get('types')
  getTypes() {
    return this.leavesService.getTiposPermiso();
  }

  @Post('request')
  createRequest(@Body() createDto: any, @Req() req: any) {
    return this.leavesService.createRequest(createDto, req.user.empleadoId);
  }

  @Get('my-requests')
  getMyRequests(@Req() req: any) {
    return this.leavesService.getMyRequests(req.user.empleadoId);
  }

  @Get('pending')
  @Roles('Supervisor', 'RRHH', 'Administrador')
  getPending(@Req() req: any) {
    return this.leavesService.getPendingRequests(req.user.empleadoId);
  }

  @Put(':id/approve')
  @Roles('Supervisor', 'RRHH', 'Administrador')
  approve(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Req() req: any) {
    return this.leavesService.approveRequest(
      id,
      body.comentario || body.comentarios,
      req.user.usuarioId,
    );
  }

  @Put(':id/reject')
  @Roles('Supervisor', 'RRHH', 'Administrador')
  reject(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Req() req: any) {
    return this.leavesService.rejectRequest(
      id,
      body.comentario || body.comentarios,
      req.user.usuarioId,
    );
  }

  @Get('vacation-balance')
  getVacationBalance(@Req() req: any) {
    return this.leavesService.getVacationBalance(req.user.empleadoId);
  }

  @Get('vacation-balance/:employeeId')
  @Roles('RRHH', 'Administrador')
  getEmployeeVacationBalance(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.leavesService.getVacationBalance(employeeId);
  }

  @Get('attachment/:fileName')
  getAttachment(@Param('fileName') fileName: string, @Res() res: any) {
    return this.leavesService.getAttachment(fileName, res);
  }
}
