import { Empleado } from './empleado.entity';
import { SolicitudPermiso } from './solicitud-permiso.entity';
export declare class VacacionMovimiento {
    movimientoId: number;
    empleadoId: number;
    solicitudId: number;
    tipo: string;
    dias: number;
    fecha: Date;
    comentario: string;
    empleado: Empleado;
    solicitud: SolicitudPermiso;
    static TIPO_ACUMULACION: string;
    static TIPO_CONSUMO: string;
    static TIPO_AJUSTE: string;
}
