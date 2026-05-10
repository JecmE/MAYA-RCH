import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { Empleado } from '../../entities/empleado.entity';
import { AprobacionTiempo } from '../../entities/aprobacion-tiempo.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { MailService } from '../mail/mail.service';

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
    private mailService: MailService,
  ) {}

  async getMyTimesheets(empId: number, start?: string, end?: string, proyId?: number) {
    const where: any = { empleadoId: empId };
    if (start && end) where.fecha = Between(start, end);
    if (proyId) where.proyectoId = proyId;
    const regs = await this.tiempoRepository.find({
      where, relations: ['proyecto', 'aprobaciones'], order: { fecha: 'DESC' }
    });
    return regs.map(r => ({
      ...r,
      proyectoNombre: r.proyecto?.nombre,
      proyectoCodigo: r.proyecto?.codigo,
      comentario: r.aprobaciones?.[0]?.comentario,
      decision: r.aprobaciones?.[0]?.decision
    }));
  }

  async createEntry(dto: any, empleadoId: number) {
    const proyecto = await this.proyectoRepository.findOne({ where: { proyectoId: dto.proyectoId } });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
    const registro = this.tiempoRepository.create({ ...dto, empleadoId, estado: 'pendiente' });
    const saved: any = await this.tiempoRepository.save(registro);
    const savedSingle = Array.isArray(saved) ? saved[0] : saved;

    // NOTIFICACIÓN AL SUPERVISOR
    try {
      const emp = await this.empleadoRepository.findOne({
        where: { empleadoId },
        relations: ['supervisor']
      });
      if (emp?.supervisor?.email) {
        await this.mailService.sendTimesheetRequestNotification(
          emp.supervisor.email,
          `${emp.supervisor.nombres} ${emp.supervisor.apellidos}`,
          `${emp.nombres} ${emp.apellidos}`,
          proyecto.nombre,
          dto.fecha,
          dto.horas
        );
      }
    } catch (e) {
      console.error('[MAIL] Error aviso registro tiempo:', e);
    }

    return { tiempoId: savedSingle.tiempoId, mensaje: 'Creado' };
  }

  async getTeamTimesheets(supId: number, start?: string, end?: string) {
    const equipo = await this.empleadoRepository.find({ where: { supervisorId: supId } });
    const ids = equipo.map(e => e.empleadoId);
    if (ids.length === 0) return [];
    const where: any = { empleadoId: In(ids) };
    if (start && end) where.fecha = Between(start, end);

    const regs = await this.tiempoRepository.find({
      where,
      relations: ['empleado', 'proyecto'],
      order: { fecha: 'DESC', tiempoId: 'DESC' }
    });

    return regs.map(r => ({
      tiempoId: r.tiempoId,
      empleadoId: r.empleadoId,
      nombreCompleto: r.empleado ? `${r.empleado.nombres} ${r.empleado.apellidos}` : 'N/A',
      proyectoId: r.proyectoId,
      nombreProyecto: r.proyecto?.nombre || 'N/A',
      fecha: r.fecha,
      horas: Number(r.horas),
      actividadDescripcion: r.actividadDescripcion,
      estado: r.estado
    }));
  }

  async approve(id: number, comentario: string, usuarioId: number) {
    const registro = await this.tiempoRepository.findOne({
      where: { tiempoId: id },
      relations: ['empleado', 'proyecto']
    });
    if (!registro) throw new NotFoundException('Registro no encontrado');

    await this.tiempoRepository.update(id, { estado: 'aprobado' });
    await this.aprobacionRepository.save({ tiempoId: id, usuarioId, decision: 'aprobado', comentario, fechaHora: new Date() });

    // NOTIFICACIÓN AL EMPLEADO
    if (registro.empleado?.email) {
      await this.mailService.sendTimesheetStatusNotification(
        registro.empleado.email,
        `${registro.empleado.nombres} ${registro.empleado.apellidos}`,
        'aprobado',
        registro.proyecto?.nombre || 'Proyecto',
        registro.fecha,
        comentario
      );
    }

    return { message: 'Aprobado' };
  }

  async reject(id: number, comentario: string, usuarioId: number) {
    const registro = await this.tiempoRepository.findOne({
      where: { tiempoId: id },
      relations: ['empleado', 'proyecto']
    });
    if (!registro) throw new NotFoundException('Registro no encontrado');

    await this.tiempoRepository.update(id, { estado: 'rechazado' });
    await this.aprobacionRepository.save({ tiempoId: id, usuarioId, decision: 'rechazado', comentario, fechaHora: new Date() });

    // NOTIFICACIÓN AL EMPLEADO
    if (registro.empleado?.email) {
      await this.mailService.sendTimesheetStatusNotification(
        registro.empleado.email,
        `${registro.empleado.nombres} ${registro.empleado.apellidos}`,
        'rechazado',
        registro.proyecto?.nombre || 'Proyecto',
        registro.fecha,
        comentario
      );
    }

    return { message: 'Rechazado' };
  }

  async getProjectSummary(proyectoId: number, fechaInicio: string, fechaFin: string) {
    return await this.tiempoRepository.find({
        where: { proyectoId, fecha: Between(fechaInicio, fechaFin), estado: 'aprobado' },
        relations: ['empleado']
    });
  }
}
