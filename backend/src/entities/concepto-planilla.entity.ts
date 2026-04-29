import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { MovimientoPlanilla } from './movimiento-planilla.entity';

@Entity('CONCEPTO_PLANILLA')
export class ConceptoPlanilla {
  @PrimaryGeneratedColumn({ name: 'concepto_id' })
  conceptoId: number;

  @Column({ length: 20, unique: true })
  codigo: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 20 })
  tipo: string;

  @Column({ name: 'modo_calculo', length: 30 })
  modoCalculo: string;

  @Column({ name: 'base_calculo', type: 'decimal', precision: 10, scale: 2, nullable: true })
  baseCalculo: number;

  @Column({ default: 1 })
  activo: boolean;

  @OneToMany(() => MovimientoPlanilla, (mp) => mp.concepto)
  movimientos: MovimientoPlanilla[];

  static TIPO_INGRESO = 'ingreso';
  static TIPO_DEDUCCION = 'deduccion';

  static MODO_FIJO = 'fijo';
  static MODO_PORCENTAJE = 'porcentaje';
  static MODO_HORAS = 'horas';
  static MODO_VARIABLE = 'variable';
}
