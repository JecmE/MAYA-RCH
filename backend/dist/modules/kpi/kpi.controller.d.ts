import { KpiService } from './kpi.service';
export declare class KpiController {
    private readonly kpiService;
    constructor(kpiService: KpiService);
    getEmployeeDashboard(req: any, mes?: number, anio?: number): Promise<{
        mes: number;
        anio: number;
        diasEsperados: number;
        diasTrabajados: number;
        tardias: number;
        faltas: number;
        horasEsperadas: number;
        horasTrabajadas: number;
        cumplimientoPct: number;
        clasificacion: string;
    }>;
    getSupervisorDashboard(req: any, mes?: number, anio?: number): Promise<{
        mes: number;
        anio: number;
        cantidadEmpleados: any;
        resumen: {
            totalDiasTrabajados: number;
            totalTardias: number;
            promedioCumplimiento: number;
        };
        empleados: any;
    }>;
    getHrDashboard(mes?: number, anio?: number): Promise<{
        mes: number;
        anio: number;
        totalEmpleados: number;
        promedioCumplimiento: number;
        totalTardias: number;
        totalFaltas: number;
        clasificaciones: {
            Excelente: number;
            Bueno: number;
            'En observacion': number;
            'En riesgo': number;
        };
    }>;
    getEmployeeClassification(req: any, mes?: number, anio?: number): Promise<{
        clasificacion: string;
        cumplimientoPct: number;
        tardias: number;
        faltas: number;
    }>;
}
