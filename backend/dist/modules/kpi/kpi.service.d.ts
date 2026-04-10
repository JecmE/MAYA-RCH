import { Repository } from 'typeorm';
import { KpiMensual } from '../../entities/kpi-mensual.entity';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { Empleado } from '../../entities/empleado.entity';
import { DataSource } from 'typeorm';
export declare class KpiService {
    private kpiRepository;
    private asistenciaRepository;
    private empleadoRepository;
    private dataSource;
    constructor(kpiRepository: Repository<KpiMensual>, asistenciaRepository: Repository<RegistroAsistencia>, empleadoRepository: Repository<Empleado>, dataSource: DataSource);
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
    }>;
    getSupervisorDashboard(supervisorEmpleadoId: number, mes?: number, anio?: number): Promise<{
        mes: number;
        anio: number;
        cantidadEmpleados: any;
        resumen: {
            totalDiasTrabajados: number;
            totalTardias: number;
            promedioCumplimiento: number;
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
        clasificacion: string;
        cumplimientoPct: number;
        tardias: number;
        faltas: number;
    }>;
    private calculateKpi;
}
