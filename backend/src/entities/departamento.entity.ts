import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Proyecto } from './proyecto.entity';

@Entity('DEPARTAMENTO')
export class Departamento {
  @PrimaryGeneratedColumn({ name: 'departamento_id' })
  departamentoId: number;

  @Column({ length: 100, unique: true })
  nombre: string;

  @Column({ length: 255, nullable: true })
  descripcion: string;

  @Column({ default: 1 })
  activo: boolean;

  @OneToMany(() => Proyecto, (proy) => proy.departamento)
  proyectos: Proyecto[];
}
