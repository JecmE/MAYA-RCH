import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { EmpleadoTurno } from './empleado-turno.entity';

@Entity('TURNO')
export class Turno {
  @PrimaryGeneratedColumn({ name: 'turno_id' })
  turnoId: number;

  @Column({ length: 50 })
  nombre: string;

  @Column({ name: 'hora_entrada', type: 'time' })
  horaEntrada: string;

  @Column({ name: 'hora_salida', type: 'time' })
  horaSalida: string;

  @Column({ name: 'tolerancia_minutos', default: 0 })
  toleranciaMinutos: number;

  @Column({ name: 'horas_esperadas_dia', type: 'decimal', precision: 4, scale: 2, default: 8 })
  horasEsperadasDia: number;

  @Column({ length: 100, nullable: true, default: 'Lun,Mar,Mie,Jue,Vie' })
  dias: string;

  @Column({ default: 1 })
  activo: boolean;

  @OneToMany(() => EmpleadoTurno, (et) => et.turno)
  empleadoTurnos: EmpleadoTurno[];
}
