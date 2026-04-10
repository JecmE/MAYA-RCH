import { Usuario } from './usuario.entity';
export declare class AuditLog {
    auditId: number;
    usuarioId: number;
    fechaHora: Date;
    modulo: string;
    accion: string;
    entidad: string;
    entidadId: number;
    detalle: string;
    usuario: Usuario;
}
