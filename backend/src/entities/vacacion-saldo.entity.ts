import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { Empleado } from './empleado.entity';

@Entity('VACACION_SALDO')
export class VacacionSaldo {
  @PrimaryGeneratedColumn({ name: 'saldo_id' })
  saldoId: number;

  @Column({ name: 'empleado_id', unique: true })
  empleadoId: number;

  @Column({ name: 'dias_disponibles', default: 0 })
  diasDisponibles: number;

  @Column({ name: 'dias_usados', default: 0 })
  diasUsados: number;

  @Column({ name: 'fecha_corte', type: 'date' })
  fechaCorte: Date;

  @OneToOne(() => Empleado, (emp) => emp.vacacionSaldo)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  get diasTotales(): number {
    return this.diasDisponibles + this.diasUsados;
  }
}
