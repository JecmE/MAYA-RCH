import { BonoResultado } from './bono-resultado.entity';
export declare class ReglaBono {
    reglaBonoId: number;
    nombre: string;
    minDiasTrabajados: number;
    maxTardias: number;
    maxFaltas: number;
    minHoras: number;
    monto: number;
    vigenciaInicio: Date;
    vigenciaFin: Date;
    activo: boolean;
    resultados: BonoResultado[];
}
