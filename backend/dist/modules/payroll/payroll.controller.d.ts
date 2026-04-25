import { PayrollService } from './payroll.service';
export declare class PayrollController {
    private readonly payrollService;
    constructor(payrollService: PayrollService);
    getPeriods(): Promise<import("../../entities").PeriodoPlanilla[]>;
    createPeriod(createDto: any, req: any): Promise<{
        periodoId: number;
        nombre: string;
    }>;
    calculatePayroll(id: number, req: any): Promise<{
        mensaje: string;
    }>;
    closePeriod(id: number, req: any): Promise<{
        message: string;
    }>;
    getMyPaycheck(req: any, periodoId?: number): Promise<{
        message: string;
        periodo?: undefined;
        montoBruto?: undefined;
        totalBonificaciones?: undefined;
        totalDeducciones?: undefined;
        montoNeto?: undefined;
        movimientos?: undefined;
    } | {
        periodo: {
            nombre: string;
            fechaInicio: Date;
            fechaFin: Date;
        };
        montoBruto: number;
        totalBonificaciones: number;
        totalDeducciones: number;
        montoNeto: number;
        movimientos: {
            concepto: string;
            tipo: string;
            monto: number;
        }[];
        message?: undefined;
    }>;
    getMyPeriods(req: any): Promise<import("../../entities").PeriodoPlanilla[]>;
    getConcepts(): Promise<import("../../entities").ConceptoPlanilla[]>;
    seedTestData(): Promise<{
        message: string;
    }>;
}
