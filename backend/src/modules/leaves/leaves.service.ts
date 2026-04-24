import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudPermiso } from '../../entities/solicitud-permiso.entity';
import { TipoPermiso } from '../../entities/tipo-permiso.entity';
import { DecisionPermiso } from '../../entities/decision-permiso.entity';
import { VacacionSaldo } from '../../entities/vacacion-saldo.entity';
import { VacacionMovimiento } from '../../entities/vacacion-movimiento.entity';
import { Empleado } from '../../entities/empleado.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { AdjuntoSolicitud } from '../../entities/adjunto-solicitud.entity';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LeavesService {
  constructor(
    @InjectRepository(SolicitudPermiso)
    private solicitudRepository: Repository<SolicitudPermiso>,
    @InjectRepository(TipoPermiso)
    private tipoPermisoRepository: Repository<TipoPermiso>,
    @InjectRepository(DecisionPermiso)
    private decisionRepository: Repository<DecisionPermiso>,
    @InjectRepository(VacacionSaldo)
    private vacacionSaldoRepository: Repository<VacacionSaldo>,
    @InjectRepository(VacacionMovimiento)
    private vacacionMovimientoRepository: Repository<VacacionMovimiento>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
    @InjectRepository(AdjuntoSolicitud)
    private adjuntoRepository: Repository<AdjuntoSolicitud>,
    private dataSource: DataSource,
  ) {}

  async getTiposPermiso() {
    const tipos = await this.tipoPermisoRepository.find({
      where: { activo: true },
    });
    return tipos.map((t) => ({
      tipoPermisoId: t.tipoPermisoId,
      nombre: t.nombre,
      requiereDocumento: t.requiereDocumento,
      descuentaVacaciones: t.descuentaVacaciones,
    }));
  }

  private calculateDays(start: Date, end: Date): number {
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  async createRequest(createDto: any, empleadoId: number) {
    const tipoPermiso = await this.tipoPermisoRepository.findOne({
      where: { tipoPermisoId: createDto.tipoPermisoId },
    });

    if (!tipoPermiso) {
      throw new NotFoundException('Tipo de permiso no encontrado');
    }

    const fecha_inicio = new Date(createDto.fecha_inicio);
    const fecha_fin = new Date(createDto.fecha_fin);

    if (isNaN(fecha_inicio.getTime()) || isNaN(fecha_fin.getTime())) {
      throw new BadRequestException('Las fechas proporcionadas no son válidas');
    }

    if (fecha_fin < fecha_inicio) {
      throw new BadRequestException('La fecha fin no puede ser anterior a la fecha de inicio');
    }

    const diasSolicitados = this.calculateDays(fecha_inicio, fecha_fin);

    if (diasSolicitados <= 0) {
      throw new BadRequestException('El rango de fechas no es válido');
    }

    if (tipoPermiso.descuentaVacaciones) {
      const saldo = await this.vacacionSaldoRepository.findOne({
        where: { empleadoId },
      });

      if (!saldo) {
        throw new BadRequestException('No tiene saldo de vacaciones configurado');
      }

      if (saldo.diasDisponibles < diasSolicitados) {
        throw new BadRequestException(
          `No tiene suficientes días de vacaciones. Tiene ${saldo.diasDisponibles} días disponibles pero está solicitando ${diasSolicitados} días.`,
        );
      }
    }

    const solicitud = this.solicitudRepository.create({
      empleadoId,
      tipoPermisoId: createDto.tipoPermisoId,
      fecha_inicio,
      fecha_fin,
      horasInicio: createDto.horasInicio || null,
      horasFin: createDto.horasFin || null,
      motivo: createDto.motivo,
      estado: SolicitudPermiso.ESTADO_PENDIENTE,
    });

    const saved = await this.solicitudRepository.save(solicitud);

    if (createDto.archivo && createDto.nombreArchivo) {
      await this.saveAttachment(
        saved.solicitudId,
        createDto.archivo,
        createDto.nombreArchivo,
        createDto.tipoMime || 'application/octet-stream',
      );
    }

    await this.auditRepository.save({
      usuarioId: null as any,
      modulo: 'PERMISOS',
      accion: 'CREATE',
      entidad: 'SOLICITUD_PERMISO',
      entidadId: saved.solicitudId,
      detalle: `Nueva solicitud de ${tipoPermiso.nombre}`,
    });

    return {
      solicitudId: saved.solicitudId,
      estado: saved.estado,
      mensaje: 'Solicitud creada exitosamente',
    };
  }

  private async saveAttachment(
    solicitudId: number,
    base64Data: string,
    nombreArchivo: string,
    tipoMime: string,
  ): Promise<void> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'solicitudes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const safeName = nombreArchivo.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${solicitudId}_${Date.now()}_${safeName}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const adjunto = this.adjuntoRepository.create({
      solicitudId,
      nombreArchivo: nombreArchivo,
      rutaUrl: `/attachment/${fileName}`,
      tipoMime,
    });

    await this.adjuntoRepository.save(adjunto);
  }

  async getAttachment(fileName: string, res: any): Promise<void> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'solicitudes');
    const filePath = path.join(uploadsDir, fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Archivo no encontrado');
    }

    res.sendFile(filePath);
  }

  async getMyRequests(empleadoId: number) {
    const solicitudes = await this.solicitudRepository.find({
      where: { empleadoId },
      relations: ['tipoPermiso', 'decisiones', 'adjuntos'],
      order: { fechaSolicitud: 'DESC' },
    });

    return solicitudes.map((s) => ({
      solicitudId: s.solicitudId,
      tipoPermiso: s.tipoPermiso?.nombre,
      fecha_inicio: s.fecha_inicio,
      fecha_fin: s.fecha_fin,
      horasInicio: s.horasInicio,
      horasFin: s.horasFin,
      motivo: s.motivo,
      estado: s.estado,
      fechaSolicitud: s.fechaSolicitud,
      decisiones: s.decisiones?.map((d) => ({
        decision: d.decision,
        comentario: d.comentario,
        fechaHora: d.fechaHora,
      })),
      adjuntos: s.adjuntos?.map((a) => ({
        adjuntoId: a.adjuntoId,
        nombreArchivo: a.nombreArchivo,
        rutaUrl: a.rutaUrl,
      })),
    }));
  }

  async getPendingRequests(supervisorEmpleadoId: number) {
    try {
      const empleadosRaw = await this.dataSource.query(
        `SELECT empleado_id, nombres, apellidos, codigo_empleado FROM EMPLEADO WHERE supervisor_id = @0 AND activo = 1`,
        [supervisorEmpleadoId],
      );

      if (empleadosRaw.length === 0) {
        return [];
      }

      const idsStr = empleadosRaw.map((e: any) => e.empleado_id).join(',');
      const solicitudesRaw = await this.dataSource.query(
        `SELECT sp.solicitud_id, sp.empleado_id, sp.tipo_permiso_id, sp.fecha_inicio, sp.fecha_fin, sp.horas_inicio, sp.horas_fin, sp.motivo, sp.estado, sp.fecha_solicitud, e.nombres + ' ' + e.apellidos as nombre_empleado, e.codigo_empleado, tp.nombre as tipo_permiso_nombre FROM SOLICITUD_PERMISO sp INNER JOIN EMPLEADO e ON sp.empleado_id = e.empleado_id INNER JOIN TIPO_PERMISO tp ON sp.tipo_permiso_id = tp.tipo_permiso_id WHERE sp.empleado_id IN (${idsStr}) AND sp.estado = @0 ORDER BY sp.fecha_solicitud ASC`,
        [SolicitudPermiso.ESTADO_PENDIENTE],
      );

      return solicitudesRaw.map((s: any) => ({
        solicitudId: s.solicitud_id,
        empleado: {
          empleadoId: s.empleado_id,
          nombreCompleto: s.nombre_empleado,
          codigoEmpleado: s.codigo_empleado,
        },
        tipoPermiso: s.tipo_permiso_nombre,
        fecha_inicio: s.fecha_inicio,
        fecha_fin: s.fecha_fin,
        horasInicio: s.horas_inicio,
        horasFin: s.horas_fin,
        motivo: s.motivo,
        estado: s.estado,
        fechaSolicitud: s.fecha_solicitud,
      }));
    } catch (error) {
      console.error('Error in getPendingRequests:', error);
      throw error;
    }
  }

  async approveRequest(solicitudId: number, comentario: string, usuarioId: number) {
    const solicitud = await this.solicitudRepository.findOne({
      where: { solicitudId },
      relations: ['tipoPermiso'],
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (solicitud.estado !== SolicitudPermiso.ESTADO_PENDIENTE) {
      throw new BadRequestException('La solicitud ya no está pendiente');
    }

    const diasSolicitados = this.calculateDays(solicitud.fecha_inicio, solicitud.fecha_fin);

    if (solicitud.tipoPermiso?.descuentaVacaciones) {
      const saldo = await this.vacacionSaldoRepository.findOne({
        where: { empleadoId: solicitud.empleadoId },
      });

      if (saldo) {
        saldo.diasDisponibles = saldo.diasDisponibles - diasSolicitados;
        saldo.diasUsados = saldo.diasUsados + diasSolicitados;
        await this.vacacionSaldoRepository.save(saldo);

        await this.vacacionMovimientoRepository.save({
          empleadoId: solicitud.empleadoId,
          solicitudId: solicitudId,
          tipo: VacacionMovimiento.TIPO_CONSUMO,
          dias: diasSolicitados,
          fecha: new Date(),
          comentario: `Uso por solicitud #${solicitudId}`,
        });
      }
    }

    solicitud.estado = SolicitudPermiso.ESTADO_APROBADO;
    await this.solicitudRepository.save(solicitud);

    await this.decisionRepository.save({
      solicitudId,
      usuarioId,
      decision: DecisionPermiso.DECISION_APROBADO,
      comentario,
      fechaHora: new Date(),
    });

    await this.auditRepository.save({
      usuarioId,
      modulo: 'PERMISOS',
      accion: 'APPROVE',
      entidad: 'SOLICITUD_PERMISO',
      entidadId: solicitudId,
      detalle: `Solicitud aprobada: ${diasSolicitados} días`,
    });

    return { message: 'Solicitud aprobada correctamente' };
  }

  async rejectRequest(solicitudId: number, comentario: string, usuarioId: number) {
    const solicitud = await this.solicitudRepository.findOne({
      where: { solicitudId },
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (solicitud.estado !== SolicitudPermiso.ESTADO_PENDIENTE) {
      throw new BadRequestException('La solicitud ya no está pendiente');
    }

    solicitud.estado = SolicitudPermiso.ESTADO_RECHAZADO;
    await this.solicitudRepository.save(solicitud);

    await this.decisionRepository.save({
      solicitudId,
      usuarioId,
      decision: DecisionPermiso.DECISION_RECHAZADO,
      comentario,
      fechaHora: new Date(),
    });

    await this.auditRepository.save({
      usuarioId,
      modulo: 'PERMISOS',
      accion: 'REJECT',
      entidad: 'SOLICITUD_PERMISO',
      entidadId: solicitudId,
      detalle: `Solicitud rechazada: ${comentario}`,
    });

    return { message: 'Solicitud rechazada correctamente' };
  }

  async getVacationBalance(empleadoId: number) {
    let saldo = await this.vacacionSaldoRepository.findOne({
      where: { empleadoId },
    });

    if (!saldo) {
      const empleadoResult = await this.dataSource.query(
        'SELECT fecha_ingreso FROM EMPLEADO WHERE empleado_id = @0',
        [empleadoId],
      );

      if (!empleadoResult || empleadoResult.length === 0) {
        throw new NotFoundException('Empleado no encontrado');
      }

      const fechaIngreso = new Date(empleadoResult[0].fecha_ingreso);
      const hoy = new Date();
      const aniosTrabajados = Math.floor(
        (hoy.getTime() - fechaIngreso.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      );

      const diasVacaciones = 15 + Math.min(aniosTrabajados, 5);

      saldo = this.vacacionSaldoRepository.create({
        empleadoId,
        diasDisponibles: diasVacaciones,
        diasUsados: 0,
        fechaCorte: new Date(hoy.getFullYear(), 11, 31),
      });

      await this.vacacionSaldoRepository.save(saldo);

      await this.vacacionMovimientoRepository.save({
        empleadoId,
        tipo: VacacionMovimiento.TIPO_ACUMULACION,
        dias: diasVacaciones,
        fecha: new Date(),
        comentario: `Acumulación inicial por ${aniosTrabajados} años de servicio`,
      });
    }

    return {
      empleadoId: saldo.empleadoId,
      diasDisponibles: saldo.diasDisponibles,
      diasUsados: saldo.diasUsados,
      diasLibres: saldo.diasDisponibles,
      diasTotales: saldo.diasDisponibles + saldo.diasUsados,
      fechaCorte: saldo.fechaCorte,
    };
  }
}
