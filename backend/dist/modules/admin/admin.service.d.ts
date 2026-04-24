import { Repository } from 'typeorm';
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
export declare class AdminService {
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
    constructor(turnoRepository: Repository<Turno>, empleadoTurnoRepository: Repository<EmpleadoTurno>, tipoPermisoRepository: Repository<TipoPermiso>, parametroRepository: Repository<ParametroSistema>, auditRepository: Repository<AuditLog>, rolRepository: Repository<Rol>, reglaBonoRepository: Repository<ReglaBono>, usuarioRepository: Repository<Usuario>, empleadoRepository: Repository<Empleado>, solicitudPermisoRepository: Repository<SolicitudPermiso>, registroAsistenciaRepository: Repository<RegistroAsistencia>, kpiMensualRepository: Repository<KpiMensual>, vacacionMovimientoRepository: Repository<VacacionMovimiento>, registroTiempoRepository: Repository<RegistroTiempo>);
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
    createShift(createDto: any, usuarioId: number): Promise<{
        turnoId: number;
        nombre: string;
        horaEntrada: string;
        horaSalida: string;
        toleranciaMinutos: number;
        horasEsperadasDia: number;
        dias: string;
        activo: boolean;
    }[]>;
    updateShift(id: number, updateDto: any, usuarioId: number): Promise<{
        turnoId: number;
        nombre: string;
        horaEntrada: string;
        horaSalida: string;
        toleranciaMinutos: number;
        horasEsperadasDia: number;
        dias: string;
        activo: boolean;
    }[]>;
    deactivateShift(id: number, usuarioId: number): Promise<{
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
    assignShift(assignDto: any, usuarioId: number): Promise<{
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
    updateKpiParameters(updateDto: any, usuarioId: number): Promise<any>;
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
    createBonusRule(createDto: any, usuarioId: number): Promise<{
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
}
