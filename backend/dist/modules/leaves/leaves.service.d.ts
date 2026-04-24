import { Repository } from 'typeorm';
import { SolicitudPermiso } from '../../entities/solicitud-permiso.entity';
import { TipoPermiso } from '../../entities/tipo-permiso.entity';
import { DecisionPermiso } from '../../entities/decision-permiso.entity';
import { VacacionSaldo } from '../../entities/vacacion-saldo.entity';
import { VacacionMovimiento } from '../../entities/vacacion-movimiento.entity';
import { Empleado } from '../../entities/empleado.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { AdjuntoSolicitud } from '../../entities/adjunto-solicitud.entity';
import { DataSource } from 'typeorm';
export declare class LeavesService {
    private solicitudRepository;
    private tipoPermisoRepository;
    private decisionRepository;
    private vacacionSaldoRepository;
    private vacacionMovimientoRepository;
    private empleadoRepository;
    private auditRepository;
    private adjuntoRepository;
    private dataSource;
    constructor(solicitudRepository: Repository<SolicitudPermiso>, tipoPermisoRepository: Repository<TipoPermiso>, decisionRepository: Repository<DecisionPermiso>, vacacionSaldoRepository: Repository<VacacionSaldo>, vacacionMovimientoRepository: Repository<VacacionMovimiento>, empleadoRepository: Repository<Empleado>, auditRepository: Repository<AuditLog>, adjuntoRepository: Repository<AdjuntoSolicitud>, dataSource: DataSource);
    getTiposPermiso(todos?: boolean): Promise<{
        nombre: string;
        tipoPermisoId: number;
        requiereDocumento: boolean;
        descuentaVacaciones: boolean;
        activo: boolean;
        solicitudes: SolicitudPermiso[];
    }[]>;
    createTipoPermiso(dto: any, usuarioId: number): Promise<TipoPermiso>;
    updateTipoPermiso(id: number, dto: any, usuarioId: number): Promise<any>;
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
        empleado: Empleado;
        tipoPermiso: TipoPermiso;
        decisiones: DecisionPermiso[];
        adjuntos: AdjuntoSolicitud[];
        vacacionMovimientos: VacacionMovimiento[];
    }[]>;
    getAllBalances(): Promise<{
        empleadoNombre: string;
        departamento: string;
        saldoId: number;
        empleadoId: number;
        diasDisponibles: number;
        diasUsados: number;
        fechaCorte: Date;
        empleado: Empleado;
    }[]>;
    getVacationMovements(): Promise<{
        empleadoNombre: string;
        movimientoId: number;
        empleadoId: number;
        solicitudId: number;
        tipo: string;
        dias: number;
        fecha: Date;
        comentario: string;
        empleado: Empleado;
        solicitud: SolicitudPermiso;
    }[]>;
    adjustVacationBalance(dto: any, usuarioId: number): Promise<{
        message: string;
    }>;
    private sanitizeString;
    private calculateDays;
    createRequest(createDto: any, empleadoId: number): Promise<{
        solicitudId: number;
        estado: string;
        mensaje: string;
    }>;
    private saveAttachment;
    getMyRequests(empleadoId: number): Promise<SolicitudPermiso[]>;
    getPendingRequests(supervisorEmpleadoId: number): Promise<SolicitudPermiso[]>;
    approveRequest(solicitudId: number, comentario: string, usuarioId: number): Promise<{
        message: string;
    }>;
    rejectRequest(solicitudId: number, comentario: string, usuarioId: number): Promise<{
        message: string;
    }>;
    getVacationBalance(empleadoId: number): Promise<{
        empleadoId: number;
        diasDisponibles: number;
        diasUsados: number;
        diasTotales: number;
    }>;
    getAttachment(fileName: string, res: any): Promise<void>;
}
