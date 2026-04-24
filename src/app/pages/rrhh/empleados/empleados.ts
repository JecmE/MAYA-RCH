import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  CreateEmpleadoDto,
  Empleado,
  UsersService,
} from '../../../services/users.service';

interface EmpleadoItem {
  id: number;
  codigo: string;
  nombre: string;
  puesto: string;
  departamento: string;
  correo: string;
  estado: 'Activo' | 'Inactivo';
  activo: boolean;
}

interface NuevoEmpleadoForm {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  puesto: string;
  departamento: string;
  supervisorId: number | null;
  fechaIngreso: string;
  tarifaHora: number | null;
  estado: 'Activo' | 'Inactivo';
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

  mostrarMensajeError = false;
  mensajeError = '';

  modoEdicion = false;
  guardando = false;
  cargandoEdicion = false;

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
  private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
  this.loadEmpleados();
  }

private loadEmpleados(): void {
  this.usersService.getAll().subscribe({
    next: (empleados) => {
      this.empleadosData = empleados.map((e) => this.mapToItem(e));
      this.cdr.detectChanges();
    },
error: (err) => {
  this.cargandoEdicion = false;
  console.error('Error cargando empleado para edición:', err);
  this.mostrarNotificacionError(
    this.obtenerMensajeError(err, 'No se pudo cargar la información del empleado.')
  );
  this.modalNuevoEmpleado = false;
  this.modoEdicion = false;
  this.empleadoEditandoId = null;
},
  });
}

  private mapToItem(e: Empleado): EmpleadoItem {
    const activo = !!e.activo;

    return {
      id: e.empleadoId || 0,
      codigo: e.codigoEmpleado || '',
      nombre: e.nombreCompleto || `${e.nombres} ${e.apellidos}`.trim() || 'Sin nombre',
      puesto: e.puesto || 'Sin puesto',
      departamento: e.departamento || 'Sin departamento',
      correo: e.email || '',
      estado: activo ? 'Activo' : 'Inactivo',
      activo,
    };
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  abrirModalNuevoEmpleado(): void {
    this.limpiarMensajes();
    this.modoEdicion = false;
    this.empleadoEditandoId = null;
    this.nuevoEmpleado = this.crearFormularioVacio();
    this.modalNuevoEmpleado = true;
  }

  cerrarModalNuevoEmpleado(): void {
    if (this.guardando || this.cargandoEdicion) return;
    this.resetModalFormulario();
  }

  cancelarNuevoEmpleado(): void {
    if (this.guardando || this.cargandoEdicion) return;
    this.resetModalFormulario();
  }

  guardarEmpleado(): void {
    if (this.guardando || this.cargandoEdicion) return;

    this.limpiarMensajes();

    const errorValidacion = this.validarFormulario();
    if (errorValidacion) {
      this.mostrarNotificacionError(errorValidacion);
      return;
    }

    this.guardando = true;

    const payloadBase: Partial<CreateEmpleadoDto> = {
      nombres: this.normalizarTexto(this.nuevoEmpleado.nombres),
      apellidos: this.normalizarTexto(this.nuevoEmpleado.apellidos),
      email: this.normalizarTexto(this.nuevoEmpleado.correo),
      telefono: this.normalizarTexto(this.nuevoEmpleado.telefono) || undefined,
      puesto: this.normalizarTexto(this.nuevoEmpleado.puesto) || undefined,
      departamento: this.normalizarTexto(this.nuevoEmpleado.departamento) || undefined,
      fechaIngreso: this.nuevoEmpleado.fechaIngreso,
      supervisorId: this.nuevoEmpleado.supervisorId ?? undefined,
      tarifaHora:
        this.nuevoEmpleado.tarifaHora !== null && this.nuevoEmpleado.tarifaHora !== undefined
          ? Number(this.nuevoEmpleado.tarifaHora)
          : undefined,
      activo: this.nuevoEmpleado.estado === 'Activo',
    };

    if (this.modoEdicion && this.empleadoEditandoId !== null) {
      this.usersService.update(this.empleadoEditandoId, payloadBase).subscribe({
        next: () => {
          this.guardando = false;
          this.mostrarNotificacionExito('Empleado actualizado correctamente.');
          this.loadEmpleados();
          this.resetModalFormulario();
        },
        error: (err) => {
          this.guardando = false;
          console.error('Error actualizando empleado:', err);
          this.mostrarNotificacionError(
            this.obtenerMensajeError(err, 'No se pudo actualizar el empleado.'),
          );
        },
      });
      return;
    }

    const payloadCreate: CreateEmpleadoDto = {
      codigoEmpleado: this.generarCodigoEmpleado(),
      nombres: payloadBase.nombres!,
      apellidos: payloadBase.apellidos!,
      email: payloadBase.email!,
      telefono: payloadBase.telefono,
      fechaIngreso: payloadBase.fechaIngreso!,
      supervisorId: payloadBase.supervisorId,
      departamento: payloadBase.departamento,
      puesto: payloadBase.puesto,
      tarifaHora: payloadBase.tarifaHora,
      activo: payloadBase.activo,
    };

    this.usersService.create(payloadCreate).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarNotificacionExito('Empleado guardado correctamente.');
        this.loadEmpleados();
        this.resetModalFormulario();
      },
      error: (err) => {
        this.guardando = false;
        console.error('Error guardando empleado:', err);
        this.mostrarNotificacionError(
          this.obtenerMensajeError(err, 'No se pudo guardar el empleado.'),
        );
      },
    });
  }

  verEmpleado(empleado: EmpleadoItem): void {
    this.empleadoSeleccionado = empleado;
    this.modalVerEmpleado = true;
  }

  cerrarModalVerEmpleado(): void {
    this.modalVerEmpleado = false;
    this.empleadoSeleccionado = null;
  }

editarEmpleado(empleadoId: number): void {
  this.limpiarMensajes();

  this.modoEdicion = true;
  this.empleadoEditandoId = empleadoId;
  this.modalNuevoEmpleado = true;
  this.cargandoEdicion = true;
  this.cdr.detectChanges();

  this.usersService.getById(empleadoId).subscribe({
    next: (empleado) => {
      this.nuevoEmpleado = {
        nombres: empleado.nombres || '',
        apellidos: empleado.apellidos || '',
        correo: empleado.email || '',
        telefono: empleado.telefono || '',
        puesto: empleado.puesto || '',
        departamento: empleado.departamento || '',
        supervisorId: empleado.supervisorId ?? null,
        fechaIngreso: this.formatearFechaParaInput(empleado.fechaIngreso),
        tarifaHora:
          empleado.tarifaHora !== null && empleado.tarifaHora !== undefined
            ? Number(empleado.tarifaHora)
            : null,
        estado: empleado.activo ? 'Activo' : 'Inactivo',
      };

      this.cargandoEdicion = false;
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.cargandoEdicion = false;
      this.cdr.detectChanges();

      console.error('Error cargando empleado para edición:', err);
      this.mostrarNotificacionError(
        this.obtenerMensajeError(err, 'No se pudo cargar la información del empleado.'),
      );
      this.resetModalFormulario();
    },
  });
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

  get supervisoresDisponibles(): EmpleadoItem[] {
    return this.empleadosData
      .filter((empleado) => {
        if (!empleado.activo) return false;
        if (this.empleadoEditandoId !== null && empleado.id === this.empleadoEditandoId) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
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
      correo: '',
      telefono: '',
      puesto: '',
      departamento: '',
      supervisorId: null,
      fechaIngreso: '',
      tarifaHora: null,
      estado: 'Activo',
    };
  }

  private validarFormulario(): string | null {
    if (!this.normalizarTexto(this.nuevoEmpleado.nombres)) {
      return 'Los nombres son obligatorios.';
    }

    if (!this.normalizarTexto(this.nuevoEmpleado.apellidos)) {
      return 'Los apellidos son obligatorios.';
    }

    if (!this.normalizarTexto(this.nuevoEmpleado.correo)) {
      return 'El correo electrónico es obligatorio.';
    }

    const email = this.normalizarTexto(this.nuevoEmpleado.correo);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Ingresa un correo electrónico válido.';
    }

    if (!this.nuevoEmpleado.fechaIngreso) {
      return 'La fecha de ingreso es obligatoria.';
    }

    if (
      this.nuevoEmpleado.tarifaHora !== null &&
      this.nuevoEmpleado.tarifaHora !== undefined &&
      Number(this.nuevoEmpleado.tarifaHora) < 0
    ) {
      return 'La tarifa por hora no puede ser negativa.';
    }

    return null;
  }

  private formatearFechaParaInput(valor: string | Date | undefined): string {
    if (!valor) return '';

    const fecha = new Date(valor);
    if (!isNaN(fecha.getTime())) {
      return fecha.toISOString().split('T')[0];
    }

    return String(valor).slice(0, 10);
  }

  private normalizarTexto(valor: string | null | undefined): string {
    return (valor || '').trim();
  }

  private limpiarMensajes(): void {
    this.mostrarMensajeError = false;
    this.mensajeError = '';
  }

  private resetModalFormulario(): void {
    this.modalNuevoEmpleado = false;
    this.modoEdicion = false;
    this.guardando = false;
    this.cargandoEdicion = false;
    this.empleadoEditandoId = null;
    this.nuevoEmpleado = this.crearFormularioVacio();
  }

  private mostrarNotificacionExito(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mostrarMensajeExito = true;

    setTimeout(() => {
      this.mostrarMensajeExito = false;
      this.mensajeExito = '';
    }, 3000);
  }

  private mostrarNotificacionError(mensaje: string): void {
    this.mensajeError = mensaje;
    this.mostrarMensajeError = true;

    setTimeout(() => {
      this.mostrarMensajeError = false;
      this.mensajeError = '';
    }, 4000);
  }

  private obtenerMensajeError(err: any, fallback: string): string {
    const message = err?.error?.message;

    if (Array.isArray(message)) {
      return message.join(' ');
    }

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    return fallback;
  }

  private generarCodigoEmpleado(): string {
    const timestamp = Date.now().toString().slice(-8);
    return `EMP-${timestamp}`;
  }
}