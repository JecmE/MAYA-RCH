import { Usuario } from './usuario.entity';
export declare class Rol {
    rolId: number;
    nombre: string;
    descripcion: string;
    usuarios: Usuario[];
    static ROL_EMPLEADO: string;
    static ROL_SUPERVISOR: string;
    static ROL_RRHH: string;
    static ROL_ADMIN: string;
}
