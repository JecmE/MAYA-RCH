import { Empleado } from './empleado.entity';
import { Proyecto } from './proyecto.entity';
export declare class EmpleadoProyecto {
    empProyId: number;
    empleadoId: number;
    proyectoId: number;
    fecha_inicio: Date;
    fecha_fin: Date;
    activo: boolean;
    empleado: Empleado;
    proyecto: Proyecto;
}
