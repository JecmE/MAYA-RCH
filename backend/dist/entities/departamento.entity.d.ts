import { Proyecto } from './proyecto.entity';
export declare class Departamento {
    departamentoId: number;
    nombre: string;
    descripcion: string;
    activo: boolean;
    proyectos: Proyecto[];
}
