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
    getHistory(req: any, fechaInicio?: string, fechaFin?: string): Promise<{
        asistenciaId: number;
        fecha: Date;
        horaEntradaReal: Date;
        horaSalidaReal: Date;
        minutosTardia: number;
        horasTrabajadas: number;
        estadoJornada: string;
        observacion: string;
    }[]>;
    getEmployeeHistory(id: number, fechaInicio?: string, fechaFin?: string): Promise<{
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
    getTeamAttendance(req: any, fecha?: string): Promise<{
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
    getAllAttendance(fecha?: string): Promise<{
        empleadoId: number;
        nombreCompleto: string;
        codigoEmpleado: string;
        departamento: string;
        puesto: string;
        turno: string;
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
}
