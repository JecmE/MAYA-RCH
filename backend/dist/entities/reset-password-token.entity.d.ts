import { Usuario } from './usuario.entity';
export declare class ResetPasswordToken {
    resetId: number;
    usuarioId: number;
    tokenHash: string;
    fechaCreacion: Date;
    fechaExpira: Date;
    usado: boolean;
    fechaUso: Date;
    ipSolicitud: string;
    userAgent: string;
    usuario: Usuario;
}
