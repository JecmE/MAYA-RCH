import { PlanillaEmpleado } from './planilla-empleado.entity';
export declare class PeriodoPlanilla {
    periodoId: number;
    nombre: string;
    fecha_inicio: Date;
    fecha_fin: Date;
    tipo: string;
    estado: string;
    planillasEmpleado: PlanillaEmpleado[];
    static TIPO_SEMANAL: string;
    static TIPO_QUINCENAL: string;
    static TIPO_MENSUAL: string;
    static ESTADO_ABIERTO: string;
    static ESTADO_CERRADO: string;
    static ESTADO_PROCESADO: string;
}
