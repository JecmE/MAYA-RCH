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
import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { BonoResultado } from '../../entities/bono-resultado.entity';
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
    private registroTiempoRepository;
    private bonoResultadoRepository;
    private dataSource;
    constructor(turnoRepository: Repository<Turno>, empleadoTurnoRepository: Repository<EmpleadoTurno>, tipoPermisoRepository: Repository<TipoPermiso>, parametroRepository: Repository<ParametroSistema>, auditRepository: Repository<AuditLog>, rolRepository: Repository<Rol>, reglaBonoRepository: Repository<ReglaBono>, usuarioRepository: Repository<Usuario>, empleadoRepository: Repository<Empleado>, solicitudPermisoRepository: Repository<SolicitudPermiso>, registroAsistenciaRepository: Repository<RegistroAsistencia>, kpiMensualRepository: Repository<KpiMensual>, vacacionMovimientoRepository: Repository<VacacionMovimiento>, registroTiempoRepository: Repository<RegistroTiempo>, bonoResultadoRepository: Repository<BonoResultado>, dataSource: DataSource);
    onModuleInit(): Promise<void>;
    private ensureCorrectTableStructures;
    getShifts(): Promise<Turno[]>;
    createShift(dto: any, uid: number): Promise<Turno[]>;
    updateShift(id: number, dto: any, uid: number): Promise<Turno[]>;
    deactivateShift(id: number, uid: number): Promise<{
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
    assignShift(dto: any, uid: number): Promise<{
        id: number;
        empleadoId: number;
        empleadoNombre: string;
        turnoId: number;
        turnoNombre: string;
        fechaInicio: Date;
        fechaFin: Date;
        activo: boolean;
    }[]>;
    getBonusRules(): Promise<ReglaBono[]>;
    createBonusRule(dto: any, uid: number): Promise<ReglaBono[]>;
    updateBonusRule(id: number, dto: any, uid: number): Promise<ReglaBono[]>;
    deleteBonusRule(id: number, uid: number): Promise<ReglaBono[]>;
    runBonusEvaluation(mes: number, anio: number, usuarioId: number): Promise<{
        message: string;
    }>;
    getAuditLogs(fi?: string, ff?: string, uid?: number, mod?: string): Promise<AuditLog[]>;
    getAdminDashboardStats(): Promise<{
        usuariosActivos: number;
        usuariosBloqueados: number;
        eventosAuditoria: number;
        estadoSistema: string;
    }>;
    getRrhhDashboardStats(): Promise<{
        empleadosActivos: number;
        tardiasHoy: number;
        permisosPendientes: number;
        vacacionesActivas: number;
        empleadosEnRiesgo: number;
        empleadosConTurnoInactivo: number;
    }>;
    getSupervisorDashboardStats(sid: number): Promise<{
        empleadosACargo: number;
        permisosPendientes: number;
        horasPendientes: number;
        kpiPromedio: number;
    }>;
    getRoles(): Promise<Rol[]>;
    getKpiParameters(): Promise<{}>;
    updateKpiParameters(dto: any, uid: number): Promise<{}>;
}
