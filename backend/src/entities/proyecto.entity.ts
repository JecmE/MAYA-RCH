import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Departamento } from './departamento.entity';
import { EmpleadoProyecto } from './empleado-proyecto.entity';
import { RegistroTiempo } from './registro-tiempo.entity';

@Entity('PROYECTO')
export class Proyecto {
  @PrimaryGeneratedColumn({ name: 'proyecto_id' })
  proyectoId: number;

  @Column({ name: 'departamento_id', nullable: true })
  departamentoId: number;

  @Column({ length: 50, unique: true })
  codigo: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 500, nullable: true })
  descripcion: string;

  @Column({ length: 100, nullable: true })
  responsable: string;

  @Column({ default: 1 })
  activo: boolean;

  @ManyToOne(() => Departamento, (dept) => dept.proyectos, { nullable: true })
  @JoinColumn({ name: 'departamento_id' })
  departamento: Departamento;

  @OneToMany(() => EmpleadoProyecto, (ep) => ep.proyecto)
  empleadoProyectos: EmpleadoProyecto[];

  @OneToMany(() => RegistroTiempo, (rt) => rt.proyecto)
  registrosTiempo: RegistroTiempo[];
}
