import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Empleado } from './empleado.entity';
import { ReglaBono } from './regla-bono.entity';

@Entity('BONO_RESULTADO')
@Unique(['empleadoId', 'reglaBonoId', 'anio', 'mes'])
export class BonoResultado {
  @PrimaryGeneratedColumn({ name: 'bono_res_id' })
  bonoResId: number;

  @Column({ name: 'empleado_id' })
  empleadoId: number;

  @Column({ name: 'regla_bono_id' })
  reglaBonoId: number;

  @Column()
  anio: number;

  @Column()
  mes: number;

  @Column()
  elegible: boolean;

  @Column({ name: 'motivo_no_elegible', length: 255, nullable: true })
  motivoNoElegible: string;

  @CreateDateColumn({ name: 'fecha_calculo' })
  fechaCalculo: Date;

  @ManyToOne(() => Empleado, (emp) => emp.bonoResultados)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @ManyToOne(() => ReglaBono, (rb) => rb.resultados)
  @JoinColumn({ name: 'regla_bono_id' })
  reglaBono: ReglaBono;
}
