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
        observacion: string;
    }>;
    getSupervisorDashboard(req: any, mes?: number, anio?: number): Promise<{
        mes: number;
        anio: number;
        cantidadEmpleados: number;
        resumen: {
            totalDiasTrabajados: number;
            totalTardias: number;
            promedioCumplimiento: number;
        };
        empleados: {
            empleadoId: number;
            nombreCompleto: string;
            diasEsperados: number;
            cumplimientoPct: number;
            clasificacion: string;
        }[];
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
            Regular: number;
            'En Riesgo': number;
        };
    }>;
    getEmployeeClassification(req: any, mes?: number, anio?: number): Promise<{
        empleadoId: number;
        clasificacion: string;
        cumplimientoPct: number;
    }[]>;
    getEmployeeProfile(id: number): Promise<{
        empleado: {
            nombreCompleto: string;
            puesto: string;
            departamento: string;
            email: string;
        };
        kpiActual: {
            cumplimientoPct: number;
            clasificacion: string;
            tardias: number;
            faltas: number;
        };
    }>;
    saveObservation(empleadoId: number, mes: number, anio: number, observacion: string): Promise<import("../../entities").KpiMensual>;
}
