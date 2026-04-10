import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('TABLA_ISR')
export class TablaIsr {
  @PrimaryGeneratedColumn({ name: 'isr_id' })
  isrId: number;

  @Column()
  anio: number;

  @Column({ name: 'rango_desde', type: 'decimal', precision: 12, scale: 2 })
  rangoDesde: number;

  @Column({ name: 'rango_hasta', type: 'decimal', precision: 12, scale: 2 })
  rangoHasta: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  porcentaje: number;

  @Column({ name: 'cuota_fijo', type: 'decimal', precision: 12, scale: 2 })
  cuotaFijo: number;
}
