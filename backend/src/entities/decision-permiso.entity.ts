import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { SolicitudPermiso } from './solicitud-permiso.entity';
import { Usuario } from './usuario.entity';

@Entity('DECISION_PERMISO')
export class DecisionPermiso {
  @PrimaryGeneratedColumn({ name: 'decision_id' })
  decisionId: number;

  @Column({ name: 'solicitud_id' })
  solicitudId: number;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @Column({ length: 20 })
  decision: string;

  @Column({ length: 255 })
  comentario: string;

  @CreateDateColumn({ name: 'fecha_hora' })
  fechaHora: Date;

  @ManyToOne(() => SolicitudPermiso, (sp) => sp.decisiones)
  @JoinColumn({ name: 'solicitud_id' })
  solicitud: SolicitudPermiso;

  @ManyToOne(() => Usuario, (user) => user.decisionesPermiso)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  static DECISION_APROBADO = 'aprobado';
  static DECISION_RECHAZADO = 'rechazado';
}
