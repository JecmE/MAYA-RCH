import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getMonthlyAttendance(fechaInicio: string, fechaFin: string, departamento?: string): Promise<any>;
    getBonusEligibility(mes?: number, anio?: number, fechaInicio?: string, fechaFin?: string, departamento?: string, proyecto?: string): Promise<any>;
    getProjectHours(fechaInicio: string, fechaFin: string, departamento?: string, proyecto?: string): Promise<any>;
    getVacationBalances(fechaInicio: string, fechaFin: string, departamento?: string, proyecto?: string): Promise<any>;
    getDepartments(): Promise<unknown[]>;
}
