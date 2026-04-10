import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { RegistroAsistencia } from './registro-asistencia.entity';
import { Usuario } from './usuario.entity';

@Entity('AJUSTE_ASISTENCIA')
export class AjusteAsistencia {
  @PrimaryGeneratedColumn({ name: 'ajuste_id' })
  ajusteId: number;

  @Column({ name: 'asistencia_id' })
  asistenciaId: number;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @Column({ name: 'campo_modificado', length: 50 })
  campoModificado: string;

  @Column({ name: 'valor_anterior', length: 255 })
  valorAnterior: string;

  @Column({ name: 'valor_nuevo', length: 255 })
  valorNuevo: string;

  @Column({ length: 255 })
  motivo: string;

  @CreateDateColumn({ name: 'fecha_hora' })
  fechaHora: Date;

  @ManyToOne(() => RegistroAsistencia, (ra) => ra.ajustes)
  @JoinColumn({ name: 'asistencia_id' })
  asistencia: RegistroAsistencia;

  @ManyToOne(() => Usuario, (user) => user.ajustes)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
