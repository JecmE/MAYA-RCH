import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getMonthlyAttendance(fechaInicio: string, fechaFin: string, departamento?: string): Promise<any>;
    getBonusEligibility(mes?: number, anio?: number, fechaInicio?: string, fechaFin?: string, departamento?: string, proyecto?: string): Promise<any>;
    getProjectHours(fechaInicio: string, fechaFin: string, departamento?: string, proyecto?: string): Promise<any>;
    getVacationBalances(fechaInicio: string, fechaFin: string, departamento?: string, proyecto?: string): Promise<any>;
    getGlobalKpis(mes: number, anio: number, departamento?: string, supervisorId?: string): Promise<{
        summary: any;
        deptStats: any;
        teamStats: any;
        distStats: any;
        detail: any;
    }>;
    getSupervisors(): Promise<any>;
    getDepartments(): Promise<unknown[]>;
    getFunctionalAudit(fi?: string, ff?: string, modulo?: string, accion?: string): Promise<any>;
}
