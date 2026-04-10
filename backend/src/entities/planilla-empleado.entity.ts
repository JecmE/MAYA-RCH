import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { PeriodoPlanilla } from './periodo-planilla.entity';
import { Empleado } from './empleado.entity';
import { MovimientoPlanilla } from './movimiento-planilla.entity';

@Entity('PLANILLA_EMPLEADO')
@Unique(['periodoId', 'empleadoId'])
export class PlanillaEmpleado {
  @PrimaryGeneratedColumn({ name: 'planilla_emp_id' })
  planillaEmpId: number;

  @Column({ name: 'periodo_id' })
  periodoId: number;

  @Column({ name: 'empleado_id' })
  empleadoId: number;

  @CreateDateColumn({ name: 'fecha_calculo' })
  fechaCalculo: Date;

  @Column({ name: 'tarifa_hora_usada', type: 'decimal', precision: 10, scale: 2 })
  tarifaHoraUsada: number;

  @Column({ name: 'horas_pagables', type: 'decimal', precision: 10, scale: 2 })
  horasPagables: number;

  @Column({ name: 'monto_bruto', type: 'decimal', precision: 12, scale: 2 })
  montoBruto: number;

  @Column({ name: 'total_bonificaciones', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalBonificaciones: number;

  @Column({ name: 'total_deducciones', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalDeducciones: number;

  @Column({ name: 'monto_neto', type: 'decimal', precision: 12, scale: 2 })
  montoNeto: number;

  @ManyToOne(() => PeriodoPlanilla, (pp) => pp.planillasEmpleado)
  @JoinColumn({ name: 'periodo_id' })
  periodo: PeriodoPlanilla;

  @ManyToOne(() => Empleado, (emp) => emp.planillasEmpleado)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @OneToMany(() => MovimientoPlanilla, (mp) => mp.planillaEmpleado)
  movimientos: MovimientoPlanilla[];
}
