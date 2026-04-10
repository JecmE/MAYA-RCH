import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { PlanillaEmpleado } from './planilla-empleado.entity';
import { ConceptoPlanilla } from './concepto-planilla.entity';
import { Usuario } from './usuario.entity';

@Entity('MOVIMIENTO_PLANILLA')
export class MovimientoPlanilla {
  @PrimaryGeneratedColumn({ name: 'movimiento_id' })
  movimientoId: number;

  @Column({ name: 'planilla_emp_id' })
  planillaEmpId: number;

  @Column({ name: 'concepto_id' })
  conceptoId: number;

  @Column({ length: 20 })
  tipo: string;

  @Column({ name: 'usuario_id_regista' })
  usuarioIdRegista: number;

  @CreateDateColumn({ name: 'fecha_hora' })
  fechaHora: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @Column({ name: 'es_manual', default: 0 })
  esManual: boolean;

  @Column({ length: 255, nullable: true })
  comentario: string;

  @ManyToOne(() => PlanillaEmpleado, (pe) => pe.movimientos)
  @JoinColumn({ name: 'planilla_emp_id' })
  planillaEmpleado: PlanillaEmpleado;

  @ManyToOne(() => ConceptoPlanilla, (cp) => cp.movimientos)
  @JoinColumn({ name: 'concepto_id' })
  concepto: ConceptoPlanilla;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id_regista' })
  usuarioRegistra: Usuario;
}
