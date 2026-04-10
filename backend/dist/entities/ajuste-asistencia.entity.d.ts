import { RegistroAsistencia } from './registro-asistencia.entity';
import { Usuario } from './usuario.entity';
export declare class AjusteAsistencia {
    ajusteId: number;
    asistenciaId: number;
    usuarioId: number;
    campoModificado: string;
    valorAnterior: string;
    valorNuevo: string;
    motivo: string;
    fechaHora: Date;
    asistencia: RegistroAsistencia;
    usuario: Usuario;
}
