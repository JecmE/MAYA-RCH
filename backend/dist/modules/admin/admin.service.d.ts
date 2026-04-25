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
    createShift(createDto: any, usuarioId: number): Promise<Turno[]>;
    updateShift(id: number, updateDto: any, usuarioId: number): Promise<Turno[]>;
    deactivateShift(id: number, usuarioId: number): Promise<{
        message: string;
    }>;
    getBonusRules(): Promise<ReglaBono[]>;
    createBonusRule(createDto: any, usuarioId: number): Promise<ReglaBono[]>;
    updateBonusRule(id: number, updateDto: any, usuarioId: number): Promise<ReglaBono[]>;
    deleteBonusRule(id: number, usuarioId: number): Promise<ReglaBono[]>;
    runBonusEvaluation(mes: number, anio: number, usuarioId: number): Promise<{
        message: string;
    }>;
    getAuditLogs(fechaInicio?: string, fechaFin?: string, usuarioId?: number, modulo?: string): Promise<AuditLog[]>;
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
    getSupervisorDashboardStats(supervisorId: number): Promise<{
        empleadosACargo: number;
        permisosPendientes: number;
        horasPendientes: number;
        kpiPromedio: number;
    }>;
    getRoles(): Promise<Rol[]>;
    getAssignments(): Promise<EmpleadoTurno[]>;
    assignShift(dto: any, uid: number): Promise<EmpleadoTurno[]>;
    getKpiParameters(): Promise<{}>;
    updateKpiParameters(dto: any, uid: number): Promise<{}>;
    private sanitizeString;
}
