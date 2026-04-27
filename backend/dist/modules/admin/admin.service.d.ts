import { OnModuleInit } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Turno } from '../../entities/turno.entity';
import { EmpleadoTurno } from '../../entities/empleado-turno.entity';
import { TipoPermiso } from '../../entities/tipo-permiso.entity';
import { ParametroSistema } from '../../entities/parametro-sistema.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { Rol } from '../../entities/rol.entity';
import { ReglaBono } from '../../entities/regla-bono.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Empleado } from '../../entities/empleado.entity';
import { SolicitudPermiso } from '../../entities/solicitud-permiso.entity';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { KpiMensual } from '../../entities/kpi-mensual.entity';
import { VacacionMovimiento } from '../../entities/vacacion-movimiento.entity';
import { VacacionSaldo } from '../../entities/vacacion-saldo.entity';
import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { BonoResultado } from '../../entities/bono-resultado.entity';
import { RolPermiso } from '../../entities/rol-permiso.entity';
import { KpiService } from '../kpi/kpi.service';
export declare class AdminService implements OnModuleInit {
    private turnoRepository;
    private empleadoTurnoRepository;
    private tipoPermisoRepository;
    private parametroRepository;
    private auditRepository;
    private rolRepository;
    private reglaBonoRepository;
    private usuarioRepository;
    private empleadoRepository;
    private solicitudPermisoRepository;
    private registroAsistenciaRepository;
    private kpiMensualRepository;
    private vacacionMovimientoRepository;
    private vacacionSaldoRepository;
    private registroTiempoRepository;
    private bonoResultadoRepository;
    private rolPermisoRepository;
    private dataSource;
    private kpiService;
    private readonly DEFAULT_MODULES;
    constructor(turnoRepository: Repository<Turno>, empleadoTurnoRepository: Repository<EmpleadoTurno>, tipoPermisoRepository: Repository<TipoPermiso>, parametroRepository: Repository<ParametroSistema>, auditRepository: Repository<AuditLog>, rolRepository: Repository<Rol>, reglaBonoRepository: Repository<ReglaBono>, usuarioRepository: Repository<Usuario>, empleadoRepository: Repository<Empleado>, solicitudPermisoRepository: Repository<SolicitudPermiso>, registroAsistenciaRepository: Repository<RegistroAsistencia>, kpiMensualRepository: Repository<KpiMensual>, vacacionMovimientoRepository: Repository<VacacionMovimiento>, vacacionSaldoRepository: Repository<VacacionSaldo>, registroTiempoRepository: Repository<RegistroTiempo>, bonoResultadoRepository: Repository<BonoResultado>, rolPermisoRepository: Repository<RolPermiso>, dataSource: DataSource, kpiService: KpiService);
    onModuleInit(): Promise<void>;
    private ensureCorrectTableStructures;
    logAction(dto: {
        modulo: string;
        accion: string;
        entidad: string;
        entidadId?: number;
        detalle: string;
    }, uid: number): Promise<{
        usuarioId: number;
        fechaHora: Date;
        modulo: string;
        accion: string;
        entidad: string;
        entidadId?: number;
        detalle: string;
    } & AuditLog>;
    getKpiParameters(): Promise<{}>;
    updateKpiParameters(dto: any, uid: number): Promise<{}>;
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
    createUser(dto: any, uid: number): Promise<{
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
    updateUser(id: number, dto: any, uid: number): Promise<{
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
    updateUserStatus(id: number, status: string, uid: number): Promise<{
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
    invalidateUserSession(id: number, uid: number): Promise<{
        message: string;
    }>;
    resetPassword(id: number, uid: number): Promise<{
        message: string;
    }>;
    getActiveSessions(): Promise<{
        id: number;
        usuario: string;
        ip: string;
        dispositivo: string;
        ultimoAcceso: string;
        estado: string;
    }[]>;
    getRoles(): Promise<Rol[]>;
    getRolePermissions(rolId: number): Promise<RolPermiso[]>;
    updateRolePermissions(rolId: number, perms: any[], uid: number): Promise<RolPermiso[]>;
    createRole(dto: any, uid: number): Promise<Rol[]>;
    deleteRole(id: number, uid: number): Promise<{
        message: string;
    }>;
    getShifts(): Promise<Turno[]>;
    createShift(dto: any, uid: number): Promise<Turno[]>;
    updateShift(id: number, dto: any, uid: number): Promise<Turno>;
    deactivateShift(id: number, uid: number): Promise<import("typeorm").UpdateResult>;
    getAssignments(): Promise<{
        id: number;
        empleadoNombre: string;
        turnoNombre: string;
        fechaInicio: Date;
        activo: boolean;
    }[]>;
    assignShift(dto: any, uid: number): Promise<{
        id: number;
        empleadoNombre: string;
        turnoNombre: string;
        fechaInicio: Date;
        activo: boolean;
    }[]>;
    getBonusRules(): Promise<ReglaBono[]>;
    createBonusRule(dto: any, uid: number): Promise<ReglaBono[]>;
    updateBonusRule(id: number, dto: any, uid: number): Promise<ReglaBono>;
    deleteBonusRule(id: number, uid: number): Promise<import("typeorm").UpdateResult>;
    runBonusEvaluation(mes: number, anio: number, uid: number): Promise<{
        message: string;
    }>;
    getAuditLogs(fi?: string, ff?: string, uid?: number, mod?: string): Promise<AuditLog[]>;
    getAdminDashboardStats(): Promise<{
        usuariosActivos: number;
        usuariosBloqueados: number;
        eventosAuditoria: number;
        intentosFallidos: number;
        sesionesActivas: number;
        estadoSistema: string;
    }>;
    getRrhhDashboardStats(): Promise<{
        empleadosActivos: number;
        tardiasHoy: number;
        permisosPendientes: number;
        vacacionesActivas: number;
        empleadosEnRiesgo: number;
        elegiblesBono: number;
    }>;
    getSupervisorDashboardStats(sid: number): Promise<{
        empleadosACargo: number;
        permisosPendientes: number;
        horasPendientes: number;
        kpiPromedio: number;
    }>;
}
