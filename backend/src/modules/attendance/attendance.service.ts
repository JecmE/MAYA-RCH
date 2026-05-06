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

  private getGuatemalaNow(): Date {
    const now = new Date();
    return new Date(now.getTime() + (now.getTimezoneOffset() * 60000) - (6 * 3600000));
  }

  private async getGlobalTolerance(): Promise<number> {
    const param = await this.parametroRepository.findOne({ where: { clave: 'tolerancia_minutos', activo: true } });
    return param ? parseInt(param.valor, 10) : 10;
  }

  private async getEffectiveTolerance(turno: Turno): Promise<number> {
    if (!turno || turno.toleranciaMinutos === 0) {
      return await this.getGlobalTolerance();
    }
    return turno.toleranciaMinutos;
  }

  async registerEntry(empleadoId: number, usuarioId: number) {
    const now = this.getGuatemalaNow();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const existing = await this.asistenciaRepository.findOne({
      where: { empleadoId, fecha: today as any },
    });

    if (existing && existing.horaEntradaReal) {
      throw new BadRequestException('Ya se registró la entrada hoy');
    }

    const empleadoTurno = await this.getShiftForDate(empleadoId, today);
    if (!empleadoTurno) {
      throw new BadRequestException('No tiene turno asignado para hoy');
    }

    const turno = empleadoTurno.turno;
    const [h, m] = turno.horaEntrada.split(':').map(Number);
    const effectiveTolerance = await this.getEffectiveTolerance(turno);

    // CALCULO MATEMÁTICO DE MINUTOS (Evita errores de zona horaria de Azure)
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const expectedMinutes = h * 60 + m;

    const minAllowed = expectedMinutes - 65; // 1 hora y 5 min antes
    const maxAllowed = expectedMinutes + effectiveTolerance + 1;

    if (currentMinutes < minAllowed) {
        throw new BadRequestException(`Muy temprano. Disponible desde las ${this.formatTimeToString(new Date(now.setHours(0, minAllowed, 0)))}`);
    }

    if (currentMinutes > maxAllowed) {
        throw new BadRequestException(`Tiempo de marcaje expirado. El límite era a las ${this.formatTimeToString(new Date(now.setHours(0, maxAllowed, 0)))}`);
    }

    let minutosTardia = 0;
    if (currentMinutes > expectedMinutes) {
      minutosTardia = currentMinutes - expectedMinutes;
    }

    const asistencia = existing || this.asistenciaRepository.create({
      empleadoId,
      fecha: today,
      estadoJornada: RegistroAsistencia.ESTADO_INCOMPLETA,
    });

    asistencia.horaEntradaReal = now;
    asistencia.minutosTardia = minutosTardia;
    asistencia.empleadoTurnoId = empleadoTurno.empleadoTurnoId;

    const saved = await this.asistenciaRepository.save(asistencia);
    await this.kpiService.refreshEmployeeKpi(empleadoId);

    return { message: 'Entrada registrada', asistencia: saved, minutosTardia };
  }

  async registerExit(empleadoId: number, usuarioId: number) {
    const now = this.getGuatemalaNow();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const asistencia = await this.asistenciaRepository.findOne({
      where: { empleadoId, fecha: today as any },
    });

    if (!asistencia) throw new BadRequestException('No se ha registrado entrada hoy');
    if (asistencia.horaSalidaReal) throw new BadRequestException('Ya se registró la salida hoy');

    const empleadoTurno = await this.getShiftForDate(empleadoId, today);
    if (!empleadoTurno) throw new BadRequestException('No tiene turno asignado');

    asistencia.horaSalidaReal = now;
    asistencia.estadoJornada = RegistroAsistencia.ESTADO_COMPLETADA;
    asistencia.horasTrabajadas = this.calculateHours(asistencia.horaEntradaReal, now);

    await this.asistenciaRepository.save(asistencia);
    await this.kpiService.refreshEmployeeKpi(empleadoId);

    return { message: 'Salida registrada', asistencia };
  }

  async getTodayStatus(empleadoId: number) {
    const now = this.getGuatemalaNow();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const asistencia = await this.asistenciaRepository.findOne({
      where: { empleadoId, fecha: today as any },
    });

    const empleadoTurno = await this.getShiftForDate(empleadoId, today);
    const turnoNombre = empleadoTurno?.turno?.nombre || 'Sin turno';
    let toleranciaMinutos = empleadoTurno?.turno?.toleranciaMinutos || 0;
    if (empleadoTurno?.turno && toleranciaMinutos === 0) {
      toleranciaMinutos = await this.getGlobalTolerance();
    }

    const horaEntradaTurno = empleadoTurno?.turno?.horaEntrada || null;
    const horaSalidaTurno = empleadoTurno?.turno?.horaSalida || null;

    if (!asistencia) {
      return {
        estadoJornada: 'sin_registro',
        fecha: today,
        tieneEntrada: false,
        tieneSalida: false,
        turnoNombre,
        toleranciaMinutos,
        horaEntradaTurno,
        horaSalidaTurno
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
      tieneEntrada: !!asistencia.horaEntradaReal,
      tieneSalida: !!asistencia.horaSalidaReal,
      turnoNombre,
      toleranciaMinutos,
      horaEntradaTurno,
      horaSalidaTurno,
    };
  }

  private async getShiftForDate(empleadoId: number, date: Date): Promise<EmpleadoTurno | null> {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    return await this.empleadoTurnoRepository.findOne({
      where: { empleadoId, activo: true, fechaInicio: LessThanOrEqual(d) },
      relations: ['turno'],
      order: { fechaInicio: 'DESC', empleadoTurnoId: 'DESC' }
    });
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

    return await this.asistenciaRepository.find({ where, order: { fecha: 'DESC' } });
  }

  async adjustAttendance(asistenciaId: number, adjustDto: any, usuarioId: number) {
    const asistencia = asistenciaId === 0 ?
      this.asistenciaRepository.create({ empleadoId: adjustDto.empleadoId, fecha: new Date(adjustDto.fecha) }) :
      await this.asistenciaRepository.findOne({ where: { asistenciaId } });

    if (!asistencia) throw new NotFoundException('No encontrado');

    const { campo, valorNuevo, motivo } = adjustDto;
    const valorAnterior = (asistencia as any)[campo] || 'Sin registro';

    if (campo === 'horaEntradaReal' || campo === 'horaSalidaReal') {
      const [hours, minutes] = valorNuevo.split(':').map(Number);
      const newTime = new Date(asistencia.fecha);
      newTime.setHours(hours, minutes, 0, 0);
      (asistencia as any)[campo] = newTime;
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

    return { message: 'Ajuste registrado', asistencia: saved };
  }

  async getTeamAttendance(supervisorId: number, fecha?: string) {
    const equipo = await this.empleadoRepository.find({ where: { supervisorId, activo: true } });
    if (equipo.length === 0) return [];

    const fechaBusqueda = fecha ? new Date(fecha) : this.getGuatemalaNow();
    fechaBusqueda.setHours(0, 0, 0, 0);

    const empleadoIds = equipo.map((e) => e.empleadoId);
    const registros = await this.asistenciaRepository.find({
      where: { empleadoId: In(empleadoIds), fecha: fechaBusqueda as any },
    });

    return equipo.map((emp) => ({
      ...emp,
      nombreCompleto: this.sanitizeString(`${emp.nombres} ${emp.apellidos}`),
      asistencia: registros.find((r) => r.empleadoId === emp.empleadoId) || null,
    }));
  }

  async getAllAttendance(fechaInicio?: string, fechaFin?: string) {
    const asistencias = await this.asistenciaRepository.find({
      where: { fecha: Between(new Date(fechaInicio), new Date(fechaFin)) as any },
      relations: ['empleado']
    });
    return asistencias.map(a => ({
        ...a,
        nombreCompleto: a.empleado ? this.sanitizeString(`${a.empleado.nombres} ${a.empleado.apellidos}`) : 'N/A'
    }));
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
      .replace(/Rodr\?guez/g, 'Rodríguez').replace(/Mart\?nez/g, 'Martínez')
      .replace(/Fern\?ndez/g, 'Fernández').replace(/Garc\?a/g, 'García')
      .replace(/L\?pez/g, 'López').replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó')
      .replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ');
  }

  private formatTimeToString(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'p. m.' : 'a. m.';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  private getTimeFromString(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private calculateHours(start: any, end: any): number {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.round((diff / 3600000) * 100) / 100;
  }
}
