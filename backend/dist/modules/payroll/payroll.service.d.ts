import { Repository } from 'typeorm';
import { PeriodoPlanilla } from '../../entities/periodo-planilla.entity';
import { PlanillaEmpleado } from '../../entities/planilla-empleado.entity';
import { ConceptoPlanilla } from '../../entities/concepto-planilla.entity';
import { MovimientoPlanilla } from '../../entities/movimiento-planilla.entity';
import { Empleado } from '../../entities/empleado.entity';
import { BonoResultado } from '../../entities/bono-resultado.entity';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { AuditLog } from '../../entities/audit-log.entity';
export declare class PayrollService {
    private periodoRepository;
    private planillaEmpleadoRepository;
    private conceptoRepository;
    private movimientoRepository;
    private empleadoRepository;
    private bonoRepository;
    private asistenciaRepository;
    private auditRepository;
    constructor(periodoRepository: Repository<PeriodoPlanilla>, planillaEmpleadoRepository: Repository<PlanillaEmpleado>, conceptoRepository: Repository<ConceptoPlanilla>, movimientoRepository: Repository<MovimientoPlanilla>, empleadoRepository: Repository<Empleado>, bonoRepository: Repository<BonoResultado>, asistenciaRepository: Repository<RegistroAsistencia>, auditRepository: Repository<AuditLog>);
    createPeriod(createDto: any, usuarioId: number): Promise<{
        periodoId: number;
        nombre: string;
    }>;
    calculatePayroll(periodoId: number, usuarioId: number): Promise<{
        mensaje: string;
    }>;
    closePeriod(periodoId: number, usuarioId: number): Promise<{
        message: string;
    }>;
    getMyPaycheck(empleadoId: number, periodoId?: number): Promise<{
        message: string;
        periodo?: undefined;
        montoBruto?: undefined;
        totalBonificaciones?: undefined;
        totalDeducciones?: undefined;
        montoNeto?: undefined;
        movimientos?: undefined;
    } | {
        periodo: {
            nombre: string;
            fechaInicio: Date;
            fechaFin: Date;
        };
        montoBruto: number;
        totalBonificaciones: number;
        totalDeducciones: number;
        montoNeto: number;
        movimientos: {
            concepto: string;
            tipo: string;
            monto: number;
        }[];
        message?: undefined;
    }>;
    getMyPeriods(empleadoId: number): Promise<PeriodoPlanilla[]>;
    getPeriods(): Promise<PeriodoPlanilla[]>;
    getConcepts(): Promise<ConceptoPlanilla[]>;
    seedTestData(): Promise<{
        message: string;
    }>;
    private dataSourceQuery;
}
