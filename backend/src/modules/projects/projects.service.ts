import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../../entities/proyecto.entity';
import { AuditLog } from '../../entities/audit-log.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Proyecto)
    private proyectoRepository: Repository<Proyecto>,
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async findAll() {
    const proyectos = await this.proyectoRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });

    return proyectos.map((p) => ({
      proyectoId: p.proyectoId,
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion,
      departamentoId: p.departamentoId,
      activo: p.activo,
    }));
  }

  async findOne(id: number) {
    const proyecto = await this.proyectoRepository.findOne({
      where: { proyectoId: id },
    });

    if (!proyecto) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    return {
      proyectoId: proyecto.proyectoId,
      codigo: proyecto.codigo,
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion,
      departamentoId: proyecto.departamentoId,
      activo: proyecto.activo,
    };
  }

  async create(createDto: any, usuarioId: number) {
    const proyecto = this.proyectoRepository.create(createDto);
    const saved = (await this.proyectoRepository.save(proyecto)) as unknown as Proyecto;

    await this.auditRepository.save({
      usuarioId,
      modulo: 'PROYECTOS',
      accion: 'CREATE',
      entidad: 'PROYECTO',
      entidadId: saved.proyectoId,
      detalle: `Proyecto creado: ${saved.nombre}`,
    });

    return this.findOne(saved.proyectoId);
  }

  async update(id: number, updateDto: any, usuarioId: number) {
    const proyecto = await this.proyectoRepository.findOne({
      where: { proyectoId: id },
    });

    if (!proyecto) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    Object.assign(proyecto, updateDto);
    await this.proyectoRepository.save(proyecto);

    await this.auditRepository.save({
      usuarioId,
      modulo: 'PROYECTOS',
      accion: 'UPDATE',
      entidad: 'PROYECTO',
      entidadId: id,
      detalle: `Proyecto actualizado: ${proyecto.nombre}`,
    });

    return this.findOne(id);
  }

  async deactivate(id: number, usuarioId: number) {
    const proyecto = await this.proyectoRepository.findOne({
      where: { proyectoId: id },
    });

    if (!proyecto) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    proyecto.activo = false;
    await this.proyectoRepository.save(proyecto);

    await this.auditRepository.save({
      usuarioId,
      modulo: 'PROYECTOS',
      accion: 'DEACTIVATE',
      entidad: 'PROYECTO',
      entidadId: id,
      detalle: `Proyecto desactivado: ${proyecto.nombre}`,
    });

    return { message: 'Proyecto desactivado correctamente' };
  }
}
