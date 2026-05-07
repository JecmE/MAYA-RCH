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
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const nowGT = new Date(utc - (3600000 * 6));
    
    // Convert to Guatemala time components
    const h = nowGT.getHours();
    const m = nowGT.getMinutes();
    const today = new Date(nowGT.getFullYear(), nowGT.getMonth(), nowGT.getDate());

    const empTurno = await this.getShiftForDate(empleadoId, today);
    if (!empTurno) throw new BadRequestException('No tienes turno hoy');

    const turno = empTurno.turno;
    const [hT, mT] = turno.horaEntrada.split(':').map(Number);
    const minsActual = h * 60 + m;
    const minsTurno = hT * 60 + mT;
    const tol = turno.toleranciaMinutos || 10;

    if (minsActual > (minsTurno + tol + 5)) {
        throw new BadRequestException(`Tiempo excedido. Límite: ${hT}:${(mT + tol).toString().padStart(2, '0')}`);
    }

    let asistencia = await this.asistenciaRepository.findOne({ where: { empleadoId, fecha: today as any } });
    if (!asistencia) {
        asistencia = this.asistenciaRepository.create({ empleadoId, fecha: today, estadoJornada: RegistroAsistencia.ESTADO_INCOMPLETA });
    }

    const finalTime = new Date(today);
    finalTime.setHours(h, m, 0, 0);

    asistencia.horaEntradaReal = finalTime;
    asistencia.minutosTardia = Math.max(0, minsActual - minsTurno);
    asistencia.empleadoTurnoId = empTurno.empleadoTurnoId;

    await this.asistenciaRepository.save(asistencia);
    await this.kpiService.refreshEmployeeKpi(empleadoId);
    return { message: 'Entrada registrada' };
  }

  async registerExit(empleadoId: number, usuarioId: number, payload: any) {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const nowGT = new Date(utc - (3600000 * 6));
    
    const h = nowGT.getHours();
    const m = nowGT.getMinutes();
    const today = new Date(nowGT.getFullYear(), nowGT.getMonth(), nowGT.getDate());

    const asis = await this.asistenciaRepository.findOne({ where: { empleadoId, fecha: today as any } });
    if (!asis) throw new BadRequestException('No hay entrada hoy');

    const finalTime = new Date(today);
    finalTime.setHours(h, m, 0, 0);

    asis.horaSalidaReal = finalTime;
    asis.estadoJornada = RegistroAsistencia.ESTADO_COMPLETADA;
    asis.horasTrabajadas = this.calculateHours(asis.horaEntradaReal, finalTime);

    await this.asistenciaRepository.save(asis);
    await this.kpiService.refreshEmployeeKpi(empleadoId);
    return { message: 'Salida registrada' };
  }

  async getTodayStatus(empleadoId: number) {
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
    return await this.asistenciaRepository.find({ where: { empleadoId: id }, order: { fecha: 'DESC' } });
  }

  async getTeamAttendance(supId: number, fecha?: string) {
    const equipo = await this.empleadoRepository.find({ where: { supervisorId: supId, activo: true } });
    if (equipo.length === 0) return [];
    const date = fecha ? new Date(fecha) : new Date();
    date.setHours(0,0,0,0);
    const regs = await this.asistenciaRepository.find({ where: { empleadoId: In(equipo.map(e => e.empleadoId)), fecha: date as any } });
    return equipo.map(emp => ({ ...emp, nombreCompleto: this.sanitizeString(`${emp.nombres} ${emp.apellidos}`), asistencia: regs.find(r => r.empleadoId === emp.empleadoId) || null }));
  }

  async getAllAttendance(s?: string, e?: string) {
    return await this.asistenciaRepository.find({ where: { fecha: Between(new Date(s), new Date(e || s)) as any }, relations: ['empleado'] });
  }

  async adjustAttendance(id: number, dto: any, user: number) {
    let asis = id === 0 ? this.asistenciaRepository.create({ empleadoId: dto.empleadoId, fecha: new Date(dto.fecha) }) : await this.asistenciaRepository.findOne({ where: { asistenciaId: id } });
    if (!asis) throw new NotFoundException('No encontrado');

    // Aplicar los cambios del DTO al registro
    Object.assign(asis, dto);

    return await this.asistenciaRepository.save(asis);
  }

  async getAdjustmentHistory() { return this.ajusteRepository.find({ relations: ['asistencia', 'asistencia.empleado', 'usuario'], order: { fechaHora: 'DESC' }, take: 200 }); }

  private sanitizeString(s: string | null): string {
    if (!s) return '';
    return s.replace(/Rodr\?guez/g, 'Rodríguez').replace(/Mart\?nez/g, 'Martínez').replace(/Garc\?a/g, 'García').replace(/L\?pez/g, 'López').replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ');
  }

  private calculateHours(s: any, e: any): number {
    const d = new Date(e).getTime() - new Date(s).getTime();
    return Math.round((d / 3600000) * 100) / 100;
  }
}
