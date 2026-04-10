import { PeriodoPlanilla } from './periodo-planilla.entity';
import { Empleado } from './empleado.entity';
import { MovimientoPlanilla } from './movimiento-planilla.entity';
export declare class PlanillaEmpleado {
    planillaEmpId: number;
    periodoId: number;
    empleadoId: number;
    fechaCalculo: Date;
    tarifaHoraUsada: number;
    horasPagables: number;
    montoBruto: number;
    totalBonificaciones: number;
    totalDeducciones: number;
    montoNeto: number;
    periodo: PeriodoPlanilla;
    empleado: Empleado;
    movimientos: MovimientoPlanilla[];
}
