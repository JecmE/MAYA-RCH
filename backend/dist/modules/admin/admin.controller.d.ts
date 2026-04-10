import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getShifts(): Promise<{
        turnoId: number;
        nombre: string;
        horaEntrada: string;
        horaSalida: string;
        toleranciaMinutos: number;
        horasEsperadasDia: number;
    }[]>;
    createShift(createDto: any, req: any): Promise<{
        turnoId: number;
        nombre: string;
        horaEntrada: string;
        horaSalida: string;
        toleranciaMinutos: number;
        horasEsperadasDia: number;
    }[]>;
    updateShift(id: number, updateDto: any, req: any): Promise<{
        turnoId: number;
        nombre: string;
        horaEntrada: string;
        horaSalida: string;
        toleranciaMinutos: number;
        horasEsperadasDia: number;
    }[]>;
    deactivateShift(id: number, req: any): Promise<{
        message: string;
    }>;
    getKpiParameters(): Promise<any>;
    updateKpiParameters(updateDto: any, req: any): Promise<any>;
    getBonusRules(): Promise<{
        reglaBonoId: number;
        nombre: string;
        activo: boolean;
        minDiasTrabajados: number;
        maxTardias: number;
        maxFaltas: number;
        minHoras: number;
        vigenciaInicio: Date;
        vigenciaFin: Date;
    }[]>;
    createBonusRule(createDto: any, req: any): Promise<{
        reglaBonoId: number;
        nombre: string;
        activo: boolean;
        minDiasTrabajados: number;
        maxTardias: number;
        maxFaltas: number;
        minHoras: number;
        vigenciaInicio: Date;
        vigenciaFin: Date;
    }[]>;
    getAuditLogs(fechaInicio?: string, fechaFin?: string, usuarioId?: number, modulo?: string): Promise<{
        auditId: number;
        fechaHora: Date;
        usuario: string;
        modulo: string;
        accion: string;
        entidad: string;
        entidadId: number;
        detalle: string;
    }[]>;
    getRoles(): Promise<{
        rolId: number;
        nombre: string;
        descripcion: string;
    }[]>;
}
