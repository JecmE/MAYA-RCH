import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getMonthlyAttendance(mes: number, anio: number): Promise<unknown[]>;
    getBonusEligibility(mes: number, anio: number): Promise<any>;
    getProjectHours(fecha_inicio: string, fecha_fin: string): Promise<{
        proyecto: any;
        totalHoras: any;
        empleados: unknown[];
    }[]>;
}
