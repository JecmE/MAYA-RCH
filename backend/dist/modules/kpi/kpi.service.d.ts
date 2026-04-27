import { Repository } from 'typeorm';
import { KpiMensual } from '../../entities/kpi-mensual.entity';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { Empleado } from '../../entities/empleado.entity';
import { DataSource } from 'typeorm';
import { SolicitudPermiso } from '../../entities/solicitud-permiso.entity';
import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { ParametroSistema } from '../../entities/parametro-sistema.entity';
export declare class KpiService {
    private kpiRepository;
    private asistenciaRepository;
    private empleadoRepository;
    private solicitudPermisoRepository;
    private registroTiempoRepository;
    private proyectoRepository;
    private parametroRepository;
    private dataSource;
    constructor(kpiRepository: Repository<KpiMensual>, asistenciaRepository: Repository<RegistroAsistencia>, empleadoRepository: Repository<Empleado>, solicitudPermisoRepository: Repository<SolicitudPermiso>, registroTiempoRepository: Repository<RegistroTiempo>, proyectoRepository: Repository<Proyecto>, parametroRepository: Repository<ParametroSistema>, dataSource: DataSource);
    private sanitizeString;
    getEmployeeDashboard(empleadoId: number, mes?: number, anio?: number): Promise<{
        mes: number;
        anio: number;
        diasEsperados: number;
        diasTrabajados: number;
        tardias: number;
        faltas: number;
        horasEsperadas: number;
        horasTrabajadas: number;
        cumplimientoPct: number;
        clasificacion: string;
        observacion: string;
    }>;
    private getKpiThresholds;
    private calculateKpi;
    globalRecalculateCurrentMonth(): Promise<void>;
    getSupervisorDashboard(supervisorEmpleadoId: number, mes?: number, anio?: number): Promise<{
        mes: number;
        anio: number;
        cantidadEmpleados: number;
        resumen: {
            totalDiasTrabajados: number;
            totalTardias: number;
            promedioCumplimiento: number;
        };
        empleados: {
            empleadoId: number;
            nombreCompleto: string;
            diasEsperados: number;
            cumplimientoPct: number;
            clasificacion: string;
        }[];
    }>;
    getHrDashboard(mes?: number, anio?: number): Promise<{
        mes: number;
        anio: number;
        totalEmpleados: number;
        promedioCumplimiento: number;
        totalTardias: number;
        totalFaltas: number;
        clasificaciones: {
            Excelente: number;
            Bueno: number;
            Regular: number;
            'En Riesgo': number;
        };
    }>;
    getEmployeeClassification(empleadoId: number, mes?: number, anio?: number): Promise<{
        empleadoId: number;
        clasificacion: string;
        cumplimientoPct: number;
    }[]>;
    refreshEmployeeKpi(empleadoId: number, mes?: number, anio?: number): Promise<KpiMensual>;
    getEmployeeProfile(empleadoId: number): Promise<{
        empleado: {
            nombreCompleto: string;
            puesto: string;
            departamento: string;
            email: string;
        };
        kpiActual: {
            cumplimientoPct: number;
            clasificacion: string;
            tardias: number;
            faltas: number;
        };
    }>;
    saveObservation(empleadoId: number, mes: number, anio: number, observacion: string): Promise<KpiMensual>;
}
