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

  async registerEntry(empleadoId: number, usuarioId: number, payload: any) {
    const { h, m, date } = payload;
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);

    const existing = await this.asistenciaRepository.findOne({ where: { empleadoId, fecha: today as any } });
    if (existing && existing.horaEntradaReal) throw new BadRequestException('Ya se registró la entrada hoy');

    const empTurno = await this.getShiftForDate(empleadoId, today);
    if (!empTurno) throw new BadRequestException('No tienes turno asignado hoy');

    const turno = empTurno.turno;
    const [hT, mT] = turno.horaEntrada.split(':').map(Number);
    const tol = turno.toleranciaMinutos || 10;

    // VALIDACIÓN NUMÉRICA BASADA EN LA HORA DEL CLIENTE
    const minsActual = h * 60 + m;
    const minsTurno = hT * 60 + mT;
    const minsMax = minsTurno + tol;

    // Si el botón estaba activo en el cliente, el servidor debe aceptar (Damos un margen de 2 min)
    if (minsActual > (minsMax + 2)) {
        throw new BadRequestException(`Tiempo expirado. El límite era a las ${hT}:${mT + tol}`);
    }

    const asistencia = existing || this.asistenciaRepository.create({ empleadoId, fecha: today, estadoJornada: RegistroAsistencia.ESTADO_INCOMPLETA });

    // Reconstruimos la fecha con la hora del cliente para guardar en DB
    const finalDate = new Date(today);
    finalDate.setHours(h, m, 0, 0);

    asistencia.horaEntradaReal = finalDate;
    asistencia.minutosTardia = Math.max(0, minsActual - minsTurno);
    asistencia.empleadoTurnoId = empTurno.empleadoTurnoId;

    const saved = await this.asistenciaRepository.save(asistencia);
    await this.kpiService.refreshEmployeeKpi(empleadoId);
    return { message: 'Entrada registrada', asistencia: saved };
  }

  async registerExit(empleadoId: number, usuarioId: number, payload: any) {
    const { h, m, date } = payload;
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);

    const asis = await this.asistenciaRepository.findOne({ where: { empleadoId, fecha: today as any } });
    if (!asis) throw new BadRequestException('No has marcado entrada hoy');
    if (asis.horaSalidaReal) throw new BadRequestException('Ya marcaste salida');

    const finalDate = new Date(today);
    finalDate.setHours(h, m, 0, 0);

    asis.horaSalidaReal = finalDate;
    asis.estadoJornada = RegistroAsistencia.ESTADO_COMPLETADA;
    asis.horasTrabajadas = this.calculateHours(asis.horaEntradaReal, finalDate);

    await this.asistenciaRepository.save(asis);
    await this.kpiService.refreshEmployeeKpi(empleadoId);
    return { message: 'Salida registrada', asistencia: asis };
  }

  async getTodayStatus(empleadoId: number) {
    // Para el estado inicial, Azure se comporta bien pidiendo datos, el problema es al guardar
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const nowGT = new Date(utc - (3600000 * 6));
    const today = new Date(nowGT.getFullYear(), nowGT.getMonth(), nowGT.getDate());

    const asis = await this.asistenciaRepository.findOne({ where: { empleadoId, fecha: today as any } });
    const empTurno = await this.getShiftForDate(empleadoId, today);

    return {
      asistenciaId: asis?.asistenciaId,
      tieneEntrada: !!asis?.horaEntradaReal,
      tieneSalida: !!asis?.horaSalidaReal,
      turnoNombre: empTurno?.turno?.nombre || 'Sin turno',
      toleranciaMinutos: empTurno?.turno?.toleranciaMinutos || 10,
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

  async getTeamAttendance(supId: number, fecha?: string) {
    const equipo = await this.empleadoRepository.find({ where: { supervisorId: supId, activo: true } });
    const ids = equipo.map(e => e.empleadoId);
    if (ids.length === 0) return [];
    const date = fecha ? new Date(fecha) : new Date();
    date.setHours(0,0,0,0);
    const regs = await this.asistenciaRepository.find({ where: { empleadoId: In(ids), fecha: date as any } });
    return equipo.map(emp => ({ ...emp, asistencia: regs.find(r => r.empleadoId === emp.empleadoId) || null }));
  }

  async getAllAttendance(s?: string, e?: string) {
    return await this.asistenciaRepository.find({ where: { fecha: Between(new Date(s), new Date(e || s)) as any }, relations: ['empleado'] });
  }

  async adjustAttendance(id: number, dto: any, user: number) {
    let asis = id === 0 ? this.asistenciaRepository.create({ empleadoId: dto.empleadoId, fecha: new Date(dto.fecha) }) : await this.asistenciaRepository.findOne({ where: { asistenciaId: id } });
    if (!asis) throw new NotFoundException('No encontrado');
    const saved = await this.asistenciaRepository.save(asis);
    return { message: 'Ajustado', asistencia: saved };
  }

  async getAdjustmentHistory() { return this.ajusteRepository.find({ relations: ['asistencia', 'asistencia.empleado', 'usuario'], order: { fechaHora: 'DESC' }, take: 200 }); }

  private calculateHours(s: any, e: any): number {
    const d = new Date(e).getTime() - new Date(s).getTime();
    return Math.round((d / 3600000) * 100) / 100;
  }
}
