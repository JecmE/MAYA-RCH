import { TimesheetsService } from './timesheets.service';
export declare class TimesheetsController {
    private readonly timesheetsService;
    constructor(timesheetsService: TimesheetsService);
    getMyTimesheets(req: any, fechaInicio?: string, fechaFin?: string, proyectoId?: number): Promise<{
        tiempoId: number;
        fecha: Date;
        proyecto: {
            proyectoId: number;
            nombre: string;
            codigo: string;
        };
        horas: number;
        horasValidadas: number;
        actividadDescripcion: string;
        estado: string;
        fechaRegistro: Date;
    }[]>;
    createEntry(createDto: any, req: any): Promise<{
        tiempoId: number;
        estado: string;
        mensaje: string;
    }>;
    getTeamTimesheets(req: any, fechaInicio?: string, fechaFin?: string): Promise<{
        tiempoId: number;
        empleado: {
            empleadoId: number;
            nombreCompleto: string;
            codigoEmpleado: string;
        };
        proyecto: {
            proyectoId: number;
            nombre: string;
        };
        fecha: Date;
        horas: number;
        horasValidadas: number;
        actividadDescripcion: string;
        estado: string;
    }[]>;
    approve(id: number, body: any, req: any): Promise<{
        message: string;
    }>;
    reject(id: number, body: any, req: any): Promise<{
        message: string;
    }>;
    getProjectSummary(fechaInicio: string, fechaFin: string): Promise<{
        proyecto: any;
        totalHoras: any;
        empleados: unknown[];
    }[]>;
}
