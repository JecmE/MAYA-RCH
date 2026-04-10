import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ParametroSistema } from './parametro-sistema.entity';

@Entity('SALDO_CORTES')
export class SaldoCortes {
  @PrimaryGeneratedColumn({ name: 'saldo_cortes_id' })
  saldoCortesId: number;

  @Column({ name: 'parametro_id' })
  parametroId: number;

  @Column({ name: 'vac_corte_anual_fecha', length: 10, nullable: true })
  vacCorteAnualFecha: string;

  @Column({ name: 'vac_permite_arreo_dias', nullable: true })
  vacPermiteArreoDias: boolean;

  @Column({ name: 'vac_max_arreo_dias', nullable: true })
  vacMaxArreoDias: number;

  @Column({ name: 'vac_vence_arreo_en_meses', nullable: true })
  vacVenceArreoEnMeses: number;

  @ManyToOne(() => ParametroSistema)
  @JoinColumn({ name: 'parametro_id' })
  parametro: ParametroSistema;
}
