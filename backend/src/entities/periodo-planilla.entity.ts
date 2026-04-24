import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { PlanillaEmpleado } from './planilla-empleado.entity';

@Entity('PERIODO_PLANILLA')
export class PeriodoPlanilla {
  @PrimaryGeneratedColumn({ name: 'periodo_id' })
  periodoId: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fecha_inicio: Date;

  @Column({ name: 'fecha_fin', type: 'date' })
  fecha_fin: Date;

  @Column({ length: 20, default: 'mensual' })
  tipo: string;

  @Column({ length: 20, default: 'abierto' })
  estado: string;

  @OneToMany(() => PlanillaEmpleado, (pe) => pe.periodo)
  planillasEmpleado: PlanillaEmpleado[];

  static TIPO_SEMANAL = 'semanal';
  static TIPO_QUINCENAL = 'quincenal';
  static TIPO_MENSUAL = 'mensual';

  static ESTADO_ABIERTO = 'abierto';
  static ESTADO_CERRADO = 'cerrado';
  static ESTADO_PROCESADO = 'procesado';
}
