import { Empleado } from './empleado.entity';
import { Turno } from './turno.entity';
import { RegistroAsistencia } from './registro-asistencia.entity';
export declare class EmpleadoTurno {
    empleadoTurnoId: number;
    empleadoId: number;
    turnoId: number;
    fechaInicio: Date;
    fechaFin: Date;
    activo: boolean;
    empleado: Empleado;
    turno: Turno;
    registrosAsistencia: RegistroAsistencia[];
}
