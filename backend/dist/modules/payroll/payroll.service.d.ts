import { Repository } from 'typeorm';
import { PeriodoPlanilla } from '../../entities/periodo-planilla.entity';
import { PlanillaEmpleado } from '../../entities/planilla-empleado.entity';
import { ConceptoPlanilla } from '../../entities/concepto-planilla.entity';
import { MovimientoPlanilla } from '../../entities/movimiento-planilla.entity';
import { TablaIsr } from '../../entities/tabla-isr.entity';
import { Empleado } from '../../entities/empleado.entity';
import { BonoResultado } from '../../entities/bono-resultado.entity';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { AuditLog } from '../../entities/audit-log.entity';
export declare class PayrollService {
    private periodoRepository;
    private planillaEmpleadoRepository;
    private conceptoRepository;
    private movimientoRepository;
    private isrRepository;
    private empleadoRepository;
    private bonoRepository;
    private asistenciaRepository;
    private auditRepository;
    constructor(periodoRepository: Repository<PeriodoPlanilla>, planillaEmpleadoRepository: Repository<PlanillaEmpleado>, conceptoRepository: Repository<ConceptoPlanilla>, movimientoRepository: Repository<MovimientoPlanilla>, isrRepository: Repository<TablaIsr>, empleadoRepository: Repository<Empleado>, bonoRepository: Repository<BonoResultado>, asistenciaRepository: Repository<RegistroAsistencia>, auditRepository: Repository<AuditLog>);
    getPeriods(): Promise<{
        periodoId: number;
        nombre: string;
        fechaInicio: Date;
        fechaFin: Date;
        tipo: string;
        estado: string;
    }[]>;
    createPeriod(createDto: any, usuarioId: number): Promise<{
        periodoId: number;
        nombre: string;
        estado: string;
        mensaje: string;
    }>;
    calculatePayroll(periodoId: number, usuarioId: number): Promise<{
        mensaje: string;
        empleadosProcesados: number;
        resultados: any[];
    }>;
    closePeriod(periodoId: number, usuarioId: number): Promise<{
        message: string;
    }>;
    getMyPaycheck(empleadoId: number, periodoId?: number): Promise<{
        message: string;
        periodo?: undefined;
        empleadoId?: undefined;
        tarifaHora?: undefined;
        horasPagables?: undefined;
        montoBruto?: undefined;
        totalBonificaciones?: undefined;
        totalDeducciones?: undefined;
        montoNeto?: undefined;
        movimientos?: undefined;
    } | {
        periodo: {
            nombre: any;
            fechaInicio: any;
            fechaFin: any;
        };
        empleadoId: any;
        tarifaHora: any;
        horasPagables: any;
        montoBruto: any;
        totalBonificaciones: any;
        totalDeducciones: any;
        montoNeto: any;
        movimientos: {
            concepto: string;
            tipo: string;
            monto: number;
        }[];
        message?: undefined;
    }>;
    getMyPeriods(empleadoId: number): Promise<{
        periodoId: number;
        nombre: string;
        fechaInicio: Date;
        fechaFin: Date;
        tipo: string;
        estado: string;
    }[]>;
    getConcepts(): Promise<{
        conceptoId: number;
        codigo: string;
        nombre: string;
        tipo: string;
        modoCalculo: string;
        baseCalculo: number;
    }[]>;
    private calculateISR;
    private sanitizeString;
    seedTestData(): Promise<{
        message: string;
    }>;
}
