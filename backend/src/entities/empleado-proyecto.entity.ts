import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Empleado } from './empleado.entity';
import { Proyecto } from './proyecto.entity';

@Entity('EMPLEADO_PROYECTO')
@Unique(['empleadoId', 'proyectoId'])
export class EmpleadoProyecto {
  @PrimaryGeneratedColumn({ name: 'emp_proy_id' })
  empProyId: number;

  @Column({ name: 'empleado_id' })
  empleadoId: number;

  @Column({ name: 'proyecto_id' })
  proyectoId: number;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fecha_inicio: Date;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fecha_fin: Date;

  @Column({ default: 1 })
  activo: boolean;

  @ManyToOne(() => Empleado, (emp) => emp.empleadoProyectos)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @ManyToOne(() => Proyecto, (proy) => proy.empleadoProyectos)
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;
}
