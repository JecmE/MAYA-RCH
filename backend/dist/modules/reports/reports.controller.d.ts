import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getMonthlyAttendance(mes: number, anio: number): Promise<any[]>;
    getBonusEligibility(mes: number, anio: number): Promise<any>;
    getProjectHours(fechaInicio: string, fechaFin: string): Promise<any[]>;
}
