import { Repository } from 'typeorm';
import { SolicitudPermiso } from '../../entities/solicitud-permiso.entity';
import { TipoPermiso } from '../../entities/tipo-permiso.entity';
import { DecisionPermiso } from '../../entities/decision-permiso.entity';
import { VacacionSaldo } from '../../entities/vacacion-saldo.entity';
import { VacacionMovimiento } from '../../entities/vacacion-movimiento.entity';
import { Empleado } from '../../entities/empleado.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { DataSource } from 'typeorm';
export declare class LeavesService {
    private solicitudRepository;
    private tipoPermisoRepository;
    private decisionRepository;
    private vacacionSaldoRepository;
    private vacacionMovimientoRepository;
    private empleadoRepository;
    private auditRepository;
    private dataSource;
    constructor(solicitudRepository: Repository<SolicitudPermiso>, tipoPermisoRepository: Repository<TipoPermiso>, decisionRepository: Repository<DecisionPermiso>, vacacionSaldoRepository: Repository<VacacionSaldo>, vacacionMovimientoRepository: Repository<VacacionMovimiento>, empleadoRepository: Repository<Empleado>, auditRepository: Repository<AuditLog>, dataSource: DataSource);
    getTiposPermiso(): Promise<{
        tipoPermisoId: number;
        nombre: string;
        requiereDocumento: boolean;
        descuentaVacaciones: boolean;
    }[]>;
    createRequest(createDto: any, empleadoId: number): Promise<{
        solicitudId: number;
        estado: string;
        mensaje: string;
    }>;
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
        diasTotales: number;
        fechaCorte: Date;
    }>;
    private calculateDays;
}
