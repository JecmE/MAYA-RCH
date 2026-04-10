import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('ROL')
export class Rol {
  @PrimaryGeneratedColumn({ name: 'rol_id' })
  rolId: number;

  @Column({ length: 50, unique: true })
  nombre: string;

  @Column({ length: 255, nullable: true })
  descripcion: string;

  @ManyToMany(() => Usuario, (user) => user.roles)
  usuarios: Usuario[];

  static ROL_EMPLEADO = 'Empleado';
  static ROL_SUPERVISOR = 'Supervisor';
  static ROL_RRHH = 'RRHH';
  static ROL_ADMIN = 'Administrador';
}
