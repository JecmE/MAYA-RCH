import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('RESET_PASSWORD_TOKEN')
export class ResetPasswordToken {
  @PrimaryGeneratedColumn({ name: 'reset_id' })
  resetId: number;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @Column({ name: 'token_hash', length: 255 })
  tokenHash: string;

  @Column({ name: 'fecha_creacion', type: 'datetime' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_expira', type: 'datetime' })
  fechaExpira: Date;

  @Column({ default: 0 })
  usado: boolean;

  @Column({ name: 'fecha_uso', type: 'datetime', nullable: true })
  fechaUso: Date;

  @Column({ name: 'ip_solicitud', length: 45, nullable: true })
  ipSolicitud: string;

  @Column({ name: 'user_agent', length: 255, nullable: true })
  userAgent: string;

  @ManyToOne(() => Usuario, (user) => user.resetPasswordTokens)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
