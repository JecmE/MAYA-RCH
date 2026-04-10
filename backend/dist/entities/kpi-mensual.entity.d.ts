import { Empleado } from './empleado.entity';
export declare class KpiMensual {
    kpiId: number;
    empleadoId: number;
    anio: number;
    mes: number;
    diasEsperados: number;
    diasTrabajados: number;
    tardias: number;
    faltas: number;
    horasEsperadas: number;
    horasTrabajadas: number;
    cumplimientoPct: number;
    clasificacion: string;
    fechaCalculo: Date;
    empleado: Empleado;
    static CLASIFICACION_EXCELENTE: string;
    static CLASIFICACION_BUENO: string;
    static CLASIFICACION_OBSERVACION: string;
    static CLASIFICACION_RIESGO: string;
}
