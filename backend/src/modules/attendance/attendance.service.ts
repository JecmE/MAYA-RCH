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
import { ParametroSistema } from '../../entities/parametro-sistema.entity';
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
    @InjectRepository(ParametroSistema)
    private parametroRepository: Repository<ParametroSistema>,
    private dataSource: DataSource,
    @Inject(forwardRef(() => KpiService))
    private kpiService: KpiService,
  ) {}

  private async getGlobalTolerance(): Promise<number> {
    const param = await this.parametroRepository.findOne({ where: { clave: 'tolerancia_minutos', activo: true } });
    return param ? parseInt(param.valor, 10) : 10; // Default 10 if not found
  }

  private async getEffectiveTolerance(turno: Turno): Promise<number> {
    // Si el turno tiene 0, heredamos el global del sistema
    if (!turno || turno.toleranciaMinutos === 0) {
      return await this.getGlobalTolerance();
    }
    return turno.toleranciaMinutos;
  }

  async registerEntry(empleadoId: number, usuarioId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.asistenciaRepository.findOne({
      where: { empleadoId, fecha: today },
    });

    if (existing && existing.horaEntradaReal) {
      throw new BadRequestException('Ya se registró la entrada hoy');
    }

    const empleadoTurno = await this.getShiftForDate(empleadoId, today);

    if (!empleadoTurno) {
      throw new BadRequestException('No tiene turno asignado para hoy');
    }

    const turno = empleadoTurno.turno;
    const now = new Date();

    const diasSemanaMap: { [key: number]: string } = {
      1: 'Lun', 2: 'Mar', 3: 'Mie', 4: 'Jue', 5: 'Vie', 6: 'Sab', 0: 'Dom'
    };
    const hoyNombre = diasSemanaMap[now.getDay()];
    const diasPermitidos = turno.dias ? turno.dias.split(',') : ['Lun','Mar','Mie','Jue','Vie'];

    if (!diasPermitidos.includes(hoyNombre)) {
      throw new BadRequestException(`Hoy (${hoyNombre}) no es un día laborable según tu turno (${turno.nombre}).`);
    }

    const effectiveTolerance = await this.getEffectiveTolerance(turno);
    const horaEntradaEsperada = this.getTimeFromString(turno.horaEntrada);

    const horaEntradaMin = new Date(now);
    horaEntradaMin.setHours(
      horaEntradaEsperada.getHours(),
      horaEntradaEsperada.getMinutes() - 30,
      0,
      0,
    );

    const horaEntradaMax = new Date(horaEntradaEsperada);
    horaEntradaMax.setMinutes(horaEntradaMax.getMinutes() + effectiveTolerance);

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
      minutosTardia = Math.floor(diff / 60000) - effectiveTolerance;
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
      return { message: 'Entrada registrada', asistencia: existing, minutosTardia };
    }

    const asistencia = this.asistenciaRepository.create({
      empleadoId,
      empleadoTurnoId: empleadoTurno.empleadoTurnoId,
      fecha: today,
      horaEntradaReal: now,
      minutosTardia,
      estadoJornada: RegistroAsistencia.ESTADO_INCOMPLETA,
    });

    const saved = await this.asistenciaRepository.save(asistencia);
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

    const empleadoTurno = await this.getShiftForDate(empleadoId, today);

    if (!empleadoTurno) {
      throw new BadRequestException('No tiene turno asignado');
    }

    const now = new Date();
    asistencia.horaSalidaReal = now;
    asistencia.estadoJornada = RegistroAsistencia.ESTADO_COMPLETADA;
    asistencia.horasTrabajadas = this.calculateHours(asistencia.horaEntradaReal, now);

    await this.asistenciaRepository.save(asistencia);
    await this.kpiService.refreshEmployeeKpi(empleadoId);

    return { message: 'Salida registrada', asistencia };
  }

  private async getShiftForDate(empleadoId: number, date: Date): Promise<EmpleadoTurno | null> {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    return await this.empleadoTurnoRepository.findOne({
      where: {
        empleadoId,
        activo: true,
        fechaInicio: LessThanOrEqual(d)
      },
      relations: ['turno'],
      order: { fechaInicio: 'DESC', empleadoTurnoId: 'DESC' }
    });
  }

  async getTodayStatus(empleadoId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const asistencia = await this.asistenciaRepository.findOne({
      where: { empleadoId, fecha: today },
    });

    const empleadoTurno = await this.getShiftForDate(empleadoId, today);

    const turnoNombre = empleadoTurno?.turno?.nombre || 'Sin turno';
    let toleranciaMinutos = empleadoTurno?.turno?.toleranciaMinutos || 0;

    // Si el turno tiene 0, mostramos la global en el estado del Dashboard
    if (empleadoTurno?.turno && toleranciaMinutos === 0) {
      toleranciaMinutos = await this.getGlobalTolerance();
    }

    const horaEntradaTurno = empleadoTurno?.turno?.horaEntrada || null;
    const horaSalidaTurno = empleadoTurno?.turno?.horaSalida || null;

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
    let asistencia;

    const parsePura = (s: string) => {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d);
    };

    const fechaReferencia = parsePura(adjustDto.fecha);

    if (asistenciaId === 0) {
      asistencia = await this.asistenciaRepository.findOne({
        where: { empleadoId: adjustDto.empleadoId, fecha: fechaReferencia as any },
      });

      if (!asistencia) {
        asistencia = this.asistenciaRepository.create({
          empleadoId: adjustDto.empleadoId,
          fecha: fechaReferencia,
          estadoJornada: RegistroAsistencia.ESTADO_INCOMPLETA,
          observacion: 'Registro creado por ajuste manual'
        });
      }
    } else {
      asistencia = await this.asistenciaRepository.findOne({ where: { asistenciaId } });
    }

    if (!asistencia) {
      throw new NotFoundException('No se pudo localizar el registro de asistencia');
    }

    const { campo, valorNuevo, motivo } = adjustDto;
    const valorAnterior = (asistencia as any)[campo] || 'Sin registro';

    if (campo === 'horaEntradaReal' || campo === 'horaSalidaReal') {
      const [hours, minutes] = valorNuevo.split(':').map(Number);
      const newTime = new Date(asistencia.fecha);
      newTime.setHours(hours, minutes, 0, 0);
      (asistencia as any)[campo] = newTime;

      // Recalcular minutos de tardía si se modificó la entrada
      if (campo === 'horaEntradaReal') {
        const shift = await this.getShiftForDate(asistencia.empleadoId, asistencia.fecha);
        if (shift && shift.turno) {
          const expectedIn = this.getTimeFromString(shift.turno.horaEntrada);
          const actualIn = new Date(asistencia.horaEntradaReal);
          if (actualIn > expectedIn) {
            const diffMin = Math.floor((actualIn.getTime() - expectedIn.getTime()) / 60000);
            const effectiveTolerance = await this.getEffectiveTolerance(shift.turno);
            asistencia.minutosTardia = Math.max(0, diffMin - effectiveTolerance);
          } else {
            asistencia.minutosTardia = 0;
          }
        }
      }
    }

    if (asistencia.horaEntradaReal && asistencia.horaSalidaReal) {
      asistencia.horasTrabajadas = this.calculateHours(asistencia.horaEntradaReal, asistencia.horaSalidaReal);
      asistencia.estadoJornada = RegistroAsistencia.ESTADO_COMPLETADA;
    }

    const saved = await this.asistenciaRepository.save(asistencia);

    await this.ajusteRepository.save({
      asistenciaId: saved.asistenciaId,
      usuarioId,
      campoModificado: campo,
      valorAnterior: valorAnterior instanceof Date ? this.formatTimeToString(valorAnterior) : valorAnterior.toString(),
      valorNuevo: valorNuevo.toString(),
      motivo,
      fechaHora: new Date(),
    });

    return { message: 'Ajuste registrado correctamente', asistencia: saved };
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
          nombreCompleto: this.sanitizeString(`${emp.nombres} ${emp.apellidos}`),
          codigoEmpleado: emp.codigoEmpleado,
          departamento: this.sanitizeString(emp.departamento) || 'Sin asignar',
          puesto: this.sanitizeString(emp.puesto) || 'Empleado',
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

  async getAllAttendance(fechaInicio?: string, fechaFin?: string) {
    try {
      const startISO = fechaInicio;
      const endISO = fechaFin || fechaInicio;

      const parseLocalSafe = (s: string) => {
        const [y, m, d] = s.split('-').map(Number);
        return new Date(y, m - 1, d, 12, 0, 0);
      };

      const startDate = parseLocalSafe(startISO);
      const endDate = parseLocalSafe(endISO);

      const timeDiff = endDate.getTime() - startDate.getTime();
      const daysCount = Math.round(timeDiff / (1000 * 3600 * 24)) + 1;

      const rangeISODates: string[] = [];
      const limit = daysCount > 31 ? 31 : daysCount;

      for(let i=0; i < limit; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        rangeISODates.push(d.toISOString().split('T')[0]);
      }

      const empleados = await this.empleadoRepository.find({
        where: { activo: true },
        relations: ['empleadoTurnos', 'empleadoTurnos.turno']
      });

      const asistencias = await this.asistenciaRepository.find({
        where: {
          fecha: Between(new Date(startISO + 'T00:00:00'), new Date(endISO + 'T23:59:59')) as any
        }
      });

      const results = [];
      for (const isoDate of rangeISODates) {
        for (const emp of empleados) {
          const asistencia = asistencias.find(a => {
            const dbDateISO = new Date(a.fecha).toISOString().split('T')[0];
            return a.empleadoId === emp.empleadoId && dbDateISO === isoDate;
          });

          // Buscar el turno con prioridad al activo y más reciente para esta fecha
          const turnosEnFecha = emp.empleadoTurnos?.filter(et => {
            const tStart = new Date(et.fechaInicio).toISOString().split('T')[0];
            const tEnd = et.fechaFin ? new Date(et.fechaFin).toISOString().split('T')[0] : null;
            return isoDate >= tStart && (!tEnd || isoDate <= tEnd);
          }) || [];

          const turnoAsignado = turnosEnFecha.sort((a, b) => {
            if (a.activo !== b.activo) return a.activo ? -1 : 1;
            return b.empleadoTurnoId - a.empleadoTurnoId;
          })[0];

          results.push({
            empleadoId: emp.empleadoId,
            nombreCompleto: this.sanitizeString(`${emp.nombres} ${emp.apellidos}`),
            codigoEmpleado: emp.codigoEmpleado,
            departamento: this.sanitizeString(emp.departamento),
            fecha: isoDate,
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
          });
        }
      }
      return results;
    } catch (error) {
      console.error('Error in getAllAttendance:', error);
      throw error;
    }
  }

  async getAdjustmentHistory() {
    return this.ajusteRepository.find({
      relations: ['asistencia', 'asistencia.empleado', 'usuario'],
      order: { fechaHora: 'DESC' },
      take: 200
    });
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

  private formatTimeToString(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'p. m.' : 'a. m.';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  private getTimeFromString(timeStr: string): Date {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds || 0, 0);
    return date;
  }

  private calculateHours(start: any, end: any): number {
    const dStart = new Date(start);
    const dEnd = new Date(end);
    let diff = dEnd.getTime() - dStart.getTime();
    if (diff < 0) {
      diff += 24 * 60 * 60 * 1000;
    }
    return Math.round((diff / 3600000) * 100) / 100;
  }
}
