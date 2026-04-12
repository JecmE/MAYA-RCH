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
    getTiposPermiso(): Promise<{
        tipoPermisoId: number;
        nombre: string;
        requiereDocumento: boolean;
        descuentaVacaciones: boolean;
    }[]>;
    private calculateDays;
    createRequest(createDto: any, empleadoId: number): Promise<{
        solicitudId: number;
        estado: string;
        mensaje: string;
    }>;
    private saveAttachment;
    getAttachment(fileName: string, res: any): Promise<void>;
    getMyRequests(empleadoId: number): Promise<{
        solicitudId: number;
        tipoPermiso: string;
        fechaInicio: Date;
        fechaFin: Date;
        horasInicio: string;
        horasFin: string;
        motivo: string;
        estado: string;
        fechaSolicitud: Date;
        decisiones: {
            decision: string;
            comentario: string;
            fechaHora: Date;
        }[];
        adjuntos: {
            adjuntoId: number;
            nombreArchivo: string;
            rutaUrl: string;
        }[];
    }[]>;
    getPendingRequests(supervisorEmpleadoId: number): Promise<any>;
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
        diasLibres: number;
        diasTotales: number;
        fechaCorte: Date;
    }>;
}
