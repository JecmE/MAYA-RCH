import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, DataSource } from 'typeorm';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { Empleado } from '../../entities/empleado.entity';
import { EmpleadoTurno } from '../../entities/empleado-turno.entity';
import { Turno } from '../../entities/turno.entity';
import { AjusteAsistencia } from '../../entities/ajuste-asistencia.entity';
import { AuditLog } from '../../entities/audit-log.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(RegistroAsistencia)
    private asistenciaRepository: Repository<RegistroAsistencia>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
    @InjectRepository(EmpleadoTurno)
    private empleadoTurnoRepository: Repository<EmpleadoTurno>,
    @InjectRepository(Turno)
    private turnoRepository: Repository<Turno>,
    @InjectRepository(AjusteAsistencia)
    private ajusteRepository: Repository<AjusteAsistencia>,
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
    private dataSource: DataSource,
  ) {}

  async registerEntry(empleadoId: number, usuarioId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.asistenciaRepository.findOne({
      where: { empleadoId, fecha: today },
    });

    if (existing && existing.horaEntradaReal) {
      throw new BadRequestException('Ya se registró la entrada hoy');
    }

    const empleadoTurno = await this.empleadoTurnoRepository.findOne({
      where: { empleadoId, activo: true },
      relations: ['turno'],
    });

    if (!empleadoTurno) {
      throw new BadRequestException('No tiene turno asignado');
    }

    const turno = empleadoTurno.turno;
    const now = new Date();
    const horaEntradaEsperada = this.getTimeFromString(turno.horaEntrada);

    let minutosTardia = 0;
    if (now > horaEntradaEsperada) {
      const diff = now.getTime() - horaEntradaEsperada.getTime();
      minutosTardia = Math.floor(diff / 60000) - turno.toleranciaMinutos;
      if (minutosTardia < 0) minutosTardia = 0;
    }

    if (existing) {
      existing.horaEntradaReal = now;
      existing.minutosTardia = minutosTardia;
      existing.empleadoTurnoId = empleadoTurno.empleadoTurnoId;
      if (existing.horaSalidaReal) {
        existing.estadoJornada = RegistroAsistencia.ESTADO_COMPLETADA;
        existing.horasTrabajadas = this.calculateHours(
          existing.horaEntradaReal,
          existing.horaSalidaReal,
        );
      } else {
        existing.estadoJornada = RegistroAsistencia.ESTADO_INCOMPLETA;
      }
      await this.asistenciaRepository.save(existing);

      await this.auditRepository.save({
        usuarioId,
        modulo: 'ASISTENCIA',
        accion: 'CHECK_IN',
        entidad: 'REGISTRO_ASISTENCIA',
        entidadId: existing.asistenciaId,
        detalle: `Entrada registrada${minutosTardia > 0 ? `, ${minutosTardia} min tardanza` : ''}`,
      });

      return {
        message: 'Entrada registrada',
        asistencia: existing,
        minutosTardia,
      };
    }

    const asistencia = this.asistenciaRepository.create({
      empleadoId,
      empleadoTurnoId: empleadoTurno.empleadoTurnoId,
      fecha: today,
      horaEntradaReal: now,
      minutosTardia,
      estadoJornada: RegistroAsistencia.ESTADO_PENDIENTE,
    });

    const saved = await this.asistenciaRepository.save(asistencia);

    await this.auditRepository.save({
      usuarioId,
      modulo: 'ASISTENCIA',
      accion: 'CHECK_IN',
      entidad: 'REGISTRO_ASISTENCIA',
      entidadId: saved.asistenciaId,
      detalle: `Entrada registrada${minutosTardia > 0 ? `, ${minutosTardia} min tardanza` : ''}`,
    });

    return {
      message: 'Entrada registrada',
      asistencia: saved,
      minutosTardia,
    };
  }

  async registerExit(empleadoId: number, usuarioId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const asistencia = await this.asistenciaRepository.findOne({
      where: { empleadoId, fecha: today },
    });

    if (!asistencia) {
      throw new BadRequestException('No se ha registrado entrada hoy');
    }

    if (asistencia.horaSalidaReal) {
      throw new BadRequestException('Ya se registró la salida hoy');
    }

    const now = new Date();
    asistencia.horaSalidaReal = now;
    asistencia.estadoJornada = RegistroAsistencia.ESTADO_COMPLETADA;
    asistencia.horasTrabajadas = this.calculateHours(asistencia.horaEntradaReal, now);

    await this.asistenciaRepository.save(asistencia);

    await this.auditRepository.save({
      usuarioId,
      modulo: 'ASISTENCIA',
      accion: 'CHECK_OUT',
      entidad: 'REGISTRO_ASISTENCIA',
      entidadId: asistencia.asistenciaId,
      detalle: `Salida registrada, ${asistencia.horasTrabajadas} horas trabajadas`,
    });

    return {
      message: 'Salida registrada',
      asistencia,
    };
  }

  async getTodayStatus(empleadoId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const asistencia = await this.asistenciaRepository.findOne({
      where: { empleadoId, fecha: today },
    });

    if (!asistencia) {
      return {
        estadoJornada: 'sin_registro',
        fecha: today,
        tieneEntrada: false,
        tieneSalida: false,
      };
    }

    return {
      asistenciaId: asistencia.asistenciaId,
      fecha: asistencia.fecha,
      horaEntradaReal: asistencia.horaEntradaReal,
      horaSalidaReal: asistencia.horaSalidaReal,
      minutosTardia: asistencia.minutosTardia,
      horasTrabajadas: asistencia.horasTrabajadas,
      estadoJornada: asistencia.estadoJornada,
      observacion: asistencia.observacion,
      tieneEntrada: !!asistencia.horaEntradaReal,
      tieneSalida: !!asistencia.horaSalidaReal,
    };
  }

  async getHistory(empleadoId: number, fechaInicio?: string, fechaFin?: string) {
    const where: any = { empleadoId };

    if (fechaInicio && fechaFin) {
      where.fecha = Between(new Date(fechaInicio), new Date(fechaFin));
    } else if (fechaInicio) {
      where.fecha = MoreThanOrEqual(new Date(fechaInicio));
    } else if (fechaFin) {
      where.fecha = LessThanOrEqual(new Date(fechaFin));
    }

    const registros = await this.asistenciaRepository.find({
      where,
      order: { fecha: 'DESC' },
    });

    return registros.map((r) => ({
      asistenciaId: r.asistenciaId,
      fecha: r.fecha,
      horaEntradaReal: r.horaEntradaReal,
      horaSalidaReal: r.horaSalidaReal,
      minutosTardia: r.minutosTardia,
      horasTrabajadas: r.horasTrabajadas,
      estadoJornada: r.estadoJornada,
      observacion: r.observacion,
    }));
  }

  async adjustAttendance(asistenciaId: number, adjustDto: any, usuarioId: number) {
    const asistencia = await this.asistenciaRepository.findOne({
      where: { asistenciaId },
    });

    if (!asistencia) {
      throw new NotFoundException('Registro de asistencia no encontrado');
    }

    const { campo, valorAnterior, valorNuevo, motivo } = adjustDto;

    await this.ajusteRepository.save({
      asistenciaId,
      usuarioId,
      campoModificado: campo,
      valorAnterior: valorAnterior.toString(),
      valorNuevo: valorNuevo.toString(),
      motivo,
      fechaHora: new Date(),
    });

    (asistencia as any)[campo] = valorNuevo;

    if (campo === 'hora_entrada_real' || campo === 'hora_salida_real') {
      if (asistencia.horaEntradaReal && asistencia.horaSalidaReal) {
        asistencia.horasTrabajadas = this.calculateHours(
          asistencia.horaEntradaReal,
          asistencia.horaSalidaReal,
        );
      }
    }

    await this.asistenciaRepository.save(asistencia);

    await this.auditRepository.save({
      usuarioId,
      modulo: 'ASISTENCIA',
      accion: 'ADJUST',
      entidad: 'REGISTRO_ASISTENCIA',
      entidadId: asistenciaId,
      detalle: `Ajuste: ${campo}, de ${valorAnterior} a ${valorNuevo}, motivo: ${motivo}`,
    });

    return {
      message: 'Ajuste registrado correctamente',
      asistencia,
    };
  }

  async getTeamAttendance(supervisorId: number, fecha?: string) {
    try {
      const empleadosRaw = await this.dataSource.query(
        `SELECT empleado_id, nombres, apellidos, codigo_empleado FROM EMPLEADO WHERE supervisor_id = @0 AND activo = 1`,
        [supervisorId],
      );

      if (empleadosRaw.length === 0) {
        return [];
      }

      const fechaBusqueda = fecha ? new Date(fecha) : new Date();
      fechaBusqueda.setHours(0, 0, 0, 0);

      const idsStr = empleadosRaw.map((e: any) => e.empleado_id).join(',');
      const registrosRaw = await this.dataSource.query(
        `SELECT asistencia_id, empleado_id, fecha, hora_entrada_real, hora_salida_real, minutos_tardia, horas_trabajadas, estado_jornada FROM REGISTRO_ASISTENCIA WHERE empleado_id IN (${idsStr}) AND fecha = @0`,
        [fechaBusqueda],
      );

      return empleadosRaw.map((emp: any) => {
        const registro = registrosRaw.find((r: any) => r.empleado_id === emp.empleado_id);
        return {
          empleadoId: emp.empleado_id,
          nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
          codigoEmpleado: emp.codigo_empleado,
          asistencia: registro
            ? {
                asistenciaId: registro.asistencia_id,
                horaEntradaReal: registro.hora_entrada_real,
                horaSalidaReal: registro.hora_salida_real,
                minutosTardia: registro.minutos_tardia,
                horasTrabajadas: registro.horas_trabajadas,
                estadoJornada: registro.estado_jornada,
              }
            : null,
        };
      });
    } catch (error) {
      console.error('Error in getTeamAttendance:', error);
      throw error;
    }
  }

  private getTimeFromString(timeStr: string): Date {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds || 0, 0);
    return date;
  }

  private calculateHours(start: Date, end: Date): number {
    const diff = end.getTime() - start.getTime();
    return Math.round((diff / 3600000) * 100) / 100;
  }
}
