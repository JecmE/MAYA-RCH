import { Departamento } from './departamento.entity';
import { EmpleadoProyecto } from './empleado-proyecto.entity';
import { RegistroTiempo } from './registro-tiempo.entity';
export declare class Proyecto {
    proyectoId: number;
    departamentoId: number;
    codigo: string;
    nombre: string;
    descripcion: string;
    activo: boolean;
    departamento: Departamento;
    empleadoProyectos: EmpleadoProyecto[];
    registrosTiempo: RegistroTiempo[];
}
