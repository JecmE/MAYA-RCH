import { EmpleadoTurno } from './empleado-turno.entity';
export declare class Turno {
    turnoId: number;
    nombre: string;
    horaEntrada: string;
    horaSalida: string;
    toleranciaMinutos: number;
    horasEsperadasDia: number;
    dias: string;
    activo: boolean;
    empleadoTurnos: EmpleadoTurno[];
}
