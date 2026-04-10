import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { SolicitudPermiso } from './solicitud-permiso.entity';
import { VacacionSaldo } from './vacacion-saldo.entity';
import { VacacionMovimiento } from './vacacion-movimiento.entity';
import { RegistroTiempo } from './registro-tiempo.entity';
import { EmpleadoTurno } from './empleado-turno.entity';
import { RegistroAsistencia } from './registro-asistencia.entity';
import { EmpleadoProyecto } from './empleado-proyecto.entity';
import { KpiMensual } from './kpi-mensual.entity';
import { BonoResultado } from './bono-resultado.entity';
import { PlanillaEmpleado } from './planilla-empleado.entity';

@Entity('EMPLEADO')
export class Empleado {
  @PrimaryGeneratedColumn({ name: 'empleado_id' })
  empleadoId: number;

  @Column({ name: 'supervisor_id', nullable: true })
  supervisorId: number;

  @Column({ name: 'departamento', length: 100, nullable: true })
  departamento: string;

  @Column({ name: 'codigo_empleado', length: 20, unique: true })
  codigoEmpleado: string;

  @Column({ length: 100 })
  nombres: string;

  @Column({ length: 100 })
  apellidos: string;

  @Column({ length: 150, unique: true })
  email: string;

  @Column({ name: 'telefono', length: 20, nullable: true })
  telefono: string;

  @Column({ name: 'fecha_ingreso', type: 'date' })
  fechaIngreso: Date;

  @Column({ default: 1 })
  activo: boolean;

  @Column({ length: 100, nullable: true })
  puesto: string;

  @Column({ name: 'tarifa_hora', type: 'decimal', precision: 10, scale: 2, nullable: true })
  tarifaHora: number;

  @ManyToOne(() => Empleado, (emp) => emp.supervisees, { nullable: true })
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: Empleado;

  @OneToMany(() => Empleado, (emp) => emp.supervisor)
  supervisees: Empleado[];

  @OneToOne(() => Usuario, (user) => user.empleado)
  usuario: Usuario;

  @OneToOne(() => VacacionSaldo, (vs) => vs.empleado)
  vacacionSaldo: VacacionSaldo;

  @OneToMany(() => SolicitudPermiso, (sp) => sp.empleado)
  solicitudes: SolicitudPermiso[];

  @OneToMany(() => VacacionMovimiento, (vm) => vm.empleado)
  vacacionMovimientos: VacacionMovimiento[];

  @OneToMany(() => RegistroTiempo, (rt) => rt.empleado)
  registroTiempos: RegistroTiempo[];

  @OneToMany(() => EmpleadoTurno, (et) => et.empleado)
  empleadoTurnos: EmpleadoTurno[];

  @OneToMany(() => RegistroAsistencia, (ra) => ra.empleado)
  registrosAsistencia: RegistroAsistencia[];

  @OneToMany(() => EmpleadoProyecto, (ep) => ep.empleado)
  empleadoProyectos: EmpleadoProyecto[];

  @OneToMany(() => KpiMensual, (kpi) => kpi.empleado)
  kpis: KpiMensual[];

  @OneToMany(() => BonoResultado, (br) => br.empleado)
  bonoResultados: BonoResultado[];

  @OneToMany(() => PlanillaEmpleado, (pe) => pe.empleado)
  planillasEmpleado: PlanillaEmpleado[];

  get nombreCompleto(): string {
    return `${this.nombres} ${this.apellidos}`;
  }
}
