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
        dias: string;
        activo: boolean;
    }[]>;
    createShift(createDto: any, req: any): Promise<{
        turnoId: number;
        nombre: string;
        horaEntrada: string;
        horaSalida: string;
        toleranciaMinutos: number;
        horasEsperadasDia: number;
        dias: string;
        activo: boolean;
    }[]>;
    updateShift(id: number, updateDto: any, req: any): Promise<{
        turnoId: number;
        nombre: string;
        horaEntrada: string;
        horaSalida: string;
        toleranciaMinutos: number;
        horasEsperadasDia: number;
        dias: string;
        activo: boolean;
    }[]>;
    deactivateShift(id: number, req: any): Promise<{
        message: string;
    }>;
    getAssignments(): Promise<{
        id: number;
        empleadoId: number;
        empleadoNombre: string;
        turnoId: number;
        turnoNombre: string;
        fechaInicio: Date;
        fechaFin: Date;
        activo: boolean;
    }[]>;
    assignShift(assignDto: any, req: any): Promise<{
        id: number;
        empleadoId: number;
        empleadoNombre: string;
        turnoId: number;
        turnoNombre: string;
        fechaInicio: Date;
        fechaFin: Date;
        activo: boolean;
    }[]>;
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
    getAdminDashboard(): Promise<{
        usuariosActivos: number;
        usuariosBloqueados: number;
        eventosAuditoria: number;
        estadoSistema: string;
    }>;
    getRrhhDashboard(): Promise<{
        empleadosActivos: number;
        tardiasHoy: number;
        permisosPendientes: number;
        vacacionesActivas: number;
        empleadosEnRiesgo: number;
        empleadosConTurnoInactivo: number;
    }>;
    getSupervisorDashboard(req: any): Promise<{
        empleadosACargo: number;
        permisosPendientes: number;
        horasPendientes: number;
        kpiPromedio: number;
    }>;
}
