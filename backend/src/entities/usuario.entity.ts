import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Empleado } from './empleado.entity';
import { Rol } from './rol.entity';
import { DecisionPermiso } from './decision-permiso.entity';
import { AjusteAsistencia } from './ajuste-asistencia.entity';
import { AuditLog } from './audit-log.entity';
import { AprobacionTiempo } from './aprobacion-tiempo.entity';
import { ResetPasswordToken } from './reset-password-token.entity';

@Entity('USUARIO')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'usuario_id' })
  usuarioId: number;

  @Column({ name: 'empleado_id', unique: true })
  empleadoId: number;

  @Column({ length: 50, unique: true })
  username: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ length: 20, default: 'activo' })
  estado: string;

  @Column({ name: 'ultimo_login', nullable: true })
  ultimoLogin: Date;

  @Column({ name: 'ultimo_ip', length: 50, nullable: true })
  ultimoIp: string;

  @Column({ name: 'session_version', default: 1 })
  sessionVersion: number;

  @OneToOne(() => Empleado, (emp) => emp.usuario)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @ManyToMany(() => Rol, (rol) => rol.usuarios)
  @JoinTable({
    name: 'USUARIO_ROL',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'usuarioId' },
    inverseJoinColumn: { name: 'rol_id', referencedColumnName: 'rolId' },
  })
  roles: Rol[];

  @OneToMany(() => DecisionPermiso, (dp) => dp.usuario)
  decisionesPermiso: DecisionPermiso[];

  @OneToMany(() => AjusteAsistencia, (aa) => aa.usuario)
  ajustes: AjusteAsistencia[];

  @OneToMany(() => AuditLog, (al) => al.usuario)
  auditLogs: AuditLog[];

  @OneToMany(() => AprobacionTiempo, (at) => at.usuario)
  aprobacionesTiempo: AprobacionTiempo[];

  @OneToMany(() => ResetPasswordToken, (rpt) => rpt.usuario)
  resetPasswordTokens: ResetPasswordToken[];

  get isActivo(): boolean {
    return this.estado === 'activo';
  }
}
