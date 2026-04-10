import { Usuario } from './usuario.entity';
export declare class ParametroSistema {
    parametroId: number;
    usuarioIdActualiza: number;
    clave: string;
    valor: string;
    descripcion: string;
    activo: boolean;
    fechaActualizacion: Date;
    usuarioActualiza: Usuario;
}
