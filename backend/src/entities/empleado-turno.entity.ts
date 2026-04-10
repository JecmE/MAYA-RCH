import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Empleado } from './empleado.entity';
import { Turno } from './turno.entity';
import { RegistroAsistencia } from './registro-asistencia.entity';

@Entity('EMPLEADO_TURNO')
export class EmpleadoTurno {
  @PrimaryGeneratedColumn({ name: 'empleado_turno_id' })
  empleadoTurnoId: number;

  @Column({ name: 'empleado_id' })
  empleadoId: number;

  @Column({ name: 'turno_id' })
  turnoId: number;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin: Date;

  @Column({ default: 1 })
  activo: boolean;

  @ManyToOne(() => Empleado, (emp) => emp.empleadoTurnos)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @ManyToOne(() => Turno, (turno) => turno.empleadoTurnos)
  @JoinColumn({ name: 'turno_id' })
  turno: Turno;

  @OneToMany(() => RegistroAsistencia, (ra) => ra.empleadoTurno)
  registrosAsistencia: RegistroAsistencia[];
}
