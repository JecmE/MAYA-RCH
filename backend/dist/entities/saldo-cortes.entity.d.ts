import { ParametroSistema } from './parametro-sistema.entity';
export declare class SaldoCortes {
    saldoCortesId: number;
    parametroId: number;
    vacCorteAnualFecha: string;
    vacPermiteArreoDias: boolean;
    vacMaxArreoDias: number;
    vacVenceArreoEnMeses: number;
    parametro: ParametroSistema;
}
