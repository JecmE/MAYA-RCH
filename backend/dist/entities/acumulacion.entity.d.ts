import { ParametroSistema } from './parametro-sistema.entity';
export declare class Acumulacion {
    acumulacionId: number;
    parametroId: number;
    vacDiasPorAnio: number;
    vacDiasPorMes: number;
    vacAcumulaDesdeFechaIngreso: boolean;
    vacMesesMinimosParaSolicitar: number;
    vacTopeAcumuladoDias: number;
    parametro: ParametroSistema;
}
