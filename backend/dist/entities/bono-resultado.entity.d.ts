import { Empleado } from './empleado.entity';
import { ReglaBono } from './regla-bono.entity';
export declare class BonoResultado {
    bonoResId: number;
    empleadoId: number;
    reglaBonoId: number;
    anio: number;
    mes: number;
    elegible: boolean;
    motivoNoElegible: string;
    fechaCalculo: Date;
    empleado: Empleado;
    reglaBono: ReglaBono;
}
