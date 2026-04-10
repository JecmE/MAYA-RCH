import { Empleado } from './empleado.entity';
import { EmpleadoTurno } from './empleado-turno.entity';
import { AjusteAsistencia } from './ajuste-asistencia.entity';
export declare class RegistroAsistencia {
    asistenciaId: number;
    empleadoId: number;
    empleadoTurnoId: number;
    fecha: Date;
    horaEntradaReal: Date;
    horaSalidaReal: Date;
    minutosTardia: number;
    horasTrabajadas: number;
    estadoJornada: string;
    observacion: string;
    empleado: Empleado;
    empleadoTurno: EmpleadoTurno;
    ajustes: AjusteAsistencia[];
    static ESTADO_COMPLETADA: string;
    static ESTADO_INCOMPLETA: string;
    static ESTADO_PENDIENTE: string;
}
