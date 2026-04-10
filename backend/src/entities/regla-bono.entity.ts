import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BonoResultado } from './bono-resultado.entity';

@Entity('REGLA_BONO')
export class ReglaBono {
  @PrimaryGeneratedColumn({ name: 'regla_bono_id' })
  reglaBonoId: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ default: 1 })
  activo: boolean;

  @Column({ name: 'min_dias_trabajados', nullable: true })
  minDiasTrabajados: number;

  @Column({ name: 'max_tardias', nullable: true })
  maxTardias: number;

  @Column({ name: 'max_faltas', nullable: true })
  maxFaltas: number;

  @Column({ name: 'min_horas', type: 'decimal', precision: 6, scale: 2, nullable: true })
  minHoras: number;

  @Column({ name: 'vigencia_inicio', type: 'date' })
  vigenciaInicio: Date;

  @Column({ name: 'vigencia_fin', type: 'date', nullable: true })
  vigenciaFin: Date;

  @OneToMany(() => BonoResultado, (br) => br.reglaBono)
  resultados: BonoResultado[];
}
