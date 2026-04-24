import { LeavesService } from './leaves.service';
export declare class LeavesController {
    private readonly leavesService;
    constructor(leavesService: LeavesService);
    getTypes(todos?: string): Promise<{
        nombre: string;
        tipoPermisoId: number;
        requiereDocumento: boolean;
        descuentaVacaciones: boolean;
        activo: boolean;
        solicitudes: import("../../entities").SolicitudPermiso[];
    }[]>;
    createType(dto: any, req: any): Promise<import("../../entities").TipoPermiso>;
    updateType(id: number, dto: any, req: any): Promise<any>;
    getAllRequests(): Promise<{
        empleadoNombre: string;
        departamento: string;
        tipoPermisoNombre: string;
        diasSolicitados: number;
        diasDisponibles: number;
        solicitudId: number;
        empleadoId: number;
        tipoPermisoId: number;
        fechaInicio: Date;
        fechaFin: Date;
        horasInicio: string;
        horasFin: string;
        motivo: string;
        estado: string;
        fechaSolicitud: Date;
        empleado: import("../../entities").Empleado;
        tipoPermiso: import("../../entities").TipoPermiso;
        decisiones: import("../../entities").DecisionPermiso[];
        adjuntos: import("../../entities").AdjuntoSolicitud[];
        vacacionMovimientos: import("../../entities").VacacionMovimiento[];
    }[]>;
    getAllBalances(): Promise<{
        empleadoNombre: string;
        departamento: string;
        saldoId: number;
        empleadoId: number;
        diasDisponibles: number;
        diasUsados: number;
        fechaCorte: Date;
        empleado: import("../../entities").Empleado;
    }[]>;
    getMovements(): Promise<{
        empleadoNombre: string;
        movimientoId: number;
        empleadoId: number;
        solicitudId: number;
        tipo: string;
        dias: number;
        fecha: Date;
        comentario: string;
        empleado: import("../../entities").Empleado;
        solicitud: import("../../entities").SolicitudPermiso;
    }[]>;
    createRequest(createDto: any, req: any): Promise<{
        solicitudId: number;
        estado: string;
    }>;
    getMyRequests(req: any): Promise<import("../../entities").SolicitudPermiso[]>;
    getPending(req: any): Promise<import("../../entities").SolicitudPermiso[]>;
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
        diasTotales: number;
    }>;
    getEmployeeVacationBalance(employeeId: number): Promise<{
        empleadoId: number;
        diasDisponibles: number;
        diasUsados: number;
        diasTotales: number;
    }>;
    adjustBalance(dto: any, req: any): Promise<{
        message: string;
    }>;
    getAttachment(fileName: string, res: any): Promise<void>;
}
