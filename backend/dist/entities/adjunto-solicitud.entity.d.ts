import { SolicitudPermiso } from './solicitud-permiso.entity';
export declare class AdjuntoSolicitud {
    adjuntoId: number;
    solicitudId: number;
    nombreArchivo: string;
    rutaUrl: string;
    tipoMime: string;
    fechaSubida: Date;
    solicitud: SolicitudPermiso;
}
