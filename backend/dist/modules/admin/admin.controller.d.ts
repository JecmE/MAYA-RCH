import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getShifts(): Promise<import("../../entities").Turno[]>;
    createShift(createDto: any, req: any): Promise<import("../../entities").Turno[]>;
    updateShift(id: number, updateDto: any, req: any): Promise<import("../../entities").Turno[]>;
    deactivateShift(id: number, req: any): Promise<{
        message: string;
    }>;
    getAssignments(): Promise<import("../../entities").EmpleadoTurno[]>;
    assignShift(assignDto: any, req: any): Promise<import("../../entities").EmpleadoTurno[]>;
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
    updateBonusRule(id: number, updateDto: any, req: any): Promise<import("../../entities").ReglaBono[]>;
    deleteBonusRule(id: number, req: any): Promise<import("../../entities").ReglaBono[]>;
    getAuditLogs(fechaInicio?: string, fechaFin?: string, usuarioId?: number, modulo?: string): Promise<import("../../entities").AuditLog[]>;
    getRoles(): Promise<import("../../entities").Rol[]>;
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
