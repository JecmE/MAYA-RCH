import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Empleado } from './empleado.entity';

@Entity('KPI_MENSUAL')
@Unique(['empleadoId', 'anio', 'mes'])
export class KpiMensual {
  @PrimaryGeneratedColumn({ name: 'kpi_id' })
  kpiId: number;

  @Column({ name: 'empleado_id' })
  empleadoId: number;

  @Column()
  anio: number;

  @Column()
  mes: number;

  @Column({ name: 'dias_esperados' })
  diasEsperados: number;

  @Column({ name: 'dias_trabajados' })
  diasTrabajados: number;

  @Column({ default: 0 })
  tardias: number;

  @Column({ default: 0 })
  faltas: number;

  @Column({ name: 'horas_esperadas', type: 'decimal', precision: 6, scale: 2 })
  horasEsperadas: number;

  @Column({ name: 'horas_trabajadas', type: 'decimal', precision: 6, scale: 2 })
  horasTrabajadas: number;

  @Column({ name: 'cumplimiento_pct', type: 'decimal', precision: 5, scale: 2 })
  cumplimientoPct: number;

  @Column({ length: 20, nullable: true })
  clasificacion: string;

  @CreateDateColumn({ name: 'fecha_calculo' })
  fechaCalculo: Date;

  @ManyToOne(() => Empleado, (emp) => emp.kpis)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  static CLASIFICACION_EXCELENTE = 'Excelente';
  static CLASIFICACION_BUENO = 'Bueno';
  static CLASIFICACION_OBSERVACION = 'En observacion';
  static CLASIFICACION_RIESGO = 'En riesgo';
}
