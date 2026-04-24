import { TimesheetsService } from './timesheets.service';
export declare class TimesheetsController {
    private readonly timesheetsService;
    constructor(timesheetsService: TimesheetsService);
    getMyTimesheets(req: any, fecha_inicio?: string, fecha_fin?: string, proyectoId?: number): Promise<{
        tiempoId: number;
        empleadoId: number;
        fecha: string;
        proyectoId: number;
        proyectoNombre: string;
        proyectoCodigo: string;
        horas: number;
        horasValidadas: number;
        actividadDescripcion: string;
        estado: string;
        fechaRegistro: Date;
        comentario: string;
        decision: string;
    }[]>;
    createEntry(createDto: any, req: any): Promise<{
        tiempoId: number;
        estado: string;
        mensaje: string;
    }>;
    getTeamTimesheets(req: any, fecha_inicio?: string, fecha_fin?: string): Promise<{
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
        fecha: string;
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
    getProjectSummary(fecha_inicio: string, fecha_fin: string): Promise<{
        proyecto: any;
        totalHoras: any;
        empleados: unknown[];
    }[]>;
}
