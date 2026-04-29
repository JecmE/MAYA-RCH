import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Rol } from './rol.entity';

@Entity('ROL_PERMISO')
export class RolPermiso {
  @PrimaryGeneratedColumn({ name: 'rol_permiso_id' })
  rolPermisoId: number;

  @Column({ name: 'rol_id' })
  rolId: number;

  @Column({ length: 100 })
  modulo: string;

  @Column({ default: false })
  ver: boolean;

  @Column({ default: false })
  crear: boolean;

  @Column({ default: false })
  editar: boolean;

  @Column({ default: false })
  aprobar: boolean;

  @Column({ default: false })
  exportar: boolean;

  @Column({ default: false })
  administrar: boolean;

  @ManyToOne(() => Rol)
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;
}
