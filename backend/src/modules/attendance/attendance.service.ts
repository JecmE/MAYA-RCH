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
    const expected = new Date(now);
    expected.setHours(h, m, 0, 0);

    const effectiveTolerance = await this.getEffectiveTolerance(turno);
    const minTime = new Date(expected); minTime.setMinutes(minTime.getMinutes() - 65);
    const maxTime = new Date(expected); maxTime.setMinutes(maxTime.getMinutes() + effectiveTolerance + 1);

    if (now < minTime) {
      throw new BadRequestException(`Aún no puedes marcar. Disponible desde las ${this.formatTimeToString(minTime)}`);
    }
    if (now > maxTime) {
      throw new BadRequestException(`Tiempo de marcaje expirado. El límite era a las ${this.formatTimeToString(maxTime)}`);
    }

    let minutosTardia = 0;
    if (now > expected) {
      minutosTardia = Math.floor((now.getTime() - expected.getTime()) / 60000);
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

  async getHistory(empleadoId: number, start?: string, end?: string) {
    const where: any = { empleadoId };
    if (start && end) where.fecha = Between(new Date(start), new Date(end));
    return await this.asistenciaRepository.find({ where, order: { fecha: 'DESC' } });
  }

  async adjustAttendance(id: number, dto: any, usuarioId: number) {
    const asistencia = id === 0 ?
      this.asistenciaRepository.create({ empleadoId: dto.empleadoId, fecha: new Date(dto.fecha) }) :
      await this.asistenciaRepository.findOne({ where: { asistenciaId: id } });

    if (!asistencia) throw new NotFoundException('No encontrado');

    if (dto.campo === 'horaEntradaReal' || dto.campo === 'horaSalidaReal') {
      const [h, m] = dto.valorNuevo.split(':').map(Number);
      const newTime = new Date(asistencia.fecha);
      newTime.setHours(h, m, 0, 0);
      (asistencia as any)[dto.campo] = newTime;
    }

    const saved = await this.asistenciaRepository.save(asistencia);
    return { message: 'Ajustado', asistencia: saved };
  }

  async getTeamAttendance(supervisorId: number, fecha?: string) {
    const equipo = await this.empleadoRepository.find({ where: { supervisorId, activo: true } });
    const ids = equipo.map(e => e.empleadoId);
    if (ids.length === 0) return [];
    const date = fecha ? new Date(fecha) : this.getGuatemalaNow();
    date.setHours(0,0,0,0);
    const regs = await this.asistenciaRepository.find({ where: { empleadoId: In(ids), fecha: date as any } });
    return equipo.map(emp => ({
      ...emp,
      nombreCompleto: this.sanitizeString(`${emp.nombres} ${emp.apellidos}`),
      asistencia: regs.find(r => r.empleadoId === emp.empleadoId) || null
    }));
  }

  async getAllAttendance(start: string, end: string) {
      return await this.asistenciaRepository.find({
          where: { fecha: Between(new Date(start), new Date(end)) as any },
          relations: ['empleado']
      });
  }

  async getAdjustmentHistory() {
    return this.ajusteRepository.find({ relations: ['asistencia', 'asistencia.empleado', 'usuario'], order: { fechaHora: 'DESC' } });
  }

  private sanitizeString(str: string | null | undefined): string {
    if (!str) return '';
    return str
      .replace(/Rodr\?guez/g, 'Rodríguez').replace(/Mart\?nez/g, 'Martínez')
      .replace(/Garc\?a/g, 'García').replace(/L\?pez/g, 'López')
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

  private calculateHours(start: any, end: any): number {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.round((diff / 3600000) * 100) / 100;
  }
}
