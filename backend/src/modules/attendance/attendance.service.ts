import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, DataSource, In } from 'typeorm';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { Empleado } from '../../entities/empleado.entity';
import { EmpleadoTurno } from '../../entities/empleado-turno.entity';
import { Turno } from '../../entities/turno.entity';
import { AjusteAsistencia } from '../../entities/ajuste-asistencia.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { KpiService } from '../kpi/kpi.service';

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
    @Inject(forwardRef(() => KpiService))
    private kpiService: KpiService,
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
      where: {
        empleadoId,
        activo: true,
        fechaInicio: LessThanOrEqual(today)
      },
      relations: ['turno'],
      order: { fechaInicio: 'DESC', empleadoTurnoId: 'DESC' }
    });

    if (!empleadoTurno) {
      throw new BadRequestException('No tiene turno asignado');
    }

    const turno = empleadoTurno.turno;
    const now = new Date();

    // VALIDACIÓN DE DÍAS LABORALES
    const diasSemanaMap: { [key: number]: string } = {
      1: 'Lun', 2: 'Mar', 3: 'Mie', 4: 'Jue', 5: 'Vie', 6: 'Sab', 0: 'Dom'
    };
    const hoyNombre = diasSemanaMap[now.getDay()];
    const diasPermitidos = turno.dias ? turno.dias.split(',') : ['Lun','Mar','Mie','Jue','Vie'];

    if (!diasPermitidos.includes(hoyNombre)) {
      throw new BadRequestException(`Hoy (${hoyNombre}) no es un día laborable según tu turno (${turno.nombre}).`);
    }

    const horaEntradaEsperada = this.getTimeFromString(turno.horaEntrada);
    const horaSalidaEsperada = this.getTimeFromString(turno.horaSalida);

    const horaEntradaMin = new Date(now);
    horaEntradaMin.setHours(
      horaEntradaEsperada.getHours(),
      horaEntradaEsperada.getMinutes() - 30,
      0,
      0,
    );

    const horaEntradaMax = new Date(horaEntradaEsperada);
    horaEntradaMax.setMinutes(horaEntradaMax.getMinutes() + turno.toleranciaMinutos);

    if (now < horaEntradaMin) {
      throw new BadRequestException(
        `Aún no puedes marcar entrada. Puedes hacerlo a partir de las ${this.formatTimeToString(horaEntradaMin)}`,
      );
    }

    if (now > horaEntradaMax) {
      throw new BadRequestException(
        `Ya no puedes marcar entrada. La hora máxima fue las ${this.formatTimeToString(horaEntradaMax)}`,
      );
    }

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

    // Recalcular KPI del mes
    await this.kpiService.refreshEmployeeKpi(empleadoId);

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

    const empleadoTurno = await this.empleadoTurnoRepository.findOne({
      where: {
        empleadoId,
        activo: true,
        fechaInicio: LessThanOrEqual(today)
      },
      relations: ['turno'],
      order: { fechaInicio: 'DESC', empleadoTurnoId: 'DESC' }
    });

    if (!empleadoTurno) {
      throw new BadRequestException('No tiene turno asignado');
    }

    const turno = empleadoTurno.turno;
    const now = new Date();
    const horaSalidaEsperada = this.getTimeFromString(turno.horaSalida);

    const horaSalidaPermitida = new Date(now);
    horaSalidaPermitida.setHours(
      horaSalidaEsperada.getHours(),
      horaSalidaEsperada.getMinutes(),
      0,
      0,
    );

    if (now < horaSalidaPermitida) {
      throw new BadRequestException(
        `Aún no puedes marcar salida. Puedes hacerlo a partir de las ${this.formatTimeToString(horaSalidaPermitida)}`,
      );
    }

    asistencia.horaSalidaReal = now;
    asistencia.estadoJornada = RegistroAsistencia.ESTADO_COMPLETADA;
    const horaEntrada =
      asistencia.horaEntradaReal instanceof Date
        ? asistencia.horaEntradaReal
        : new Date(asistencia.horaEntradaReal);
    const horasTra = this.calculateHours(horaEntrada, now);
    asistencia.horasTrabajadas = parseFloat(horasTra.toFixed(2));

    await this.asistenciaRepository.save(asistencia);

    await this.auditRepository.save({
      usuarioId,
      modulo: 'ASISTENCIA',
      accion: 'CHECK_OUT',
      entidad: 'REGISTRO_ASISTENCIA',
      entidadId: asistencia.asistenciaId,
      detalle: `Salida registrada, ${asistencia.horasTrabajadas} horas trabajadas`,
    });

    // Recalcular KPI del mes (día cerrado con entrada y salida)
    await this.kpiService.refreshEmployeeKpi(empleadoId);

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

    const empleadoTurno = await this.empleadoTurnoRepository.findOne({
      where: {
        empleadoId,
        activo: true,
        fechaInicio: LessThanOrEqual(today)
      },
      relations: ['turno'],
      order: { fechaInicio: 'DESC', empleadoTurnoId: 'DESC' }
    });

    const turnoNombre = empleadoTurno?.turno?.nombre || 'Sin turno';
    const toleranciaMinutos = empleadoTurno?.turno?.toleranciaMinutos || 0;
    const horaEntradaTurno = empleadoTurno?.turno?.horaEntrada || null;
    const horaSalidaTurno = empleadoTurno?.turno?.horaSalida || null;

    // Verificar si hoy es día laboral
    const diasSemanaMap: { [key: number]: string } = {
      1: 'Lun', 2: 'Mar', 3: 'Mie', 4: 'Jue', 5: 'Vie', 6: 'Sab', 0: 'Dom'
    };
    const hoyNombre = diasSemanaMap[today.getDay()];
    const diasPermitidos = empleadoTurno?.turno?.dias ? empleadoTurno.turno.dias.split(',') : ['Lun','Mar','Mie','Jue','Vie'];
    const esDiaLaboral = empleadoTurno ? diasPermitidos.includes(hoyNombre) : false;

    if (!asistencia) {
      return {
        estadoJornada: esDiaLaboral ? 'sin_registro' : 'no_laboral',
        fecha: today,
        tieneEntrada: false,
        tieneSalida: false,
        turnoNombre,
        toleranciaMinutos,
        horaEntradaTurno,
        horaSalidaTurno,
        mensajeEstado: esDiaLaboral ? '' : `Hoy (${hoyNombre}) no es un día laborable para tu turno.`
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
      turnoNombre,
      toleranciaMinutos,
      horaEntradaTurno,
      horaSalidaTurno,
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
        const horaEntrada =
          asistencia.horaEntradaReal instanceof Date
            ? asistencia.horaEntradaReal
            : new Date(asistencia.horaEntradaReal);
        const horaSalida =
          asistencia.horaSalidaReal instanceof Date
            ? asistencia.horaSalidaReal
            : new Date(asistencia.horaSalidaReal);
        asistencia.horasTrabajadas = this.calculateHours(horaEntrada, horaSalida);
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
      const equipo = await this.empleadoRepository.find({
        where: { supervisorId, activo: true },
      });

      if (equipo.length === 0) {
        return [];
      }

      const fechaBusqueda = fecha ? new Date(fecha) : new Date();
      fechaBusqueda.setHours(0, 0, 0, 0);

      const empleadoIds = equipo.map((e) => e.empleadoId);

      const registros = await this.asistenciaRepository.find({
        where: {
          empleadoId: In(empleadoIds),
          fecha: fechaBusqueda,
        },
      });

      return equipo.map((emp) => {
        const registro = registros.find((r) => r.empleadoId === emp.empleadoId);
        return {
          empleadoId: emp.empleadoId,
          nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
          codigoEmpleado: emp.codigoEmpleado,
          departamento: emp.departamento || 'Sin asignar',
          puesto: emp.puesto || 'Empleado',
          asistencia: registro
            ? {
                asistenciaId: registro.asistenciaId,
                horaEntradaReal: registro.horaEntradaReal,
                horaSalidaReal: registro.horaSalidaReal,
                minutosTardia: registro.minutosTardia,
                horasTrabajadas: registro.horasTrabajadas,
                estadoJornada: registro.estadoJornada,
                observacion: registro.observacion,
              }
            : null,
        };
      });
    } catch (error) {
      console.error('Error in getTeamAttendance:', error);
      throw error;
    }
  }

  async getAllAttendance(fecha?: string) {
    try {
      const searchDate = fecha ? new Date(fecha) : new Date();
      searchDate.setHours(0, 0, 0, 0);

      const empleados = await this.empleadoRepository.find({
        where: { activo: true },
        relations: ['empleadoTurnos', 'empleadoTurnos.turno']
      });

      const asistencias = await this.asistenciaRepository.find({
        where: {
          fecha: searchDate as any
        }
      });

      return empleados.map(emp => {
        const asistencia = asistencias.find(a => a.empleadoId === emp.empleadoId);

        // Determinar turno activo para la fecha
        const turnoAsignado = emp.empleadoTurnos?.find(et => {
          const inicio = new Date(et.fechaInicio);
          const fin = et.fechaFin ? new Date(et.fechaFin) : null;
          return searchDate >= inicio && (!fin || searchDate <= fin);
        });

        return {
          empleadoId: emp.empleadoId,
          nombreCompleto: this.sanitizeString(`${emp.nombres} ${emp.apellidos}`),
          codigoEmpleado: emp.codigoEmpleado,
          departamento: this.sanitizeString(emp.departamento),
          puesto: this.sanitizeString(emp.puesto),
          turno: turnoAsignado?.turno?.nombre || 'Sin turno',
          asistencia: asistencia ? {
            asistenciaId: asistencia.asistenciaId,
            horaEntradaReal: asistencia.horaEntradaReal,
            horaSalidaReal: asistencia.horaSalidaReal,
            minutosTardia: asistencia.minutosTardia,
            horasTrabajadas: asistencia.horasTrabajadas,
            estadoJornada: asistencia.estadoJornada,
            observacion: asistencia.observacion
          } : null
        };
      });
    } catch (error) {
      console.error('Error in getAllAttendance:', error);
      throw error;
    }
  }

  private sanitizeString(str: string | null | undefined): string {
    if (!str) return '';

    // 1. Limpieza de codificación y caracteres rotos
    let res = str
      .replace(/\?/g, (match, offset, original) => {
        if (original.includes('Rodr')) return 'í';
        if (original.includes('Mart')) return 'í';
        if (original.includes('Garc')) return 'í';
        if (original.includes('Fern')) return 'á';
        return 'í';
      })
      .replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ');

    // 2. Eliminar palabras duplicadas (ej: "María José María José")
    const words = res.trim().split(/\s+/);
    const finalWords: string[] = [];
    const seenSet = new Set<string>();

    for (const word of words) {
        const normalized = word.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (!seenSet.has(normalized)) {
            finalWords.push(word);
            seenSet.add(normalized);
        }
    }

    return finalWords.join(' ');
  }

  private getTimeFromString(timeStr: string): Date {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds || 0, 0);
    return date;
  }

  private formatTimeToString(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'p. m.' : 'a. m.';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  private calculateHours(start: Date, end: Date): number {
    const diff = end.getTime() - start.getTime();
    return Math.round((diff / 3600000) * 100) / 100;
  }
}
