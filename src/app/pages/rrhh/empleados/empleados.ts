import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
  styleUrls: ['./empleados.css']
})
export class Empleados {
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

  empleadosData: EmpleadoItem[] = [
    {
      id: 1,
      codigo: 'EMP-001',
      nombre: 'Carlos Mérida',
      puesto: 'Desarrollador Sr.',
      departamento: 'Tecnología',
      correo: 'carlos@empresa.com',
      estado: 'Activo'
    },
    {
      id: 2,
      codigo: 'EMP-002',
      nombre: 'Lucía Torres',
      puesto: 'Analista QA',
      departamento: 'Tecnología',
      correo: 'lucia@empresa.com',
      estado: 'Activo'
    },
    {
      id: 3,
      codigo: 'EMP-003',
      nombre: 'Mario Paz',
      puesto: 'Diseñador UI/UX',
      departamento: 'Marketing',
      correo: 'mario@empresa.com',
      estado: 'Activo'
    },
    {
      id: 4,
      codigo: 'EMP-004',
      nombre: 'Ana Gómez',
      puesto: 'Especialista MKT',
      departamento: 'Marketing',
      correo: 'ana@empresa.com',
      estado: 'Inactivo'
    }
  ];

  nuevoEmpleado: NuevoEmpleadoForm = this.crearFormularioVacio();

  constructor(private router: Router) {}

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
    const nombreCompleto =
      `${this.nuevoEmpleado.nombres} ${this.nuevoEmpleado.apellidos}`.trim();

    if (this.modoEdicion && this.empleadoEditandoId !== null) {
      this.empleadosData = this.empleadosData.map((empleado) =>
        empleado.id === this.empleadoEditandoId
          ? {
              ...empleado,
              nombre: nombreCompleto || 'Sin nombre',
              puesto: this.nuevoEmpleado.puesto || 'Sin puesto',
              departamento: this.nuevoEmpleado.departamento || 'Sin departamento',
              correo: this.nuevoEmpleado.correo || 'sin-correo@empresa.com',
              estado: this.nuevoEmpleado.estado || 'Activo'
            }
          : empleado
      );

      this.mostrarNotificacionExito('Empleado actualizado correctamente.');
    } else {
      const nuevo: EmpleadoItem = {
        id: this.obtenerSiguienteId(),
        codigo: this.generarCodigoEmpleado(),
        nombre: nombreCompleto || 'Sin nombre',
        puesto: this.nuevoEmpleado.puesto || 'Sin puesto',
        departamento: this.nuevoEmpleado.departamento || 'Sin departamento',
        correo: this.nuevoEmpleado.correo || 'sin-correo@empresa.com',
        estado: this.nuevoEmpleado.estado || 'Activo'
      };

      this.empleadosData = [nuevo, ...this.empleadosData];
      this.mostrarNotificacionExito('Empleado guardado correctamente.');
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
    const nombres = partesNombre.slice(0, 1).join(' ');
    const apellidos = partesNombre.slice(1).join(' ');

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
      estado: empleado.estado || 'Activo'
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
        this.filtroEstado === 'Todos los estados' ||
        empleado.estado === this.filtroEstado;

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
        .filter((departamento) => departamento && departamento !== 'Sin departamento')
    );

    return departamentos.size;
  }

  get departamentosDisponibles(): string[] {
    return Array.from(
      new Set(
        this.empleadosData
          .map((empleado) => empleado.departamento)
          .filter((departamento) => !!departamento && departamento !== 'Sin departamento')
      )
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
      estado: 'Activo'
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

  private obtenerSiguienteId(): number {
    if (this.empleadosData.length === 0) {
      return 1;
    }

    return Math.max(...this.empleadosData.map((empleado) => empleado.id)) + 1;
  }

  private generarCodigoEmpleado(): string {
    const siguienteNumero = this.obtenerSiguienteId();
    return `EMP-${String(siguienteNumero).padStart(3, '0')}`;
  }
}