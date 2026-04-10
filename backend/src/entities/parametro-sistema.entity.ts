import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('PARAMETRO_SISTEMA')
export class ParametroSistema {
  @PrimaryGeneratedColumn({ name: 'parametro_id' })
  parametroId: number;

  @Column({ name: 'usuario_id_actualiza' })
  usuarioIdActualiza: number;

  @Column({ length: 100, unique: true })
  clave: string;

  @Column({ length: 255 })
  valor: string;

  @Column({ length: 255, nullable: true })
  descripcion: string;

  @Column({ default: 1 })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id_actualiza' })
  usuarioActualiza: Usuario;
}
