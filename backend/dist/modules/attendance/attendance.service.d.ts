import { Repository, DataSource } from 'typeorm';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { Empleado } from '../../entities/empleado.entity';
import { EmpleadoTurno } from '../../entities/empleado-turno.entity';
import { Turno } from '../../entities/turno.entity';
import { AjusteAsistencia } from '../../entities/ajuste-asistencia.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { ParametroSistema } from '../../entities/parametro-sistema.entity';
import { KpiService } from '../kpi/kpi.service';
export declare class AttendanceService {
    private asistenciaRepository;
    private empleadoRepository;
    private empleadoTurnoRepository;
    private turnoRepository;
    private ajusteRepository;
    private auditRepository;
    private parametroRepository;
    private dataSource;
    private kpiService;
    constructor(asistenciaRepository: Repository<RegistroAsistencia>, empleadoRepository: Repository<Empleado>, empleadoTurnoRepository: Repository<EmpleadoTurno>, turnoRepository: Repository<Turno>, ajusteRepository: Repository<AjusteAsistencia>, auditRepository: Repository<AuditLog>, parametroRepository: Repository<ParametroSistema>, dataSource: DataSource, kpiService: KpiService);
    private getGlobalTolerance;
    private getEffectiveTolerance;
    registerEntry(empleadoId: number, usuarioId: number): Promise<{
        message: string;
        asistencia: RegistroAsistencia;
        minutosTardia: number;
    }>;
    registerExit(empleadoId: number, usuarioId: number): Promise<{
        message: string;
        asistencia: RegistroAsistencia;
    }>;
    private getShiftForDate;
    getTodayStatus(empleadoId: number): Promise<{
        estadoJornada: string;
        fecha: Date;
        tieneEntrada: boolean;
        tieneSalida: boolean;
        turnoNombre: string;
        toleranciaMinutos: number;
        horaEntradaTurno: string;
        horaSalidaTurno: string;
        mensajeEstado: string;
        asistenciaId?: undefined;
        horaEntradaReal?: undefined;
        horaSalidaReal?: undefined;
        minutosTardia?: undefined;
        horasTrabajadas?: undefined;
        observacion?: undefined;
    } | {
        asistenciaId: number;
        fecha: Date;
        horaEntradaReal: Date;
        horaSalidaReal: Date;
        minutosTardia: number;
        horasTrabajadas: number;
        estadoJornada: string;
        observacion: string;
        tieneEntrada: boolean;
        tieneSalida: boolean;
        turnoNombre: string;
        toleranciaMinutos: number;
        horaEntradaTurno: string;
        horaSalidaTurno: string;
        mensajeEstado?: undefined;
    }>;
    getHistory(empleadoId: number, fechaInicio?: string, fechaFin?: string): Promise<{
        asistenciaId: number;
        fecha: Date;
        horaEntradaReal: Date;
        horaSalidaReal: Date;
        minutosTardia: number;
        horasTrabajadas: number;
        estadoJornada: string;
        observacion: string;
    }[]>;
    adjustAttendance(asistenciaId: number, adjustDto: any, usuarioId: number): Promise<{
        message: string;
        asistencia: any;
    }>;
    getTeamAttendance(supervisorId: number, fecha?: string): Promise<{
        empleadoId: number;
        nombreCompleto: string;
        codigoEmpleado: string;
        departamento: string;
        puesto: string;
        asistencia: {
            asistenciaId: number;
            horaEntradaReal: Date;
            horaSalidaReal: Date;
            minutosTardia: number;
            horasTrabajadas: number;
            estadoJornada: string;
            observacion: string;
        };
    }[]>;
    getAllAttendance(fechaInicio?: string, fechaFin?: string): Promise<any[]>;
    getAdjustmentHistory(): Promise<AjusteAsistencia[]>;
    private sanitizeString;
    private formatTimeToString;
    private getTimeFromString;
    private calculateHours;
}
