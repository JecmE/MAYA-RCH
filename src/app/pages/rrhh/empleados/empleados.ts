import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsersService, Empleado } from '../../../services/users.service';
import { AdminService, Turno } from '../../../services/admin.service';

interface EmpleadoItem {
  id: number;
  codigo: string;
  nombre: string;
  puesto: string;
  departamento: string;
  correo: string;
  estado: string;
  supervisorId?: number;
  supervisorNombre?: string;
  fechaIngreso?: string;
  telefono?: string;
}

interface NuevoEmpleadoForm {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  puesto: string;
  departamento: string;
  supervisorId: string;
  fechaIngreso: string;
  estado: string;
}

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './empleados.html',
  styleUrls: ['./empleados.css'],
})
export class Empleados implements OnInit {
  modalNuevoEmpleado = false;
  modalVerEmpleado = false;

  mostrarMensajeExito = false;
  mensajeExito = '';

  modoEdicion = false;
  empleadoEditandoId: number | null = null;
  empleadoSeleccionado: EmpleadoItem | null = null;

  filtroBusqueda = '';
  filtroDepartamento = 'Todos los departamentos';
  filtroEstado = 'Todos los estados';

  empleadosData: EmpleadoItem[] = [];
  supervisoresDisponibles: { id: number; nombre: string }[] = [];
  turnosDisponibles: Turno[] = [];

  nuevoEmpleado: NuevoEmpleadoForm = this.crearFormularioVacio();

  constructor(
    private router: Router,
    private usersService: UsersService,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEmpleados();
    this.loadSupervisores();
    // Nota: Turnos se gestionarán en su propia vista, pero aquí cargamos para info
    this.adminService.getShifts().subscribe(t => this.turnosDisponibles = t);
  }

  private loadEmpleados(): void {
    this.usersService.getAll().subscribe({
      next: (empleados) => {
        this.empleadosData = empleados.map((e) => this.mapToItem(e));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando empleados:', err);
        this.empleadosData = [];
      },
    });
  }

  private loadSupervisores(): void {
    this.usersService.getAll('true').subscribe(empleados => {
      // Filtramos solo a los que tienen rol Supervisor o RRHH
      this.supervisoresDisponibles = empleados
        .filter(e => e.roles?.some(r => r === 'Supervisor' || r === 'RRHH'))
        .map(e => ({ id: e.empleadoId!, nombre: e.nombreCompleto! }));
    });
  }

  private mapToItem(e: Empleado): EmpleadoItem {
    return {
      id: e.empleadoId || 0,
      codigo: e.codigoEmpleado || '',
      nombre: e.nombreCompleto || `${e.nombres} ${e.apellidos}`.trim() || 'Sin nombre',
      puesto: e.puesto || 'Sin puesto',
      departamento: e.departamento || 'Sin departamento',
      correo: e.email || '',
      estado: e.activo ? 'Activo' : 'Inactivo',
      supervisorId: e.supervisorId,
      supervisorNombre: e.supervisorNombre,
      fechaIngreso: e.fechaIngreso,
      telefono: e.telefono
    };
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  abrirModalNuevoEmpleado(): void {
    this.modoEdicion = false;
    this.empleadoEditandoId = null;
    this.nuevoEmpleado = this.crearFormularioVacio();
    this.modalNuevoEmpleado = true;
  }

  cerrarModalNuevoEmpleado(): void {
    this.modalNuevoEmpleado = false;
  }

  guardarEmpleado(): void {
    if (!this.nuevoEmpleado.nombres || !this.nuevoEmpleado.apellidos || !this.nuevoEmpleado.correo) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    const payload: any = {
      nombres: this.nuevoEmpleado.nombres,
      apellidos: this.nuevoEmpleado.apellidos,
      email: this.nuevoEmpleado.correo,
      telefono: this.nuevoEmpleado.telefono,
      puesto: this.nuevoEmpleado.puesto,
      departamento: this.nuevoEmpleado.departamento,
      supervisorId: this.nuevoEmpleado.supervisorId ? parseInt(this.nuevoEmpleado.supervisorId) : undefined,
      fechaIngreso: this.nuevoEmpleado.fechaIngreso || new Date().toISOString().split('T')[0],
      activo: this.nuevoEmpleado.estado === 'Activo'
    };

    if (this.modoEdicion && this.empleadoEditandoId !== null) {
      this.usersService.update(this.empleadoEditandoId, payload).subscribe({
        next: () => {
          this.mostrarNotificacionExito('Empleado actualizado correctamente.');
          this.loadEmpleados();
          this.modalNuevoEmpleado = false;
        },
        error: (err) => alert(err.error?.message || 'Error al actualizar')
      });
    } else {
      payload.codigoEmpleado = this.generarCodigoEmpleado();
      this.usersService.create(payload).subscribe({
        next: () => {
          this.mostrarNotificacionExito('Empleado creado exitosamente.');
          this.loadEmpleados();
          this.modalNuevoEmpleado = false;
        },
        error: (err) => alert(err.error?.message || 'Error al crear')
      });
    }
  }

  verEmpleado(empleado: EmpleadoItem): void {
    this.empleadoSeleccionado = empleado;
    this.modalVerEmpleado = true;
  }

  cerrarModalVerEmpleado(): void {
    this.modalVerEmpleado = false;
    this.empleadoSeleccionado = null;
  }

  editarEmpleado(empleado: EmpleadoItem): void {
    this.modoEdicion = true;
    this.empleadoEditandoId = empleado.id;

    // Obtener nombres y apellidos
    const parts = empleado.nombre.split(' ');
    const nom = parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
    const ape = parts.slice(Math.ceil(parts.length / 2)).join(' ');

    this.nuevoEmpleado = {
      nombres: nom,
      apellidos: ape,
      correo: empleado.correo,
      telefono: empleado.telefono || '',
      puesto: empleado.puesto,
      departamento: empleado.departamento,
      supervisorId: empleado.supervisorId?.toString() || '',
      fechaIngreso: empleado.fechaIngreso ? new Date(empleado.fechaIngreso).toISOString().split('T')[0] : '',
      estado: empleado.estado
    };

    this.modalNuevoEmpleado = true;
  }

  desactivarEmpleado(id: number): void {
    if (confirm('¿Está seguro de desactivar este empleado? Esto también bloqueará su usuario.')) {
      this.usersService.deactivate(id).subscribe({
        next: () => {
          this.mostrarNotificacionExito('Empleado desactivado.');
          this.loadEmpleados();
        }
      });
    }
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroDepartamento = 'Todos los departamentos';
    this.filtroEstado = 'Todos los estados';
  }

  get empleadosFiltrados(): EmpleadoItem[] {
    const texto = this.filtroBusqueda.trim().toLowerCase();

    return this.empleadosData.filter((empleado) => {
      const coincideBusqueda =
        !texto ||
        empleado.nombre.toLowerCase().includes(texto) ||
        empleado.codigo.toLowerCase().includes(texto) ||
        empleado.correo.toLowerCase().includes(texto);

      const coincideDepartamento =
        this.filtroDepartamento === 'Todos los departamentos' ||
        empleado.departamento === this.filtroDepartamento;

      const coincideEstado =
        this.filtroEstado === 'Todos los estados' || empleado.estado === this.filtroEstado;

      return coincideBusqueda && coincideDepartamento && coincideEstado;
    });
  }

  get totalEmpleados(): number { return this.empleadosData.length; }
  get totalActivos(): number { return this.empleadosData.filter(e => e.estado === 'Activo').length; }
  get totalInactivos(): number { return this.empleadosData.filter(e => e.estado === 'Inactivo').length; }

  get totalDepartamentos(): number {
    return new Set(this.empleadosData.map(e => e.departamento)).size;
  }

  get departamentosDisponibles(): string[] {
    return Array.from(new Set(this.empleadosData.map(e => e.departamento))).sort();
  }

  getEstadoClass(estado: string): string {
    return estado === 'Activo' ? 'status-badge--active' : 'status-badge--inactive';
  }

  private crearFormularioVacio(): NuevoEmpleadoForm {
    return {
      nombres: '',
      apellidos: '',
      correo: '',
      telefono: '',
      puesto: '',
      departamento: '',
      supervisorId: '',
      fechaIngreso: new Date().toISOString().split('T')[0],
      estado: 'Activo',
    };
  }

  private mostrarNotificacionExito(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mostrarMensajeExito = true;
    setTimeout(() => this.mostrarMensajeExito = false, 3000);
  }

  private generarCodigoEmpleado(): string {
    return `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
  }
}
