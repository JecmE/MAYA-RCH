import { Repository } from 'typeorm';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { SolicitudPermiso } from '../../entities/solicitud-permiso.entity';
import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { KpiMensual } from '../../entities/kpi-mensual.entity';
import { BonoResultado } from '../../entities/bono-resultado.entity';
import { Empleado } from '../../entities/empleado.entity';
import { DataSource } from 'typeorm';
export declare class ReportsService {
    private asistenciaRepository;
    private solicitudRepository;
    private tiempoRepository;
    private kpiRepository;
    private bonoRepository;
    private empleadoRepository;
    private dataSource;
    constructor(asistenciaRepository: Repository<RegistroAsistencia>, solicitudRepository: Repository<SolicitudPermiso>, tiempoRepository: Repository<RegistroTiempo>, kpiRepository: Repository<KpiMensual>, bonoRepository: Repository<BonoResultado>, empleadoRepository: Repository<Empleado>, dataSource: DataSource);
    getBonusEligibility(mes: number, anio: number): Promise<any>;
    private sanitizeString;
    getMonthlyAttendance(mes: number, anio: number): Promise<any>;
    getProjectHours(fechaInicio: string, fechaFin: string): Promise<any>;
}
