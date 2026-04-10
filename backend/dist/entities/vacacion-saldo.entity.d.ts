import { Empleado } from './empleado.entity';
export declare class VacacionSaldo {
    saldoId: number;
    empleadoId: number;
    diasDisponibles: number;
    diasUsados: number;
    fechaCorte: Date;
    empleado: Empleado;
    get diasTotales(): number;
}
