import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { Empleado } from '../../entities/empleado.entity';
import { AprobacionTiempo } from '../../entities/aprobacion-tiempo.entity';
import { AuditLog } from '../../entities/audit-log.entity';

@Injectable()
export class TimesheetsService {
  constructor(
    @InjectRepository(RegistroTiempo)
    private tiempoRepository: Repository<RegistroTiempo>,
    @InjectRepository(Proyecto)
    private proyectoRepository: Repository<Proyecto>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
    @InjectRepository(AprobacionTiempo)
    private aprobacionRepository: Repository<AprobacionTiempo>,
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async getMyTimesheets(
    empleadoId: number,
    fechaInicio?: string,
    fechaFin?: string,
    proyectoId?: number,
  ) {
    const where: any = { empleadoId };

    if (fechaInicio && fechaFin) {
      where.fecha = Between(new Date(fechaInicio), new Date(fechaFin));
    } else if (fechaInicio) {
      where.fecha = MoreThanOrEqual(new Date(fechaInicio));
    } else if (fechaFin) {
      where.fecha = LessThanOrEqual(new Date(fechaFin));
    }

    if (proyectoId) {
      where.proyectoId = proyectoId;
    }

    const registros = await this.tiempoRepository.find({
      where,
      relations: ['proyecto'],
      order: { fecha: 'DESC', fechaRegistro: 'DESC' },
    });

    return registros.map((r) => ({
      tiempoId: r.tiempoId,
      fecha: r.fecha,
      proyecto: {
        proyectoId: r.proyecto?.proyectoId,
        nombre: r.proyecto?.nombre,
        codigo: r.proyecto?.codigo,
      },
      horas: r.horas,
      horasValidadas: r.horasValidadas,
      actividadDescripcion: r.actividadDescripcion,
      estado: r.estado,
      fechaRegistro: r.fechaRegistro,
    }));
  }

  async createEntry(createDto: any, empleadoId: number) {
    const proyecto = await this.proyectoRepository.findOne({
      where: { proyectoId: createDto.proyectoId, activo: true },
    });

    if (!proyecto) {
      throw new NotFoundException('Proyecto no encontrado o inactivo');
    }

    if (createDto.horas > 12) {
      throw new BadRequestException('No puede registrar más de 12 horas en un día');
    }

    const registro = this.tiempoRepository.create({
      empleadoId,
      proyectoId: createDto.proyectoId,
      fecha: new Date(createDto.fecha),
      horas: createDto.horas,
      actividadDescripcion: createDto.actividadDescripcion || '',
      estado: RegistroTiempo.ESTADO_PENDIENTE,
    });

    const saved = await this.tiempoRepository.save(registro);

    await this.auditRepository.save({
      usuarioId: null as any,
      modulo: 'TIMESHEET',
      accion: 'CREATE',
      entidad: 'REGISTRO_TIEMPO',
      entidadId: saved.tiempoId,
      detalle: `Registro de ${saved.horas}h en proyecto ${proyecto.nombre}`,
    });

    return {
      tiempoId: saved.tiempoId,
      estado: saved.estado,
      mensaje: 'Registro creado exitosamente',
    };
  }

  async getTeamTimesheets(supervisorEmpleadoId: number, fechaInicio?: string, fechaFin?: string) {
    const equipo = await this.empleadoRepository.find({
      where: { supervisorId: supervisorEmpleadoId, activo: true },
    });

    const empleadoIds = equipo.map((e) => e.empleadoId);

    if (empleadoIds.length === 0) {
      return [];
    }

    const where: any = { empleadoId: empleadoIds as any };

    if (fechaInicio && fechaFin) {
      where.fecha = Between(new Date(fechaInicio), new Date(fechaFin));
    }

    const registros = await this.tiempoRepository.find({
      where,
      relations: ['empleado', 'proyecto'],
      order: { fecha: 'DESC' },
    });

    return registros.map((r) => ({
      tiempoId: r.tiempoId,
      empleado: {
        empleadoId: r.empleado?.empleadoId,
        nombreCompleto: r.empleado?.nombreCompleto,
        codigoEmpleado: r.empleado?.codigoEmpleado,
      },
      proyecto: {
        proyectoId: r.proyecto?.proyectoId,
        nombre: r.proyecto?.nombre,
      },
      fecha: r.fecha,
      horas: r.horas,
      horasValidadas: r.horasValidadas,
      actividadDescripcion: r.actividadDescripcion,
      estado: r.estado,
    }));
  }

  async approve(id: number, comentario: string, usuarioId: number) {
    const registro = await this.tiempoRepository.findOne({
      where: { tiempoId: id },
    });

    if (!registro) {
      throw new NotFoundException('Registro no encontrado');
    }

    if (registro.estado !== RegistroTiempo.ESTADO_PENDIENTE) {
      throw new BadRequestException('El registro ya no está pendiente');
    }

    registro.estado = RegistroTiempo.ESTADO_APROBADO;
    registro.horasValidadas = registro.horas;
    await this.tiempoRepository.save(registro);

    await this.aprobacionRepository.save({
      tiempoId: id,
      usuarioId,
      decision: AprobacionTiempo.DECISION_APROBADO,
      comentario,
      fechaHora: new Date(),
    });

    await this.auditRepository.save({
      usuarioId,
      modulo: 'TIMESHEET',
      accion: 'APPROVE',
      entidad: 'REGISTRO_TIEMPO',
      entidadId: id,
      detalle: `Registro aprobado: ${comentario}`,
    });

    return { message: 'Registro aprobado' };
  }

  async reject(id: number, comentario: string, usuarioId: number) {
    const registro = await this.tiempoRepository.findOne({
      where: { tiempoId: id },
    });

    if (!registro) {
      throw new NotFoundException('Registro no encontrado');
    }

    if (registro.estado !== RegistroTiempo.ESTADO_PENDIENTE) {
      throw new BadRequestException('El registro ya no está pendiente');
    }

    registro.estado = RegistroTiempo.ESTADO_RECHAZADO;
    await this.tiempoRepository.save(registro);

    await this.aprobacionRepository.save({
      tiempoId: id,
      usuarioId,
      decision: AprobacionTiempo.DECISION_RECHAZADO,
      comentario,
      fechaHora: new Date(),
    });

    await this.auditRepository.save({
      usuarioId,
      modulo: 'TIMESHEET',
      accion: 'REJECT',
      entidad: 'REGISTRO_TIEMPO',
      entidadId: id,
      detalle: `Registro rechazado: ${comentario}`,
    });

    return { message: 'Registro rechazado' };
  }

  async getProjectSummary(fechaInicio: string, fechaFin: string) {
    const registros = await this.tiempoRepository
      .createQueryBuilder('rt')
      .leftJoinAndSelect('rt.proyecto', 'proyecto')
      .leftJoinAndSelect('rt.empleado', 'empleado')
      .where('rt.fecha BETWEEN :fechaInicio AND :fechaFin', {
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
      })
      .andWhere('rt.estado = :estado', { estado: RegistroTiempo.ESTADO_APROBADO })
      .getMany();

    const summary: any = {};

    for (const r of registros) {
      const proyectoNombre = r.proyecto?.nombre || 'Sin proyecto';
      if (!summary[proyectoNombre]) {
        summary[proyectoNombre] = {
          proyecto: {
            proyectoId: r.proyecto?.proyectoId,
            nombre: proyectoNombre,
          },
          totalHoras: 0,
          empleados: {},
        };
      }

      summary[proyectoNombre].totalHoras += Number(r.horasValidadas || r.horas);

      const empNombre = r.empleado?.nombreCompleto || 'Desconocido';
      if (!summary[proyectoNombre].empleados[empNombre]) {
        summary[proyectoNombre].empleados[empNombre] = {
          nombre: empNombre,
          horas: 0,
        };
      }
      summary[proyectoNombre].empleados[empNombre].horas += Number(r.horasValidadas || r.horas);
    }

    return Object.values(summary).map((s: any) => ({
      proyecto: s.proyecto,
      totalHoras: s.totalHoras,
      empleados: Object.values(s.empleados),
    }));
  }
}
