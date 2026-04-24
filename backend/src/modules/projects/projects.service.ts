import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Proyecto } from '../../entities/proyecto.entity';
import { EmpleadoProyecto } from '../../entities/empleado-proyecto.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { Empleado } from '../../entities/empleado.entity';

@Injectable()
export class ProjectsService implements OnModuleInit {
  constructor(
    @InjectRepository(Proyecto)
    private proyectoRepository: Repository<Proyecto>,
    @InjectRepository(EmpleadoProyecto)
    private empProyRepository: Repository<EmpleadoProyecto>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.ensureResponsableColumnExists();
  }

  private async ensureResponsableColumnExists() {
    try {
      await this.dataSource.query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PROYECTO]') AND name = 'responsable')
        BEGIN
            ALTER TABLE [dbo].[PROYECTO] ADD [responsable] NVARCHAR(100) NULL;
        END
      `);
    } catch (e) {}
  }

  // Listado para RRHH (Todos los proyectos)
  async findAll() {
    const proyectos = await this.proyectoRepository.find({
      relations: ['empleadoProyectos', 'registrosTiempo'],
      order: { nombre: 'ASC' },
    });

    return proyectos.map((p) => {
      const horasAcumuladas = p.registrosTiempo?.reduce((sum, r) => sum + Number(r.horas), 0) || 0;
      return {
        proyectoId: p.proyectoId,
        codigo: p.codigo,
        nombre: p.nombre,
        descripcion: p.descripcion,
        responsable: p.responsable || 'Sin asignar',
        activo: p.activo,
        totalEmpleados: p.empleadoProyectos?.filter(ep => ep.activo).length || 0,
        horasAcumuladas: Math.round(horasAcumuladas * 100) / 100
      };
    });
  }

  // Listado filtrado para Empleados (Solo sus asignaciones activas)
  async findMyProjects(empleadoId: number) {
    const asignaciones = await this.empProyRepository.find({
      where: { empleadoId, activo: true },
      relations: ['proyecto']
    });

    return asignaciones
      .filter(a => a.proyecto && a.proyecto.activo)
      .map(a => ({
        proyectoId: a.proyecto.proyectoId,
        codigo: a.proyecto.codigo,
        nombre: a.proyecto.nombre,
        activo: a.proyecto.activo
      }));
  }

  async findOne(id: number) {
    const proyecto = await this.proyectoRepository.findOne({
      where: { proyectoId: id },
      relations: ['empleadoProyectos', 'empleadoProyectos.empleado', 'registrosTiempo'],
    });

    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

    const horasAcumuladas = proyecto.registrosTiempo?.reduce((sum, r) => sum + Number(r.horas), 0) || 0;

    return {
      ...proyecto,
      horasAcumuladas: Math.round(horasAcumuladas * 100) / 100,
      asignaciones: proyecto.empleadoProyectos?.map(ep => ({
        empProyId: ep.empProyId,
        empleadoId: ep.empleadoId,
        nombreCompleto: `${ep.empleado?.nombres} ${ep.empleado?.apellidos}`,
        fechaInicio: ep.fechaInicio,
        fechaFin: ep.fechaFin,
        activo: ep.activo
      })) || []
    };
  }

  async create(createDto: any, usuarioId: number) {
    const proyecto = this.proyectoRepository.create(createDto);
    const saved = await this.proyectoRepository.save(proyecto);
    const savedSingle = Array.isArray(saved) ? saved[0] : saved;
    return this.findOne(savedSingle.proyectoId);
  }

  async update(id: number, updateDto: any, usuarioId: number) {
    const proyecto = await this.proyectoRepository.findOne({ where: { proyectoId: id } });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
    Object.assign(proyecto, updateDto);
    await this.proyectoRepository.save(proyecto);
    return this.findOne(id);
  }

  async assignEmployee(dto: any, usuarioId: number) {
    const { proyectoId, empleadoId, fechaInicio, fechaFin } = dto;
    let assignment = await this.empProyRepository.findOne({ where: { proyectoId, empleadoId } });

    if (assignment) {
      Object.assign(assignment, { activo: true, fechaInicio: new Date(fechaInicio), fechaFin: fechaFin ? new Date(fechaFin) : null });
    } else {
      assignment = this.empProyRepository.create({ proyectoId, empleadoId, fechaInicio: new Date(fechaInicio), fechaFin: fechaFin ? new Date(fechaFin) : null, activo: true });
    }

    await this.empProyRepository.save(assignment);

    await this.auditRepository.save({
      usuarioId,
      modulo: 'PROYECTOS',
      accion: 'ASSIGN_EMPLOYEE',
      entidad: 'EMPLEADO_PROYECTO',
      entidadId: proyectoId,
      detalle: `Empleado ID ${empleadoId} asignado al proyecto ID ${proyectoId}`,
    });

    return this.findOne(proyectoId);
  }

  async unassignEmployee(empProyId: number, usuarioId: number) {
    const assignment = await this.empProyRepository.findOne({ where: { empProyId } });
    if (!assignment) throw new NotFoundException('Asignación no encontrada');
    assignment.activo = false;
    assignment.fechaFin = new Date();
    await this.empProyRepository.save(assignment);

    await this.auditRepository.save({
      usuarioId,
      modulo: 'PROYECTOS',
      accion: 'UNASSIGN_EMPLOYEE',
      entidad: 'EMPLEADO_PROYECTO',
      entidadId: empProyId,
      detalle: `Empleado desvinculado de la asignación ID ${empProyId}`,
    });

    return { message: 'Desvinculado' };
  }

  async deactivate(id: number, usuarioId: number) {
    const proyecto = await this.proyectoRepository.findOne({ where: { proyectoId: id } });
    if (!proyecto) throw new NotFoundException('No encontrado');
    proyecto.activo = false;
    await this.proyectoRepository.save(proyecto);

    await this.auditRepository.save({
      usuarioId,
      modulo: 'PROYECTOS',
      accion: 'DEACTIVATE',
      entidad: 'PROYECTO',
      entidadId: id,
      detalle: `Proyecto ID ${id} cerrado/desactivado`,
    });

    return { message: 'Cerrado' };
  }

  async getAdminStaff() {
    // Busca empleados con roles administrativos para el selector de responsables
    const staff = await this.empleadoRepository.find({
      relations: ['usuario', 'usuario.roles'],
      where: { activo: true }
    });

    return staff.filter(e =>
      e.usuario?.roles?.some(r => ['Supervisor', 'RRHH', 'Administrador'].includes(r.nombre))
    ).map(e => ({
      empleadoId: e.empleadoId,
      nombreCompleto: this.sanitizeString(`${e.nombres} ${e.apellidos}`)
    }));
  }

  private sanitizeString(str: string | null | undefined): string {
    if (!str) return '';
    return str
      .replace(/Rodr\?guez/g, 'Rodríguez')
      .replace(/Mart\?nez/g, 'Martínez')
      .replace(/Fern\?ndez/g, 'Fernández')
      .replace(/Garc\?a/g, 'García')
      .replace(/L\?pez/g, 'López')
      .replace(/Tecnolog\?a/g, 'Tecnología')
      .replace(/Mart\?n/g, 'Martín')
      .replace(/Bust\?n/g, 'Bustón')
      .replace(/S\?nchez/g, 'Sánchez')
      .replace(/G\?mez/g, 'Gómez')
      .replace(/P\?rez/g, 'Pérez')
      .replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ');
  }
}
