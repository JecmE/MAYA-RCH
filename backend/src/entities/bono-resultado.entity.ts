import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Empleado } from './empleado.entity';
import { ReglaBono } from './regla-bono.entity';

@Entity('BONO_RESULTADO')
export class BonoResultado {
  @PrimaryGeneratedColumn({ name: 'bono_resultado_id' })
  bonoResultadoId: number;

  @Column({ name: 'empleado_id' })
  empleadoId: number;

  @Column({ name: 'regla_bono_id' })
  reglaBonoId: number;

  @Column({ type: 'int' })
  mes: number;

  @Column({ type: 'int' })
  anio: number;

  @Column({ default: false })
  elegible: boolean;

  @Column({ name: 'cumplimiento_pct', type: 'decimal', precision: 5, scale: 2, default: 0 })
  cumplimientoPct: number;

  @Column({ name: 'dias_asistidos', type: 'int', default: 0 })
  diasAsistidos: number;

  @Column({ name: 'dias_laborables', type: 'int', default: 0 })
  diasLaborables: number;

  @Column({ name: 'tardias_count', type: 'int', default: 0 })
  tardiasCount: number;

  @Column({ name: 'faltas_count', type: 'int', default: 0 })
  faltasCount: number;

  @Column({ name: 'horas_count', type: 'decimal', precision: 10, scale: 2, default: 0 })
  horasCount: number;

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
