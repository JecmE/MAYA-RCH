import { BonoResultado } from './bono-resultado.entity';
export declare class ReglaBono {
    reglaBonoId: number;
    nombre: string;
    activo: boolean;
    minDiasTrabajados: number;
    maxTardias: number;
    maxFaltas: number;
    minHoras: number;
    vigenciaInicio: Date;
    vigenciaFin: Date;
    resultados: BonoResultado[];
}
