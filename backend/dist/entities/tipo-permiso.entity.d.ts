import { SolicitudPermiso } from './solicitud-permiso.entity';
export declare class TipoPermiso {
    tipoPermisoId: number;
    nombre: string;
    requiereDocumento: boolean;
    descuentaVacaciones: boolean;
    activo: boolean;
    solicitudes: SolicitudPermiso[];
}
