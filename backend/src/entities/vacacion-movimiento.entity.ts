import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Empleado } from './empleado.entity';
import { SolicitudPermiso } from './solicitud-permiso.entity';

@Entity('VACACION_MOVIMIENTO')
export class VacacionMovimiento {
  @PrimaryGeneratedColumn({ name: 'movimiento_id' })
  movimientoId: number;

  @Column({ name: 'empleado_id' })
  empleadoId: number;

  @Column({ name: 'solicitud_id', nullable: true })
  solicitudId: number;

  @Column({ length: 20 })
  tipo: string;

  @Column()
  dias: number;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ length: 255, nullable: true })
  comentario: string;

  @ManyToOne(() => Empleado, (emp) => emp.vacacionMovimientos)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @ManyToOne(() => SolicitudPermiso, (sp) => sp.vacacionMovimientos, { nullable: true })
  @JoinColumn({ name: 'solicitud_id' })
  solicitud: SolicitudPermiso;

  static TIPO_ACUMULACION = 'acumulacion';
  static TIPO_CONSUMO = 'consumo';
  static TIPO_AJUSTE = 'ajuste';
}
