import { Empleado } from './empleado.entity';
import { TipoPermiso } from './tipo-permiso.entity';
import { DecisionPermiso } from './decision-permiso.entity';
import { AdjuntoSolicitud } from './adjunto-solicitud.entity';
import { VacacionMovimiento } from './vacacion-movimiento.entity';
export declare class SolicitudPermiso {
    solicitudId: number;
    empleadoId: number;
    tipoPermisoId: number;
    fechaInicio: Date;
    fechaFin: Date;
    horasInicio: string;
    horasFin: string;
    motivo: string;
    estado: string;
    fechaSolicitud: Date;
    empleado: Empleado;
    tipoPermiso: TipoPermiso;
    decisiones: DecisionPermiso[];
    adjuntos: AdjuntoSolicitud[];
    vacacionMovimientos: VacacionMovimiento[];
    static ESTADO_PENDIENTE: string;
    static ESTADO_APROBADO: string;
    static ESTADO_RECHAZADO: string;
    static ESTADO_CANCELADO: string;
}
