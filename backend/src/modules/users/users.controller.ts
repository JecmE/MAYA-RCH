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
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('RRHH', 'Administrador')
  findAll(@Query('activo') activo?: string) {
    return this.usersService.findAllEmpleados(activo);
  }

  @Get('me')
  async getMyProfile(@Req() req: any) {
    return this.usersService.getMyProfile(req.user.empleadoId);
  }

  @Put('me')
  async updateMyProfile(@Req() req: any, @Body() updateDto: UpdateEmpleadoDto) {
    return this.usersService.updateEmpleado(req.user.empleadoId, updateDto, req.user.usuarioId);
  }

  @Put('me/password')
  async changePassword(@Req() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.usuarioId, changePasswordDto);
  }

  @Get(':id')
  @Roles('RRHH', 'Administrador')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findEmpleadoById(id);
  }

  @Post()
  @Roles('RRHH', 'Administrador')
  create(@Body() createEmpleadoDto: CreateEmpleadoDto, @Req() req: any) {
    return this.usersService.createEmpleado(createEmpleadoDto, req.user.usuarioId);
  }

  @Put(':id')
  @Roles('RRHH', 'Administrador')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmpleadoDto: UpdateEmpleadoDto,
    @Req() req: any,
  ) {
    return this.usersService.updateEmpleado(id, updateEmpleadoDto, req.user.usuarioId);
  }

  @Delete(':id')
  @Roles('RRHH', 'Administrador')
  deactivate(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.usersService.deactivateEmpleado(id, req.user.usuarioId);
  }

  @Delete(':id/permanent')
  @Roles('Administrador')
  deletePermanent(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.usersService.deleteEmpleadoPermanent(id, req.user.usuarioId);
  }

  @Post(':id/usuario')
  @Roles('RRHH', 'Administrador')
  createUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() createUsuarioDto: CreateUsuarioDto,
    @Req() req: any,
  ) {
    return this.usersService.createUsuario(id, createUsuarioDto, req.user.usuarioId);
  }

  @Put(':id/usuario')
  @Roles('RRHH', 'Administrador')
  updateUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @Req() req: any,
  ) {
    return this.usersService.updateUsuario(id, updateUsuarioDto, req.user.usuarioId);
  }

  @Get(':id/equipo')
  @Roles('Supervisor', 'RRHH', 'Administrador')
  getEquipo(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getEquipoBySupervisor(id);
  }
}
