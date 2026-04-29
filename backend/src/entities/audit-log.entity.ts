import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('AUDIT_LOG')
export class AuditLog {
  @PrimaryGeneratedColumn({ name: 'audit_id' })
  auditId: number;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId: number;

  @Column({ name: 'fecha_hora', type: 'datetime', default: () => 'GETDATE()' })
  fechaHora: Date;

  @Column({ length: 50 })
  modulo: string;

  @Column({ length: 50 })
  accion: string;

  @Column({ length: 50 })
  entidad: string;

  @Column({ name: 'entidad_id', nullable: true })
  entidadId: number;

  @Column({ length: 500, nullable: true })
  detalle: string;

  @ManyToOne(() => Usuario, (user) => user.auditLogs, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
