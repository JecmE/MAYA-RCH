import { RegistroTiempo } from './registro-tiempo.entity';
import { Usuario } from './usuario.entity';
export declare class AprobacionTiempo {
    aprobacionId: number;
    tiempoId: number;
    usuarioId: number;
    decision: string;
    comentario: string;
    fechaHora: Date;
    registroTiempo: RegistroTiempo;
    usuario: Usuario;
    static DECISION_APROBADO: string;
    static DECISION_RECHAZADO: string;
}
