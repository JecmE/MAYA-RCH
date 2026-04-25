import { Empleado } from './empleado.entity';
import { ReglaBono } from './regla-bono.entity';
export declare class BonoResultado {
    bonoResultadoId: number;
    empleadoId: number;
    reglaBonoId: number;
    mes: number;
    anio: number;
    elegible: boolean;
    cumplimientoPct: number;
    motivoNoElegible: string;
    fechaCalculo: Date;
    empleado: Empleado;
    reglaBono: ReglaBono;
}
