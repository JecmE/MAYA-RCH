import { AttendanceService } from './attendance.service';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    checkIn(req: any): Promise<{
        message: string;
        asistencia: import("../../entities").RegistroAsistencia;
        minutosTardia: number;
    }>;
    checkOut(req: any): Promise<{
        message: string;
        asistencia: import("../../entities").RegistroAsistencia;
    }>;
    getTodayStatus(req: any): Promise<{
        estadoJornada: string;
        fecha: Date;
        tieneEntrada: boolean;
        tieneSalida: boolean;
        turnoNombre: string;
        toleranciaMinutos: number;
        horaEntradaTurno: string;
        horaSalidaTurno: string;
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
    }>;
    getHistory(req: any, fecha_inicio?: string, fecha_fin?: string): Promise<{
        asistenciaId: number;
        fecha: Date;
        horaEntradaReal: Date;
        horaSalidaReal: Date;
        minutosTardia: number;
        horasTrabajadas: number;
        estadoJornada: string;
        observacion: string;
    }[]>;
    getEmployeeHistory(id: number, fecha_inicio?: string, fecha_fin?: string): Promise<{
        asistenciaId: number;
        fecha: Date;
        horaEntradaReal: Date;
        horaSalidaReal: Date;
        minutosTardia: number;
        horasTrabajadas: number;
        estadoJornada: string;
        observacion: string;
    }[]>;
    adjustAttendance(id: number, adjustDto: any, req: any): Promise<{
        message: string;
        asistencia: import("../../entities").RegistroAsistencia;
    }>;
    getTeamAttendance(req: any, fecha?: string): Promise<any>;
}
