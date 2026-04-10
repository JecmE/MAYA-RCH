import { SolicitudPermiso } from './solicitud-permiso.entity';
import { Usuario } from './usuario.entity';
export declare class DecisionPermiso {
    decisionId: number;
    solicitudId: number;
    usuarioId: number;
    decision: string;
    comentario: string;
    fechaHora: Date;
    solicitud: SolicitudPermiso;
    usuario: Usuario;
    static DECISION_APROBADO: string;
    static DECISION_RECHAZADO: string;
}
