import { Empleado } from './empleado.entity';
import { Proyecto } from './proyecto.entity';
import { AprobacionTiempo } from './aprobacion-tiempo.entity';
export declare class RegistroTiempo {
    tiempoId: number;
    empleadoId: number;
    proyectoId: number;
    fecha: string;
    horas: number;
    actividadDescripcion: string;
    estado: string;
    fechaRegistro: Date;
    horasValidadas: number;
    empleado: Empleado;
    proyecto: Proyecto;
    aprobaciones: AprobacionTiempo[];
    static ESTADO_PENDIENTE: string;
    static ESTADO_APROBADO: string;
    static ESTADO_RECHAZADO: string;
}
