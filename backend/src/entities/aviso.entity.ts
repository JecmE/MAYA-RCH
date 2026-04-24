import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('AVISO')
export class Aviso {
  @PrimaryGeneratedColumn({ name: 'aviso_id' })
  avisoId: number;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @Column({ length: 100 })
  titulo: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ length: 20, default: 'info' }) // info, success, warning, error
  tipo: string;

  @CreateDateColumn({ name: 'fecha_hora' })
  fechaHora: Date;

  @Column({ default: false })
  leido: boolean;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
 
