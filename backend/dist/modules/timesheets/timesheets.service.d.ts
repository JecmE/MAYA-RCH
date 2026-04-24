import { Repository } from 'typeorm';
import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { Empleado } from '../../entities/empleado.entity';
import { AprobacionTiempo } from '../../entities/aprobacion-tiempo.entity';
import { AuditLog } from '../../entities/audit-log.entity';
export declare class TimesheetsService {
    private tiempoRepository;
    private proyectoRepository;
    private empleadoRepository;
    private aprobacionRepository;
    private auditRepository;
    constructor(tiempoRepository: Repository<RegistroTiempo>, proyectoRepository: Repository<Proyecto>, empleadoRepository: Repository<Empleado>, aprobacionRepository: Repository<AprobacionTiempo>, auditRepository: Repository<AuditLog>);
    getMyTimesheets(empleadoId: number, fecha_inicio?: string, fecha_fin?: string, proyectoId?: number): Promise<{
        tiempoId: number;
        empleadoId: number;
        fecha: string;
        proyectoId: number;
        proyectoNombre: string;
        proyectoCodigo: string;
        horas: number;
        horasValidadas: number;
        actividadDescripcion: string;
        estado: string;
        fechaRegistro: Date;
        comentario: string;
        decision: string;
    }[]>;
    createEntry(createDto: any, empleadoId: number): Promise<{
        tiempoId: number;
        estado: string;
        mensaje: string;
    }>;
    getTeamTimesheets(supervisorEmpleadoId: number, fecha_inicio?: string, fecha_fin?: string): Promise<{
        tiempoId: number;
        empleado: {
            empleadoId: number;
            nombreCompleto: string;
            codigoEmpleado: string;
        };
        proyecto: {
            proyectoId: number;
            nombre: string;
        };
        fecha: string;
        horas: number;
        horasValidadas: number;
        actividadDescripcion: string;
        estado: string;
    }[]>;
    approve(id: number, comentario: string, usuarioId: number): Promise<{
        message: string;
    }>;
    reject(id: number, comentario: string, usuarioId: number): Promise<{
        message: string;
    }>;
    getProjectSummary(fecha_inicio: string, fecha_fin: string): Promise<{
        proyecto: any;
        totalHoras: any;
        empleados: unknown[];
    }[]>;
}
