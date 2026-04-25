import { Repository } from 'typeorm';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { SolicitudPermiso } from '../../entities/solicitud-permiso.entity';
import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { KpiMensual } from '../../entities/kpi-mensual.entity';
import { BonoResultado } from '../../entities/bono-resultado.entity';
import { Empleado } from '../../entities/empleado.entity';
import { VacacionSaldo } from '../../entities/vacacion-saldo.entity';
import { DataSource } from 'typeorm';
export declare class ReportsService {
    private asistenciaRepository;
    private solicitudRepository;
    private tiempoRepository;
    private kpiRepository;
    private bonoRepository;
    private empleadoRepository;
    private saldoRepository;
    private dataSource;
    constructor(asistenciaRepository: Repository<RegistroAsistencia>, solicitudRepository: Repository<SolicitudPermiso>, tiempoRepository: Repository<RegistroTiempo>, kpiRepository: Repository<KpiMensual>, bonoRepository: Repository<BonoResultado>, empleadoRepository: Repository<Empleado>, saldoRepository: Repository<VacacionSaldo>, dataSource: DataSource);
    getMonthlyAttendance(fechaInicio: string, fechaFin: string, departamento?: string): Promise<any>;
    getUniqueDepartments(): Promise<unknown[]>;
    getBonusEligibility(mes: number, anio: number, departamento?: string): Promise<any>;
    getProjectHours(fechaInicio: string, fechaFin: string, departamento?: string, proyectoNombre?: string): Promise<any>;
    getVacationReport(fechaInicio: string, fechaFin: string, departamento?: string): Promise<any>;
    private sanitizeString;
}
