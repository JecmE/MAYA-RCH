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

  // MÉTODO INFALIBLE PARA OBTENER HORA Y FECHA REAL DE GUATEMALA
  private getGuatemalaNow(): Date {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc - (3600000 * 6));
  }

  private async getGlobalTolerance(): Promise<number> {
    const param = await this.parametroRepository.findOne({ where: { clave: 'tolerancia_minutos', activo: true } });
    return param ? parseInt(param.valor, 10) : 10;
  }

  private async getEffectiveTolerance(turno: Turno): Promise<number> {
    if (!turno || turno.toleranciaMinutos === 0) return await this.getGlobalTolerance();
    return turno.toleranciaMinutos;
  }

  async registerEntry(empleadoId: number, usuarioId: number, clientTime?: string) {
    // USAMOS LA HORA QUE MANDA EL FRONTEND PARA EVITAR DESFASES CON AZURE
    const now = clientTime ? new Date(clientTime) : this.getGuatemalaNow();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const existing = await this.asistenciaRepository.findOne({ where: { empleadoId, fecha: today as any } });
    if (existing && existing.horaEntradaReal) throw new BadRequestException('Ya se registró la entrada hoy');

    const empTurno = await this.getShiftForDate(empleadoId, today);
    if (!empTurno) throw new BadRequestException('No tienes turno asignado hoy');

    const turno = empTurno.turno;
    const [hT, mT] = turno.horaEntrada.split(':').map(Number);
    const tolerance = await this.getEffectiveTolerance(turno);

    const currentMins = now.getHours() * 60 + now.getMinutes();
    const expectedMins = hT * 60 + mT;

    const minsMin = expectedMins - 65; // 1 hora antes
    const minsMax = expectedMins + tolerance;

    if (currentMins < minsMin) throw new BadRequestException(`Muy temprano. Disponible desde: ${this.formatManual(hT - 1, mT)}`);
    if (currentMins > maxMins) {
        console.error(`ERROR MARCAJE: Empleado=${empleadoId}, Actual=${currentMins}m, Max=${maxMins}m`);
        throw new BadRequestException(`Tiempo expirado. El límite era a las ${this.formatManual(hT, mT + tolerance)}`);
    }

    const asistencia = existing || this.asistenciaRepository.create({
      empleadoId,
      fecha: today,
      estadoJornada: RegistroAsistencia.ESTADO_INCOMPLETA,
    });

    asistencia.horaEntradaReal = now;
    asistencia.minutosTardia = Math.max(0, currentMins - expectedMins);
    asistencia.empleadoTurnoId = empTurno.empleadoTurnoId;

    const saved = await this.asistenciaRepository.save(asistencia);
    await this.kpiService.refreshEmployeeKpi(empleadoId);
    return { message: 'Entrada registrada', asistencia: saved };
  }

  async registerExit(empleadoId: number, usuarioId: number, clientTime?: string) {
    const now = clientTime ? new Date(clientTime) : this.getGuatemalaNow();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const asis = await this.asistenciaRepository.findOne({ where: { empleadoId, fecha: today as any } });
    if (!asis) throw new BadRequestException('No has marcado entrada hoy');
    if (asis.horaSalidaReal) throw new BadRequestException('Ya marcaste salida');

    asis.horaSalidaReal = now;
    asis.estadoJornada = RegistroAsistencia.ESTADO_COMPLETADA;
    asis.horasTrabajadas = this.calculateHours(asis.horaEntradaReal, now);

    await this.asistenciaRepository.save(asis);
    await this.kpiService.refreshEmployeeKpi(empleadoId);
    return { message: 'Salida registrada', asistencia: asis };
  }

  async getTodayStatus(empleadoId: number) {
    const now = this.getGuatemalaNow();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const asis = await this.asistenciaRepository.findOne({ where: { empleadoId, fecha: today as any } });
    const empTurno = await this.getShiftForDate(empleadoId, today);

    let tol = empTurno?.turno?.toleranciaMinutos || 0;
    if (empTurno?.turno && tol === 0) tol = await this.getGlobalTolerance();

    return {
      asistenciaId: asis?.asistenciaId,
      tieneEntrada: !!asis?.horaEntradaReal,
      tieneSalida: !!asis?.horaSalidaReal,
      turnoNombre: empTurno?.turno?.nombre || 'Sin turno',
      toleranciaMinutos: tol,
      horaEntradaTurno: empTurno?.turno?.horaEntrada,
      horaSalidaTurno: empTurno?.turno?.horaSalida,
      horaEntradaReal: asis?.horaEntradaReal,
      horaSalidaReal: asis?.horaSalidaReal,
      estadoJornada: asis?.estadoJornada || 'sin_registro'
    };
  }

  private async getShiftForDate(id: number, date: Date) {
    return await this.empleadoTurnoRepository.findOne({
      where: { empleadoId: id, activo: true, fechaInicio: LessThanOrEqual(date) },
      relations: ['turno'],
      order: { fechaInicio: 'DESC', empleadoTurnoId: 'DESC' }
    });
  }

  async getHistory(id: number, start?: string, end?: string) {
    const where: any = { empleadoId: id };
    if (start && end) where.fecha = Between(new Date(start), new Date(end));
    return await this.asistenciaRepository.find({ where, order: { fecha: 'DESC' } });
  }

  async adjustAttendance(id: number, dto: any, user: number) {
    let asis = id === 0 ? this.asistenciaRepository.create({ empleadoId: dto.empleadoId, fecha: new Date(dto.fecha) }) : await this.asistenciaRepository.findOne({ where: { asistenciaId: id } });
    if (!asis) throw new NotFoundException('No encontrado');

    if (dto.campo === 'horaEntradaReal' || dto.campo === 'horaSalidaReal') {
      const [h, m] = dto.valorNuevo.split(':').map(Number);
      const time = new Date(asis.fecha); time.setHours(h, m, 0, 0);
      (asis as any)[dto.campo] = time;
    }
    const saved = await this.asistenciaRepository.save(asis);
    return { message: 'Ajustado', asistencia: saved };
  }

  async getTeamAttendance(supId: number, fecha?: string) {
    const equipo = await this.empleadoRepository.find({ where: { supervisorId: supId, activo: true } });
    const ids = equipo.map(e => e.empleadoId);
    if (ids.length === 0) return [];
    const now = this.getGuatemalaNow();
    const date = fecha ? new Date(fecha) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    date.setHours(0,0,0,0);
    const regs = await this.asistenciaRepository.find({ where: { empleadoId: In(ids), fecha: date as any } });
    return equipo.map(emp => ({
      ...emp,
      nombreCompleto: this.sanitizeString(`${emp.nombres} ${emp.apellidos}`),
      asistencia: regs.find(r => r.empleadoId === emp.empleadoId) || null
    }));
  }

  async getAllAttendance(start?: string, end?: string) {
    if (!start) return [];
    const asis = await this.asistenciaRepository.find({
      where: { fecha: Between(new Date(start), new Date(end || start)) as any },
      relations: ['empleado']
    });
    return asis.map(a => ({ ...a, nombreCompleto: this.sanitizeString(`${a.empleado?.nombres} ${a.empleado?.apellidos}`) }));
  }

  async getAdjustmentHistory() {
    return this.ajusteRepository.find({ relations: ['asistencia', 'asistencia.empleado', 'usuario'], order: { fechaHora: 'DESC' }, take: 200 });
  }

  private sanitizeString(s: string | null): string {
    if (!s) return '';
    return s.replace(/Rodr\?guez/g, 'Rodríguez').replace(/Mart\?nez/g, 'Martínez').replace(/Garc\?a/g, 'García').replace(/L\?pez/g, 'López').replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ');
  }

  private formatManual(h: number, m: number): string {
    const hh = (h + 24) % 24;
    const mm = (m + 60) % 60;
    const p = hh >= 12 ? 'p. m.' : 'a. m.';
    const h12 = hh % 12 || 12;
    return `${h12}:${String(mm).padStart(2, '0')} ${p}`;
  }

  private calculateHours(s: any, e: any): number {
    const d = new Date(e).getTime() - new Date(s).getTime();
    return Math.round((d / 3600000) * 100) / 100;
  }
}
