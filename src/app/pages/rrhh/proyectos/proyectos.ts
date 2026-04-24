import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectsService, Proyecto } from '../../../services/projects.service';

interface AsignacionProyecto {
  id: number;
  empleado: string;
  fecha_inicio: string;
  fecha_fin: string;
}

interface ProyectoItem {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  responsable: string;
  estado: 'Activo' | 'Pausado' | 'Cerrado';
  empleados: number;
  horasAsignadas: number;
  asignaciones: AsignacionProyecto[];
}

interface ProyectoForm {
  nombre: string;
  codigo: string;
  descripcion: string;
  responsable: string;
  estado: 'Activo' | 'Pausado' | 'Cerrado';
  empleados: number | null;
  horasAsignadas: number | null;
}

interface NuevaAsignacionForm {
  empleado: string;
  fecha_inicio: string;
  fecha_fin: string;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proyectos.html',
  styleUrl: './proyectos.css',
})
export class Proyectos implements OnInit {
  filtroBusqueda = '';
  filtroEstado = 'Todos los estados';

  mostrarMensajeExito = false;
  mensajeExito = '';

  menuAbiertoId: number | null = null;

  modalNuevoProyecto = false;
  modalDetalleProyecto = false;
  modalEliminarProyecto = false;

  modoEdicion = false;
  proyectoEditandoId: number | null = null;

  proyectoSeleccionado: ProyectoItem | null = null;
  proyectoAEliminar: ProyectoItem | null = null;

  empleadosDisponibles: string[] = [
    'Carlos Mérida',
    'Lucía Torres',
    'Ana Gómez',
    'Mario Paz',
    'José Luis',
    'Daniela Cruz',
    'Fernando Ruiz',
    'Patricia Gómez',
  ];

  nuevoProyecto: ProyectoForm = this.getProyectoVacio();

  nuevaAsignacion: NuevaAsignacionForm = this.getAsignacionVacia();
  asignacionesTemporales: AsignacionProyecto[] = [];

  proyectos: ProyectoItem[] = [];

  constructor(
    private router: Router,
    private projectsService: ProjectsService,
  ) {}

  ngOnInit(): void {
    this.loadProyectos();
  }

  private loadProyectos(): void {
    this.projectsService.getAll().subscribe({
      next: (data: Proyecto[]) => {
        this.proyectos = data.map((p) => this.mapProyectoToItem(p));
      },
      error: () => {
        this.proyectos = [];
      },
    });
  }

  private mapProyectoToItem(p: Proyecto): ProyectoItem {
    return {
      id: p.proyectoId ?? 0,
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      responsable: '',
      estado: p.activo ? 'Activo' : 'Cerrado',
      empleados: 0,
      horasAsignadas: 0,
      asignaciones: [],
    };
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  get totalProyectos(): number {
    return this.proyectos.length;
  }

  get totalActivos(): number {
    return this.proyectos.filter((p) => p.estado === 'Activo').length;
  }

  get totalPausados(): number {
    return this.proyectos.filter((p) => p.estado === 'Pausado').length;
  }

  get totalHorasAsignadas(): number {
    return this.proyectos.reduce((sum, proyecto) => sum + proyecto.horasAsignadas, 0);
  }

  get proyectosFiltrados(): ProyectoItem[] {
    const texto = this.filtroBusqueda.trim().toLowerCase();

    return this.proyectos.filter((proyecto) => {
      const coincideBusqueda =
        !texto ||
        proyecto.nombre.toLowerCase().includes(texto) ||
        proyecto.codigo.toLowerCase().includes(texto) ||
        proyecto.responsable.toLowerCase().includes(texto);

      const coincideEstado =
        this.filtroEstado === 'Todos los estados' || proyecto.estado === this.filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroEstado = 'Todos los estados';
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Activo':
        return 'status-badge--green';
      case 'Pausado':
        return 'status-badge--amber';
      case 'Cerrado':
        return 'status-badge--gray';
      default:
        return '';
    }
  }

  toggleMenu(id: number, event: Event): void {
    event.stopPropagation();
    this.menuAbiertoId = this.menuAbiertoId === id ? null : id;
  }

  detenerPropagacion(event: Event): void {
    event.stopPropagation();
  }

  @HostListener('document:click')
  cerrarMenuExterno(): void {
    this.menuAbiertoId = null;
  }

  abrirModalNuevoProyecto(): void {
    this.modoEdicion = false;
    this.proyectoEditandoId = null;
    this.nuevoProyecto = this.getProyectoVacio();
    this.nuevaAsignacion = this.getAsignacionVacia();
    this.asignacionesTemporales = [];
    this.modalNuevoProyecto = true;
    this.menuAbiertoId = null;
  }

  cerrarModalNuevoProyecto(): void {
    this.modalNuevoProyecto = false;
  }

  cancelarProyecto(): void {
    this.modalNuevoProyecto = false;
    this.modoEdicion = false;
    this.proyectoEditandoId = null;
    this.nuevoProyecto = this.getProyectoVacio();
    this.nuevaAsignacion = this.getAsignacionVacia();
    this.asignacionesTemporales = [];
  }

  agregarAsignacionTemporal(): void {
    if (!this.nuevaAsignacion.empleado) {
      this.mostrarExito('Selecciona un empleado para asignarlo.');
      return;
    }

    const yaExiste = this.asignacionesTemporales.some(
      (item) => item.empleado === this.nuevaAsignacion.empleado,
    );

    if (yaExiste) {
      this.mostrarExito('Ese empleado ya fue agregado a la lista temporal.');
      return;
    }

    this.asignacionesTemporales.push({
      id: Date.now(),
      empleado: this.nuevaAsignacion.empleado,
      fecha_inicio: this.nuevaAsignacion.fecha_inicio,
      fecha_fin: this.nuevaAsignacion.fecha_fin,
    });

    this.nuevoProyecto.empleados = this.asignacionesTemporales.length;
    this.nuevaAsignacion = this.getAsignacionVacia();
  }

  eliminarAsignacionTemporal(id: number): void {
    this.asignacionesTemporales = this.asignacionesTemporales.filter((item) => item.id !== id);
    this.nuevoProyecto.empleados = this.asignacionesTemporales.length;
  }

  guardarProyecto(): void {
    if (
      !this.nuevoProyecto.nombre.trim() ||
      !this.nuevoProyecto.codigo.trim() ||
      !this.nuevoProyecto.responsable.trim()
    ) {
      this.mostrarExito('Completa nombre, código y responsable.');
      return;
    }

    const proyectoPayload: ProyectoItem = {
      id: this.proyectoEditandoId ?? Date.now(),
      codigo: this.nuevoProyecto.codigo.trim(),
      nombre: this.nuevoProyecto.nombre.trim(),
      descripcion: this.nuevoProyecto.descripcion.trim(),
      responsable: this.nuevoProyecto.responsable.trim(),
      estado: this.nuevoProyecto.estado,
      empleados: Number(this.nuevoProyecto.empleados ?? this.asignacionesTemporales.length ?? 0),
      horasAsignadas: Number(this.nuevoProyecto.horasAsignadas ?? 0),
      asignaciones: [...this.asignacionesTemporales],
    };

    if (this.modoEdicion && this.proyectoEditandoId !== null) {
      const index = this.proyectos.findIndex((p) => p.id === this.proyectoEditandoId);
      if (index >= 0) {
        this.proyectos[index] = proyectoPayload;
      }
      this.mostrarExito('Proyecto actualizado correctamente.');
    } else {
      this.proyectos.unshift(proyectoPayload);
      this.mostrarExito('Proyecto creado correctamente.');
    }

    this.cancelarProyecto();
  }

  verProyecto(row: ProyectoItem): void {
    this.proyectoSeleccionado = {
      ...row,
      asignaciones: [...row.asignaciones],
    };
    this.modalDetalleProyecto = true;
    this.menuAbiertoId = null;
  }

  cerrarDetalleProyecto(): void {
    this.modalDetalleProyecto = false;
    this.proyectoSeleccionado = null;
  }

  editarProyecto(row: ProyectoItem): void {
    this.modoEdicion = true;
    this.proyectoEditandoId = row.id;

    this.nuevoProyecto = {
      nombre: row.nombre,
      codigo: row.codigo,
      descripcion: row.descripcion,
      responsable: row.responsable,
      estado: row.estado,
      empleados: row.empleados,
      horasAsignadas: row.horasAsignadas,
    };

    this.asignacionesTemporales = row.asignaciones.map((item) => ({ ...item }));
    this.nuevaAsignacion = this.getAsignacionVacia();

    this.modalNuevoProyecto = true;
    this.modalDetalleProyecto = false;
    this.menuAbiertoId = null;
  }

  asignarProyecto(row: ProyectoItem): void {
    this.editarProyecto(row);
    this.mostrarExito(`Puedes agregar empleados al proyecto ${row.nombre}.`);
  }

  abrirEliminarProyecto(row: ProyectoItem): void {
    this.proyectoAEliminar = row;
    this.modalEliminarProyecto = true;
    this.menuAbiertoId = null;
  }

  cerrarEliminarProyecto(): void {
    this.modalEliminarProyecto = false;
    this.proyectoAEliminar = null;
  }

  confirmarEliminarProyecto(): void {
    if (!this.proyectoAEliminar) return;

    this.proyectos = this.proyectos.filter((p) => p.id !== this.proyectoAEliminar?.id);
    this.mostrarExito('Proyecto eliminado correctamente.');
    this.cerrarEliminarProyecto();
  }

  exportarProyecto(): void {
    if (!this.proyectoSeleccionado) return;
    this.mostrarExito(
      `El proyecto ${this.proyectoSeleccionado.nombre} fue exportado correctamente.`,
    );
  }

  regenerarProyecto(): void {
    if (!this.proyectoSeleccionado) return;
    this.mostrarExito(
      `El resumen del proyecto ${this.proyectoSeleccionado.nombre} fue regenerado.`,
    );
  }

  private getProyectoVacio(): ProyectoForm {
    return {
      nombre: '',
      codigo: '',
      descripcion: '',
      responsable: '',
      estado: 'Activo',
      empleados: 0,
      horasAsignadas: 0,
    };
  }

  private getAsignacionVacia(): NuevaAsignacionForm {
    return {
      empleado: '',
      fecha_inicio: '',
      fecha_fin: '',
    };
  }

  private mostrarExito(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mostrarMensajeExito = true;

    setTimeout(() => {
      this.mostrarMensajeExito = false;
    }, 2500);
  }
}
