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
        cantidadEmpleados: number;
        resumen: {
            totalDiasTrabajados: number;
            totalTardias: number;
            promedioCumplimiento: number;
            comparacionMesAnterior?: undefined;
        };
        empleados: any[];
    } | {
        mes: number;
        anio: number;
        cantidadEmpleados: any;
        resumen: {
            totalDiasTrabajados: number;
            totalTardias: number;
            promedioCumplimiento: number;
            comparacionMesAnterior: number;
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
        empleadoId: number;
        nombreCompleto: string;
        clasificacion: string;
        cumplimientoPct: number;
        tardias: number;
        faltas: number;
    }[]>;
    getEmployeeProfile(id: number): Promise<{
        empleado: {
            nombreCompleto: string;
            puesto: string;
            departamento: string;
            email: string;
        };
        historialAsistencia: {
            fecha: Date;
            entrada: Date;
            salida: Date;
            estado: string;
        }[];
        horasPorProyecto: {
            nombre: string;
            horas: number;
        }[];
        solicitudesRecientes: {
            tipo: string;
            fecha_inicio: Date;
            fecha_fin: Date;
            estado: string;
        }[];
        kpiActual: {
            cumplimientoPct: number;
            clasificacion: string;
            tardias: number;
            faltas: number;
        };
        comparacionMesAnterior: number;
    }>;
}
