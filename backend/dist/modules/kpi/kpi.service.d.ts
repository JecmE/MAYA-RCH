import { Repository } from 'typeorm';
import { KpiMensual } from '../../entities/kpi-mensual.entity';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { Empleado } from '../../entities/empleado.entity';
import { DataSource } from 'typeorm';
import { SolicitudPermiso } from '../../entities/solicitud-permiso.entity';
import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { Proyecto } from '../../entities/proyecto.entity';
export declare class KpiService {
    private kpiRepository;
    private asistenciaRepository;
    private empleadoRepository;
    private solicitudPermisoRepository;
    private registroTiempoRepository;
    private proyectoRepository;
    private dataSource;
    constructor(kpiRepository: Repository<KpiMensual>, asistenciaRepository: Repository<RegistroAsistencia>, empleadoRepository: Repository<Empleado>, solicitudPermisoRepository: Repository<SolicitudPermiso>, registroTiempoRepository: Repository<RegistroTiempo>, proyectoRepository: Repository<Proyecto>, dataSource: DataSource);
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
    getSupervisorDashboard(supervisorEmpleadoId: number, mes?: number, anio?: number): Promise<{
        mes: number;
        anio: number;
        cantidadEmpleados: any;
        resumen: {
            totalDiasTrabajados: number;
            totalTardias: number;
            promedioCumplimiento: number;
            comparacionMesAnterior: number;
        };
        empleados: any;
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
            'En observacion': number;
            'En riesgo': number;
        };
    }>;
    getEmployeeClassification(empleadoId: number, mes?: number, anio?: number): Promise<{
        empleadoId: number;
        nombreCompleto: string;
        clasificacion: string;
        cumplimientoPct: number;
        tardias: number;
        faltas: number;
    }[]>;
    private calculateKpi;
    refreshEmployeeKpi(empleadoId: number, mes?: number, anio?: number): Promise<KpiMensual>;
    getEmployeeProfile(empleadoId: number): Promise<{
        empleado: {
            nombreCompleto: string;
            puesto: string;
            departamento: string;
            email: string;
        };
        historialAsistencia: {
            fecha: Date;
            entrada: Date;
            salida: Date;
            estado: string;
        }[];
        horasPorProyecto: {
            nombre: string;
            horas: number;
        }[];
        solicitudesRecientes: {
            tipo: string;
            fechaInicio: Date;
            fechaFin: Date;
            estado: string;
        }[];
        kpiActual: {
            cumplimientoPct: number;
            clasificacion: string;
            tardias: number;
            faltas: number;
        };
        comparacionMesAnterior: number;
    }>;
    saveObservation(empleadoId: number, mes: number, anio: number, observacion: string): Promise<KpiMensual>;
}
