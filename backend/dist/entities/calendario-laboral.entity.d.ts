import { ParametroSistema } from './parametro-sistema.entity';
export declare class CalendarioLaboral {
    calendarioLaboralId: number;
    parametroId: number;
    vacCuentaSabados: boolean;
    vacCuentaDomingos: boolean;
    vacCuentaFeriados: boolean;
    vacFeriadosLista: string;
    parametro: ParametroSistema;
}
