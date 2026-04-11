import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsersService, Empleado } from '../../../services/users.service';

interface EmpleadoItem {
  id: number;
  codigo: string;
  nombre: string;
  puesto: string;
  departamento: string;
  correo: string;
  estado: string;
}

interface NuevoEmpleadoForm {
  nombres: string;
  apellidos: string;
  documento: string;
  correo: string;
  telefono: string;
  puesto: string;
  departamento: string;
  supervisor: string;
  turno: string;
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

  nuevoEmpleado: NuevoEmpleadoForm = this.crearFormularioVacio();

  constructor(
    private router: Router,
    private usersService: UsersService,
  ) {}

  ngOnInit(): void {
    this.loadEmpleados();
  }

  private loadEmpleados(): void {
    this.usersService.getAll().subscribe({
      next: (empleados) => {
        this.empleadosData = empleados.map((e) => this.mapToItem(e));
      },
      error: (err) => {
        console.error('Error cargando empleados:', err);
        this.empleadosData = [];
      },
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
    this.modoEdicion = false;
    this.empleadoEditandoId = null;
  }

  cancelarNuevoEmpleado(): void {
    this.nuevoEmpleado = this.crearFormularioVacio();
    this.modalNuevoEmpleado = false;
    this.modoEdicion = false;
    this.empleadoEditandoId = null;
  }

  guardarEmpleado(): void {
    const nombreCompleto = `${this.nuevoEmpleado.nombres} ${this.nuevoEmpleado.apellidos}`.trim();

    if (this.modoEdicion && this.empleadoEditandoId !== null) {
      this.usersService
        .update(this.empleadoEditandoId, {
          nombres: this.nuevoEmpleado.nombres,
          apellidos: this.nuevoEmpleado.apellidos,
          email: this.nuevoEmpleado.correo,
          telefono: this.nuevoEmpleado.telefono,
          puesto: this.nuevoEmpleado.puesto,
          departamento: this.nuevoEmpleado.departamento,
        })
        .subscribe({
          next: () => {
            this.mostrarNotificacionExito('Empleado actualizado correctamente.');
            this.loadEmpleados();
          },
          error: (err) => {
            console.error('Error actualizando empleado:', err);
          },
        });
    } else {
      this.usersService
        .create({
          codigoEmpleado: this.generarCodigoEmpleado(),
          nombres: this.nuevoEmpleado.nombres,
          apellidos: this.nuevoEmpleado.apellidos,
          email: this.nuevoEmpleado.correo,
          telefono: this.nuevoEmpleado.telefono,
          puesto: this.nuevoEmpleado.puesto,
          departamento: this.nuevoEmpleado.departamento,
          fechaIngreso: this.nuevoEmpleado.fechaIngreso || new Date().toISOString().split('T')[0],
          activo: true,
        })
        .subscribe({
          next: () => {
            this.mostrarNotificacionExito('Empleado guardado correctamente.');
            this.loadEmpleados();
          },
          error: (err) => {
            console.error('Error guardando empleado:', err);
          },
        });
    }

    this.nuevoEmpleado = this.crearFormularioVacio();
    this.modalNuevoEmpleado = false;
    this.modoEdicion = false;
    this.empleadoEditandoId = null;
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
    const partesNombre = empleado.nombre.trim().split(' ');
    const nombres = partesNombre
      .slice(0, Math.max(1, Math.floor(partesNombre.length / 2)))
      .join(' ');
    const apellidos = partesNombre.slice(Math.floor(partesNombre.length / 2)).join(' ');

    this.modoEdicion = true;
    this.empleadoEditandoId = empleado.id;

    this.nuevoEmpleado = {
      nombres: nombres || '',
      apellidos: apellidos || '',
      documento: '',
      correo: empleado.correo || '',
      telefono: '',
      puesto: empleado.puesto || '',
      departamento: empleado.departamento || '',
      supervisor: '',
      turno: '',
      fechaIngreso: '',
      estado: empleado.estado || 'Activo',
    };

    this.modalNuevoEmpleado = true;
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

  get totalEmpleados(): number {
    return this.empleadosData.length;
  }

  get totalActivos(): number {
    return this.empleadosData.filter((empleado) => empleado.estado === 'Activo').length;
  }

  get totalInactivos(): number {
    return this.empleadosData.filter((empleado) => empleado.estado === 'Inactivo').length;
  }

  get totalDepartamentos(): number {
    const departamentos = new Set(
      this.empleadosData
        .map((empleado) => empleado.departamento)
        .filter((departamento) => departamento && departamento !== 'Sin departamento'),
    );

    return departamentos.size;
  }

  get departamentosDisponibles(): string[] {
    return Array.from(
      new Set(
        this.empleadosData
          .map((empleado) => empleado.departamento)
          .filter((departamento) => !!departamento && departamento !== 'Sin departamento'),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Activo':
        return 'status-badge--active';
      case 'Inactivo':
        return 'status-badge--inactive';
      default:
        return 'status-badge--default';
    }
  }

  private crearFormularioVacio(): NuevoEmpleadoForm {
    return {
      nombres: '',
      apellidos: '',
      documento: '',
      correo: '',
      telefono: '',
      puesto: '',
      departamento: '',
      supervisor: '',
      turno: '',
      fechaIngreso: '',
      estado: 'Activo',
    };
  }

  private mostrarNotificacionExito(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mostrarMensajeExito = true;

    setTimeout(() => {
      this.mostrarMensajeExito = false;
      this.mensajeExito = '';
    }, 3000);
  }

  private generarCodigoEmpleado(): string {
    const timestamp = Date.now().toString().slice(-8);
    return `EMP-${timestamp}`;
  }
}
