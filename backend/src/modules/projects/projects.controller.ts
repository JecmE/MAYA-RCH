import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findOne(id);
  }

  @Post()
  @Roles('RRHH', 'Administrador')
  create(@Body() createDto: any, @Req() req: any) {
    return this.projectsService.create(createDto, req.user.usuarioId);
  }

  @Put(':id')
  @Roles('RRHH', 'Administrador')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any, @Req() req: any) {
    return this.projectsService.update(id, updateDto, req.user.usuarioId);
  }

  @Delete(':id')
  @Roles('RRHH', 'Administrador')
  deactivate(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.projectsService.deactivate(id, req.user.usuarioId);
  }
}
