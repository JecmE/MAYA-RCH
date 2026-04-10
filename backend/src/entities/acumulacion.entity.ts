import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ParametroSistema } from './parametro-sistema.entity';

@Entity('ACUMULACION')
export class Acumulacion {
  @PrimaryGeneratedColumn({ name: 'acumulacion_id' })
  acumulacionId: number;

  @Column({ name: 'parametro_id' })
  parametroId: number;

  @Column({ name: 'vac_dias_por_anio', nullable: true })
  vacDiasPorAnio: number;

  @Column({ name: 'vac_dias_por_mes', type: 'decimal', precision: 4, scale: 2, nullable: true })
  vacDiasPorMes: number;

  @Column({ name: 'vac_acumula_desde_fecha_ingreso', nullable: true })
  vacAcumulaDesdeFechaIngreso: boolean;

  @Column({ name: 'vac_meses_minimos_para_solicitar', nullable: true })
  vacMesesMinimosParaSolicitar: number;

  @Column({ name: 'vac_tope_acumulado_dias', nullable: true })
  vacTopeAcumuladoDias: number;

  @ManyToOne(() => ParametroSistema)
  @JoinColumn({ name: 'parametro_id' })
  parametro: ParametroSistema;
}
