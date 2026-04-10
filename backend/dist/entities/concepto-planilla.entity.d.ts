import { MovimientoPlanilla } from './movimiento-planilla.entity';
export declare class ConceptoPlanilla {
    conceptoId: number;
    codigo: string;
    nombre: string;
    tipo: string;
    modoCalculo: string;
    baseCalculo: number;
    activo: boolean;
    movimientos: MovimientoPlanilla[];
    static TIPO_INGRESO: string;
    static TIPO_DEDUCCION: string;
    static MODO_FIJO: string;
    static MODO_PORCENTAJE: string;
    static MODO_HORAS: string;
}
