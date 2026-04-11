import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Empleado } from './empleado.entity';
import { EmpleadoTurno } from './empleado-turno.entity';
import { AjusteAsistencia } from './ajuste-asistencia.entity';

@Entity('REGISTRO_ASISTENCIA')
export class RegistroAsistencia {
  @PrimaryGeneratedColumn({ name: 'asistencia_id' })
  asistenciaId: number;

  @Column({ name: 'empleado_id' })
  empleadoId: number;

  @Column({ name: 'empleado_turno_id', nullable: true })
  empleadoTurnoId: number;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ name: 'hora_entrada_real', type: 'datetime', nullable: true })
  horaEntradaReal: Date;

  @Column({ name: 'hora_salida_real', type: 'datetime', nullable: true })
  horaSalidaReal: Date;

  @Column({ name: 'minutos_tardia', default: 0 })
  minutosTardia: number;

  @Column({ name: 'horas_trabajadas', type: 'decimal', precision: 6, scale: 2, nullable: true })
  horasTrabajadas: number;

  @Column({ name: 'estado_jornada', length: 20, default: 'pendiente' })
  estadoJornada: string;

  @Column({ length: 255, nullable: true })
  observacion: string;

  @ManyToOne(() => Empleado, (emp) => emp.registrosAsistencia)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @ManyToOne(() => EmpleadoTurno, (et) => et.registrosAsistencia, { nullable: true })
  @JoinColumn({ name: 'empleado_turno_id' })
  empleadoTurno: EmpleadoTurno;

  @OneToMany(() => AjusteAsistencia, (aj) => aj.asistencia)
  ajustes: AjusteAsistencia[];

  static ESTADO_COMPLETADA = 'completada';
  static ESTADO_INCOMPLETA = 'incompleta';
  static ESTADO_PENDIENTE = 'pendiente';
}
