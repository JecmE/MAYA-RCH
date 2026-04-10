import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { RegistroTiempo } from './registro-tiempo.entity';
import { Usuario } from './usuario.entity';

@Entity('APROBACION_TIEMPO')
export class AprobacionTiempo {
  @PrimaryGeneratedColumn({ name: 'aprobacion_id' })
  aprobacionId: number;

  @Column({ name: 'tiempo_id' })
  tiempoId: number;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @Column({ length: 20 })
  decision: string;

  @Column({ length: 255 })
  comentario: string;

  @CreateDateColumn({ name: 'fecha_hora' })
  fechaHora: Date;

  @ManyToOne(() => RegistroTiempo, (rt) => rt.aprobaciones)
  @JoinColumn({ name: 'tiempo_id' })
  registroTiempo: RegistroTiempo;

  @ManyToOne(() => Usuario, (user) => user.aprobacionesTiempo)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  static DECISION_APROBADO = 'aprobado';
  static DECISION_RECHAZADO = 'rechazado';
}
