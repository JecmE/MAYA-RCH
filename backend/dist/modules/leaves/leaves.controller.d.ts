import { LeavesService } from './leaves.service';
export declare class LeavesController {
    private readonly leavesService;
    constructor(leavesService: LeavesService);
    getTypes(): Promise<{
        tipoPermisoId: number;
        nombre: string;
        requiereDocumento: boolean;
        descuentaVacaciones: boolean;
    }[]>;
    createRequest(createDto: any, req: any): Promise<{
        solicitudId: number;
        estado: string;
        mensaje: string;
    }>;
    getMyRequests(req: any): Promise<{
        solicitudId: number;
        tipoPermiso: string;
        fechaInicio: Date;
        fechaFin: Date;
        horasInicio: string;
        horasFin: string;
        motivo: string;
        estado: string;
        fechaSolicitud: Date;
        decisiones: {
            decision: string;
            comentario: string;
            fechaHora: Date;
        }[];
        adjuntos: {
            adjuntoId: number;
            nombreArchivo: string;
            rutaUrl: string;
        }[];
    }[]>;
    getPending(req: any): Promise<any>;
    approve(id: number, body: any, req: any): Promise<{
        message: string;
    }>;
    reject(id: number, body: any, req: any): Promise<{
        message: string;
    }>;
    getVacationBalance(req: any): Promise<{
        empleadoId: number;
        diasDisponibles: number;
        diasUsados: number;
        diasLibres: number;
        diasTotales: number;
        fechaCorte: Date;
    }>;
    getEmployeeVacationBalance(employeeId: number): Promise<{
        empleadoId: number;
        diasDisponibles: number;
        diasUsados: number;
        diasLibres: number;
        diasTotales: number;
        fechaCorte: Date;
    }>;
    getAttachment(fileName: string, res: any): Promise<void>;
}
