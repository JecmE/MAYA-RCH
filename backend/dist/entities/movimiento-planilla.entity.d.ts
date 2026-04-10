import { PlanillaEmpleado } from './planilla-empleado.entity';
import { ConceptoPlanilla } from './concepto-planilla.entity';
import { Usuario } from './usuario.entity';
export declare class MovimientoPlanilla {
    movimientoId: number;
    planillaEmpId: number;
    conceptoId: number;
    tipo: string;
    usuarioIdRegista: number;
    fechaHora: Date;
    monto: number;
    esManual: boolean;
    comentario: string;
    planillaEmpleado: PlanillaEmpleado;
    concepto: ConceptoPlanilla;
    usuarioRegistra: Usuario;
}
