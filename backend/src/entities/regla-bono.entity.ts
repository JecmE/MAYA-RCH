import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BonoResultado } from './bono-resultado.entity';

@Entity('REGLA_BONO')
export class ReglaBono {
  @PrimaryGeneratedColumn({ name: 'regla_bono_id' })
  reglaBonoId: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ name: 'min_dias_trabajados', type: 'int', nullable: true })
  minDiasTrabajados: number;

  @Column({ name: 'max_tardias', type: 'int', nullable: true })
  maxTardias: number;

  @Column({ name: 'max_faltas', type: 'int', nullable: true })
  maxFaltas: number;

  @Column({ name: 'min_horas', type: 'decimal', precision: 10, scale: 2, nullable: true })
  minHoras: number;

  @Column({ name: 'monto', type: 'decimal', precision: 10, scale: 2, default: 0 })
  monto: number;

  @Column({ name: 'vigencia_inicio', type: 'date' })
  vigenciaInicio: Date;

  @Column({ name: 'vigencia_fin', type: 'date', nullable: true })
  vigenciaFin: Date;

  @Column({ default: 1 })
  activo: boolean;

  @OneToMany(() => BonoResultado, (br) => br.reglaBono)
  resultados: BonoResultado[];
}
