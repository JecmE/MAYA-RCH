import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getShifts(): Promise<import("../../entities").Turno[]>;
    createShift(createDto: any, req: any): Promise<import("../../entities").Turno[]>;
    updateShift(id: number, updateDto: any, req: any): Promise<import("../../entities").Turno>;
    deactivateShift(id: number, req: any): Promise<import("typeorm").UpdateResult>;
    getAssignments(): Promise<{
        id: number;
        empleadoNombre: string;
        turnoNombre: string;
        fechaInicio: Date;
        activo: boolean;
    }[]>;
    assignShift(assignDto: any, req: any): Promise<{
        id: number;
        empleadoNombre: string;
        turnoNombre: string;
        fechaInicio: Date;
        activo: boolean;
    }[]>;
    getKpiParameters(): Promise<{}>;
    updateKpiParameters(updateDto: any, req: any): Promise<{}>;
    getBonusRules(): Promise<import("../../entities").ReglaBono[]>;
    createBonusRule(createDto: any, req: any): Promise<import("../../entities").ReglaBono[]>;
    runEvaluation(body: {
        mes: number;
        anio: number;
    }, req: any): Promise<{
        message: string;
    }>;
    updateBonusRule(id: number, updateDto: any, req: any): Promise<import("../../entities").ReglaBono>;
    deleteBonusRule(id: number, req: any): Promise<import("typeorm").UpdateResult>;
    getAuditLogs(fechaInicio?: string, fechaFin?: string, usuarioId?: number, modulo?: string): Promise<import("../../entities").AuditLog[]>;
    getRoles(): Promise<import("../../entities").Rol[]>;
    createRole(dto: any, req: any): Promise<import("../../entities").Rol[]>;
    deleteRole(id: number, req: any): Promise<{
        message: string;
    }>;
    getRolePermissions(id: number): Promise<import("../../entities/rol-permiso.entity").RolPermiso[]>;
    updateRolePermissions(id: number, perms: any[], req: any): Promise<import("../../entities/rol-permiso.entity").RolPermiso[]>;
    getAdminDashboard(): Promise<{
        usuariosActivos: number;
        usuariosBloqueados: number;
        eventosAuditoria: number;
        intentosFallidos: number;
        sesionesActivas: number;
        estadoSistema: string;
    }>;
    getRrhhDashboard(): Promise<{
        empleadosActivos: number;
        tardiasHoy: number;
        permisosPendientes: number;
        vacacionesActivas: number;
        empleadosEnRiesgo: number;
        elegiblesBono: number;
    }>;
    getSupervisorDashboard(req: any): Promise<{
        empleadosACargo: number;
        permisosPendientes: number;
        horasPendientes: number;
        kpiPromedio: number;
    }>;
    getUsers(): Promise<{
        usuarioId: number;
        username: string;
        email: string;
        nombreCompleto: string;
        estado: string;
        roles: string[];
        empleadoCodigo: string;
        empleadoId: number;
        supervisorId: number;
        supervisorNombre: string;
        ultimoIp: string;
    }[]>;
    createUser(dto: any, req: any): Promise<{
        usuarioId: number;
        username: string;
        email: string;
        nombreCompleto: string;
        estado: string;
        roles: string[];
        empleadoCodigo: string;
        empleadoId: number;
        supervisorId: number;
        supervisorNombre: string;
        ultimoIp: string;
    }[]>;
    updateUser(id: number, dto: any, req: any): Promise<{
        usuarioId: number;
        username: string;
        email: string;
        nombreCompleto: string;
        estado: string;
        roles: string[];
        empleadoCodigo: string;
        empleadoId: number;
        supervisorId: number;
        supervisorNombre: string;
        ultimoIp: string;
    }[]>;
    toggleUserStatus(id: number, body: {
        status: string;
    }, req: any): Promise<{
        usuarioId: number;
        username: string;
        email: string;
        nombreCompleto: string;
        estado: string;
        roles: string[];
        empleadoCodigo: string;
        empleadoId: number;
        supervisorId: number;
        supervisorNombre: string;
        ultimoIp: string;
    }[]>;
    resetPassword(id: number, req: any): Promise<{
        message: string;
    }>;
    invalidateSession(id: number, req: any): Promise<{
        message: string;
    }>;
    getSystemHealth(): Promise<{
        db: {
            status: string;
            latency: number;
            type: string;
            sizeMB: number;
            maxSizeMB: number;
        };
        server: {
            uptimeSeconds: number;
            cpuPercent: number;
            cpuCores: number;
            ramMB: number;
            totalRamMB: number;
        };
        incidents: {
            id: number;
            titulo: string;
            descripcion: string;
            hora: Date;
        }[];
        tasks: any[];
    }>;
    forceSync(req: any): Promise<{
        message: string;
    }>;
}
