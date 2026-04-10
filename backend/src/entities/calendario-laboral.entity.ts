import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ParametroSistema } from './parametro-sistema.entity';

@Entity('CALENDARIO_LABORAL')
export class CalendarioLaboral {
  @PrimaryGeneratedColumn({ name: 'calendario_laboral_id' })
  calendarioLaboralId: number;

  @Column({ name: 'parametro_id' })
  parametroId: number;

  @Column({ name: 'vac_cuenta_sabados', nullable: true })
  vacCuentaSabados: boolean;

  @Column({ name: 'vac_cuenta_domingos', nullable: true })
  vacCuentaDomingos: boolean;

  @Column({ name: 'vac_cuenta_feriados', nullable: true })
  vacCuentaFeriados: boolean;

  @Column({ name: 'vac_feriados_lista', length: 500, nullable: true })
  vacFeriadosLista: string;

  @ManyToOne(() => ParametroSistema)
  @JoinColumn({ name: 'parametro_id' })
  parametro: ParametroSistema;
}
