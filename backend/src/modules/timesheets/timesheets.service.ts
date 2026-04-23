import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
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
      where.fecha = Between(fechaInicio, fechaFin);
    } else if (fechaInicio) {
      where.fecha = MoreThanOrEqual(fechaInicio);
    } else if (fechaFin) {
      where.fecha = LessThanOrEqual(fechaFin);
    }

    if (proyectoId) {
      where.proyectoId = proyectoId;
    }

    const registros = await this.tiempoRepository.find({
      where,
      relations: ['proyecto', 'aprobaciones'],
      order: { fecha: 'DESC', fechaRegistro: 'DESC' },
    });

    return registros.map((r) => {
      const aprobacion = r.aprobaciones && r.aprobaciones.length > 0 ? r.aprobaciones[0] : null;
      return {
        tiempoId: r.tiempoId,
        empleadoId: r.empleadoId,
        fecha: r.fecha,
        proyectoId: r.proyectoId,
        proyectoNombre: r.proyecto?.nombre || '',
        proyectoCodigo: r.proyecto?.codigo || '',
        horas: r.horas,
        horasValidadas: r.horasValidadas,
        actividadDescripcion: r.actividadDescripcion,
        estado: r.estado,
        fechaRegistro: r.fechaRegistro,
        comentario: aprobacion?.comentario || null,
        decision: aprobacion?.decision || null,
      };
    });
  }

  async createEntry(createDto: any, empleadoId: number) {
    if (!createDto.proyectoId) {
      throw new BadRequestException('Debe seleccionar un proyecto');
    }

    if (!createDto.fecha) {
      throw new BadRequestException('Debe ingresar una fecha');
    }

    if (!createDto.horas || createDto.horas <= 0) {
      throw new BadRequestException('Debe ingresar horas válidas (mayor a 0)');
    }

    if (createDto.horas > 8) {
      throw new BadRequestException('No puede registrar más de 8 horas en un día');
    }

    if (!createDto.actividadDescripcion && !createDto.actividad) {
      throw new BadRequestException('Debe describir la actividad realizada');
    }

    if ((createDto.actividadDescripcion || createDto.actividad).length < 10) {
      throw new BadRequestException(
        'La descripción de la actividad debe tener al menos 10 caracteres',
      );
    }

    const fechaStr = createDto.fecha;

    const [y, m, d] = fechaStr.split('-').map(Number);
    const fechaCheck = new Date(y, m - 1, d, 0, 0, 0, 0);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaCheck > hoy) {
      throw new BadRequestException('No puede registrar tiempos para fechas futuras');
    }

    const proyecto = await this.proyectoRepository.findOne({
      where: { proyectoId: createDto.proyectoId, activo: true },
    });

    if (!proyecto) {
      throw new NotFoundException('Proyecto no encontrado o inactivo');
    }

    const existsQuery = await this.tiempoRepository
      .createQueryBuilder('rt')
      .where('rt.empleado_id = :empleadoId', { empleadoId })
      .andWhere('rt.proyecto_id = :proyectoId', { proyectoId: createDto.proyectoId })
      .andWhere('CAST(rt.fecha AS DATE) = :fecha', { fecha: fechaStr })
      .getOne();

    if (existsQuery) {
      throw new BadRequestException(
        `Ya existe un registro para este proyecto en la fecha ${fechaStr}. No puede duplicar registros.`,
      );
    }

    const registro = this.tiempoRepository.create({
      empleadoId,
      proyectoId: createDto.proyectoId,
      fecha: fechaStr,
      horas: createDto.horas,
      actividadDescripcion: createDto.actividadDescripcion || createDto.actividad || '',
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

    const where: any = { empleadoId: In(empleadoIds) };

    if (fechaInicio && fechaFin) {
      where.fecha = Between(fechaInicio, fechaFin);
    }

    const registros = await this.tiempoRepository.find({
      where,
      relations: ['empleado', 'proyecto'],
      order: { fecha: 'DESC' },
    });

    return registros.map((r) => ({
      tiempoId: r.tiempoId,
      empleadoId: r.empleadoId,
      nombreCompleto: r.empleado ? `${r.empleado.nombres} ${r.empleado.apellidos}` : 'Empleado',
      codigoEmpleado: r.empleado?.codigoEmpleado || 'N/A',
      proyectoId: r.proyectoId,
      nombreProyecto: r.proyecto?.nombre || 'Proyecto Sin Nombre',
      fecha: r.fecha,
      horas: r.horas,
      horasValidadas: r.horasValidadas,
      actividadDescripcion: r.actividadDescripcion,
      estado: r.estado,
    }));
  }

  async approve(id: number, comentario: string, usuarioId: number) {
    try {
      const registro = await this.tiempoRepository.findOne({
        where: { tiempoId: id },
      });

      if (!registro) {
        throw new NotFoundException('Registro no encontrado');
      }

      // Usar .update para evitar conflictos con columnas varchar(10) como 'fecha'
      await this.tiempoRepository.update(id, {
        estado: 'aprobado',
        horasValidadas: registro.horas
      });

      const aprobacion = this.aprobacionRepository.create({
        tiempoId: id,
        usuarioId: usuarioId,
        decision: 'aprobado',
        comentario: comentario || 'Aprobado por supervisor',
        fechaHora: new Date(),
      });
      await this.aprobacionRepository.save(aprobacion);

      await this.auditRepository.save({
        usuarioId,
        modulo: 'TIMESHEET',
        accion: 'APPROVE',
        entidad: 'REGISTRO_TIEMPO',
        entidadId: id,
        detalle: `Registro aprobado: ${comentario}`,
      });

      return { message: 'Registro aprobado' };
    } catch (error) {
      console.error('ERROR IN TIMESHEET APPROVE:', error);
      throw error;
    }
  }

  async reject(id: number, comentario: string, usuarioId: number) {
    try {
      const registro = await this.tiempoRepository.findOne({
        where: { tiempoId: id },
      });

      if (!registro) {
        throw new NotFoundException('Registro no encontrado');
      }

      await this.tiempoRepository.update(id, {
        estado: 'rechazado'
      });

      const aprobacion = this.aprobacionRepository.create({
        tiempoId: id,
        usuarioId: usuarioId,
        decision: 'rechazado',
        comentario: comentario || 'Rechazado por supervisor',
        fechaHora: new Date(),
      });
      await this.aprobacionRepository.save(aprobacion);

      await this.auditRepository.save({
        usuarioId,
        modulo: 'TIMESHEET',
        accion: 'REJECT',
        entidad: 'REGISTRO_TIEMPO',
        entidadId: id,
        detalle: `Registro rechazado: ${comentario}`,
      });

      return { message: 'Registro rechazado' };
    } catch (error) {
      console.error('ERROR IN TIMESHEET REJECT:', error);
      throw error;
    }
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
