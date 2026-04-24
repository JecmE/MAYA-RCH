import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Empleado } from './empleado.entity';
import { TipoPermiso } from './tipo-permiso.entity';
import { DecisionPermiso } from './decision-permiso.entity';
import { AdjuntoSolicitud } from './adjunto-solicitud.entity';
import { VacacionMovimiento } from './vacacion-movimiento.entity';

@Entity('SOLICITUD_PERMISO')
export class SolicitudPermiso {
  @PrimaryGeneratedColumn({ name: 'solicitud_id' })
  solicitudId: number;

  @Column({ name: 'empleado_id' })
  empleadoId: number;

  @Column({ name: 'tipo_permiso_id' })
  tipoPermisoId: number;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fecha_inicio: Date;

  @Column({ name: 'fecha_fin', type: 'date' })
  fecha_fin: Date;

  @Column({ name: 'horas_inicio', type: 'time', nullable: true })
  horasInicio: string;

  @Column({ name: 'horas_fin', type: 'time', nullable: true })
  horasFin: string;

  @Column({ length: 500 })
  motivo: string;

  @Column({ length: 20, default: 'pendiente' })
  estado: string;

  @CreateDateColumn({ name: 'fecha_solicitud' })
  fechaSolicitud: Date;

  @ManyToOne(() => Empleado, (emp) => emp.solicitudes)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @ManyToOne(() => TipoPermiso, (tp) => tp.solicitudes)
  @JoinColumn({ name: 'tipo_permiso_id' })
  tipoPermiso: TipoPermiso;

  @OneToMany(() => DecisionPermiso, (dp) => dp.solicitud)
  decisiones: DecisionPermiso[];

  @OneToMany(() => AdjuntoSolicitud, (adj) => adj.solicitud)
  adjuntos: AdjuntoSolicitud[];

  @OneToMany(() => VacacionMovimiento, (vm) => vm.solicitud)
  vacacionMovimientos: VacacionMovimiento[];

  static ESTADO_PENDIENTE = 'pendiente';
  static ESTADO_APROBADO = 'aprobado';
  static ESTADO_RECHAZADO = 'rechazado';
  static ESTADO_CANCELADO = 'cancelado';
}
