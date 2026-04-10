import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Empleado } from './empleado.entity';
import { Proyecto } from './proyecto.entity';
import { AprobacionTiempo } from './aprobacion-tiempo.entity';

@Entity('REGISTRO_TIEMPO')
export class RegistroTiempo {
  @PrimaryGeneratedColumn({ name: 'tiempo_id' })
  tiempoId: number;

  @Column({ name: 'empleado_id' })
  empleadoId: number;

  @Column({ name: 'proyecto_id' })
  proyectoId: number;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  horas: number;

  @Column({ name: 'actividad_descripcion', length: 255, nullable: true })
  actividadDescripcion: string;

  @Column({ length: 20, default: 'pendiente' })
  estado: string;

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro: Date;

  @Column({ name: 'horas_validadas', type: 'decimal', precision: 4, scale: 2, nullable: true })
  horasValidadas: number;

  @ManyToOne(() => Empleado, (emp) => emp.registroTiempos)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @ManyToOne(() => Proyecto, (proy) => proy.registrosTiempo)
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;

  @OneToMany(() => AprobacionTiempo, (ap) => ap.registroTiempo)
  aprobaciones: AprobacionTiempo[];

  static ESTADO_PENDIENTE = 'pendiente';
  static ESTADO_APROBADO = 'aprobado';
  static ESTADO_RECHAZADO = 'rechazado';
}
