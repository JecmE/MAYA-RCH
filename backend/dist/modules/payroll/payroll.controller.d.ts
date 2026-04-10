import { PayrollService } from './payroll.service';
export declare class PayrollController {
    private readonly payrollService;
    constructor(payrollService: PayrollService);
    getPeriods(): Promise<{
        periodoId: number;
        nombre: string;
        fechaInicio: Date;
        fechaFin: Date;
        tipo: string;
        estado: string;
    }[]>;
    createPeriod(createDto: any, req: any): Promise<{
        periodoId: number;
        nombre: string;
        estado: string;
        mensaje: string;
    }>;
    calculatePayroll(id: number, req: any): Promise<{
        mensaje: string;
        empleadosProcesados: number;
        resultados: any[];
    }>;
    closePeriod(id: number, req: any): Promise<{
        message: string;
    }>;
    getMyPaycheck(req: any, periodoId?: number): Promise<{
        message: string;
        periodo?: undefined;
        empleadoId?: undefined;
        tarifaHora?: undefined;
        horasPagables?: undefined;
        montoBruto?: undefined;
        totalBonificaciones?: undefined;
        totalDeducciones?: undefined;
        montoNeto?: undefined;
        movimientos?: undefined;
    } | {
        periodo: {
            nombre: any;
            fechaInicio: any;
            fechaFin: any;
        };
        empleadoId: any;
        tarifaHora: any;
        horasPagables: any;
        montoBruto: any;
        totalBonificaciones: any;
        totalDeducciones: any;
        montoNeto: any;
        movimientos: {
            concepto: string;
            tipo: string;
            monto: number;
        }[];
        message?: undefined;
    }>;
    getConcepts(): Promise<{
        conceptoId: number;
        codigo: string;
        nombre: string;
        tipo: string;
        modoCalculo: string;
        baseCalculo: number;
    }[]>;
}
