import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, Turno as TurnoBackend } from '../../../services/admin.service';
import { UsersService, Empleado } from '../../../services/users.service';

type TabType = 'catalogo' | 'asignaciones';

interface TurnoItem {
  id: number;
  codigo: string;
  nombre: string;
  entrada: string;
  salida: string;
  tolerancia: string;
  horas: string;
  estado: string;
  dias: string;
  rawDias: string;
}

interface AsignacionItem {
  id: number;
  empleado: string;
  turno: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}

interface TurnoForm {
  nombre: string;
  entrada: string;
  salida: string;
  tolerancia: number;
  estado: string;
  horasEsperadas: number;
  dias: string[];
}

interface AsignacionForm {
  empleadoId: number | null;
  turnoId: number | null;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turnos.html',
  styleUrl: './turnos.css',
})
export class Turnos implements OnInit {
  tab: TabType = 'catalogo';
  modalNuevoTurno = false;
  modalNuevaAsignacion = false;
  modoEdicion = false;

  mostrarMensajeExito = false;
  mensajeExito = '';
  isSaving = false;

  filtroBusqueda = '';
  filtroEstado = 'Todos los estados';

  turnoEditandoId: number | null = null;
  nuevoTurno: TurnoForm = this.crearFormularioTurnoVacio();
  nuevaAsignacion: AsignacionForm = this.crearFormularioAsignacionVacio();

  diasSemana = [
    { id: 'Lun', label: 'Lun' },
    { id: 'Mar', label: 'Mar' },
    { id: 'Mie', label: 'Mié' },
    { id: 'Jue', label: 'Jue' },
    { id: 'Vie', label: 'Vie' },
    { id: 'Sab', label: 'Sáb' },
    { id: 'Dom', label: 'Dom' }
  ];

  turnosData: TurnoItem[] = [];
  asignacionesData: AsignacionItem[] = [];

  empleadosDisponibles: Empleado[] = [];
  turnosSelect: TurnoBackend[] = [];

  constructor(
    private router: Router,
    private adminService: AdminService,
    private usersService: UsersService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTurnos();
    this.loadAssignments();
    this.loadEmployees();
  }

  setTab(tab: TabType): void {
    this.tab = tab;
    this.filtroBusqueda = '';
    this.filtroEstado = 'Todos los estados';
  }

  private loadTurnos(): void {
    this.adminService.getShifts().subscribe({
      next: (turnos) => {
        // Para el selector de asignación, solo mostramos los turnos ACTIVOS
        this.turnosSelect = turnos.filter(t => t.activo);
        // Para la tabla del catálogo, mostramos todos (activos e inactivos)
        this.turnosData = turnos.map((t) => this.mapTurnoToItem(t));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando turnos:', err);
        this.turnosData = [];
      },
    });
  }

  private loadAssignments(): void {
    this.adminService.getAssignments().subscribe({
      next: (data) => {
        this.asignacionesData = data.map(a => ({
          id: a.id,
          empleado: this.sanitize(a.empleadoNombre),
          turno: a.turnoNombre,
          fechaInicio: this.formatDate(a.fechaInicio),
          fechaFin: a.fechaFin ? this.formatDate(a.fechaFin) : 'Indefinido',
          estado: a.activo ? 'Activo' : 'Inactivo'
        }));
        this.cdr.detectChanges();
      }
    });
  }

  private sanitize(str: string | undefined | null): string {
    if (!str) return '';

    // 1. Limpieza de codificación
    let res = str.replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ã¡/g, 'á')
                 .replace(/Ã©/g, 'é').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ');

    // 2. Corregir signos de interrogación por contexto
    res = res.replace(/\?/g, (m, offset, original) => {
      if (original.includes('Rodr')) return 'í';
      if (original.includes('Mart')) return 'í';
      if (original.includes('Garc')) return 'í';
      if (original.includes('Fern')) return 'á';
      return 'í';
    });

    // 3. Eliminar palabras duplicadas (ej: "José Jose") ignorando acentos para la comparación
    const words = res.split(' ');
    const seen = new Set<string>();
    return words.filter(w => {
      // Normalizar para comparar (quitar acentos y pasar a minúsculas)
      const normalized = w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (seen.has(normalized) && w.length > 2) return false;
      seen.add(normalized);
      return true;
    }).join(' ');
  }

  private loadEmployees(): void {
    this.usersService.getAll('true').subscribe(data => {
      this.empleadosDisponibles = data;
    });
  }

  private mapTurnoToItem(t: TurnoBackend): TurnoItem {
    return {
      id: t.turnoId || 0,
      codigo: `T-${String(t.turnoId).padStart(3, '0')}`,
      nombre: t.nombre || 'Sin nombre',
      entrada: this.formatTimeDisplay(t.horaEntrada),
      salida: this.formatTimeDisplay(t.horaSalida),
      tolerancia: `${t.toleranciaMinutos ?? 0} min`,
      horas: `${t.horasEsperadasDia ?? 8} h`,
      dias: this.formatDaysDisplay(t.dias),
      rawDias: t.dias || 'Lun,Mar,Mie,Jue,Vie',
      estado: t.activo ? 'Activo' : 'Inactivo',
    };
  }

  private formatDaysDisplay(dias: string | undefined | null): string {
    if (!dias) return 'L-V';
    if (dias === 'Lun,Mar,Mie,Jue,Vie') return 'L-V';
    if (dias === 'Lun,Mar,Mie,Jue,Vie,Sab,Dom') return 'L-D';
    return dias.split(',').join(', ');
  }

  private formatTimeDisplay(time: any): string {
    if (!time) return '--:--';
    if (typeof time !== 'string') {
        const d = new Date(time);
        return d.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
    }
    return time.substring(0, 5);
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() + offset).toLocaleDateString('es-GT');
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  abrirModalNuevoTurno(): void {
    this.modoEdicion = false;
    this.turnoEditandoId = null;
    this.nuevoTurno = this.crearFormularioTurnoVacio();
    this.modalNuevoTurno = true;
  }

  abrirModalAsignacion(): void {
    this.nuevaAsignacion = this.crearFormularioAsignacionVacio();
    this.modalNuevaAsignacion = true;
  }

  cerrarModales(): void {
    this.modalNuevoTurno = false;
    this.modalNuevaAsignacion = false;
  }

  guardarTurno(): void {
    this.isSaving = true;
    const payload: Partial<TurnoBackend> = {
      nombre: this.nuevoTurno.nombre,
      horaEntrada: this.ensureSeconds(this.nuevoTurno.entrada),
      horaSalida: this.ensureSeconds(this.nuevoTurno.salida),
      toleranciaMinutos: this.nuevoTurno.tolerancia,
      horasEsperadasDia: this.nuevoTurno.horasEsperadas,
      dias: this.nuevoTurno.dias.join(','),
      activo: this.nuevoTurno.estado === 'Activo'
    };

    if (this.modoEdicion && this.turnoEditandoId !== null) {
      this.adminService.updateShift(this.turnoEditandoId, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.mostrarNotificacion('Turno actualizado correctamente.');
          this.loadTurnos();
          this.cerrarModales();
        },
        error: (err) => {
          this.isSaving = false;
          alert(err.error?.message || 'Error al actualizar');
        }
      });
    } else {
      this.adminService.createShift(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.mostrarNotificacion('Turno creado exitosamente.');
          this.loadTurnos();
          this.cerrarModales();
        },
        error: (err) => {
          this.isSaving = false;
          alert(err.error?.message || 'Error al crear');
        }
      });
    }
  }

  guardarAsignacion(): void {
    if (!this.nuevaAsignacion.empleadoId || !this.nuevaAsignacion.turnoId || !this.nuevaAsignacion.fechaInicio) {
      alert('Complete los campos obligatorios.');
      return;
    }

    this.isSaving = true;
    const payload = {
      ...this.nuevaAsignacion,
      activo: this.nuevaAsignacion.estado === 'Activo'
    };

    this.adminService.assignShift(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.mostrarNotificacion('Turno asignado correctamente.');
        this.loadAssignments();
        this.cerrarModales();
      },
      error: (err) => {
        this.isSaving = false;
        alert(err.error?.message || 'Error al asignar');
      }
    });
  }

  finalizarAsignacion(id: number): void {
    if (confirm('¿Desea finalizar este horario para el colaborador?')) {
      // Usamos el servicio para desactivar (reutilizando lógica de desactivación de asignación)
      this.adminService.assignShift({ id, activo: false }).subscribe({
        next: () => {
          this.mostrarNotificacion('Asignación finalizada.');
          this.loadAssignments();
        }
      });
    }
  }

  private ensureSeconds(timeStr: string): string {
    if (timeStr.split(':').length === 2) {
      return `${timeStr}:00`;
    }
    return timeStr;
  }

  editarTurno(turno: TurnoItem): void {
    this.modoEdicion = true;
    this.turnoEditandoId = turno.id;
    this.nuevoTurno = {
      nombre: turno.nombre,
      entrada: turno.entrada,
      salida: turno.salida,
      tolerancia: parseInt(turno.tolerancia),
      estado: turno.estado,
      horasEsperadas: parseFloat(turno.horas),
      dias: turno.rawDias ? turno.rawDias.split(',') : ['Lun', 'Mar', 'Mie', 'Jue', 'Vie']
    };
    this.modalNuevoTurno = true;
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroEstado = 'Todos los estados';
  }

  get dataFiltrada(): any[] {
    const data = this.tab === 'catalogo' ? this.turnosData : this.asignacionesData;
    const texto = this.filtroBusqueda.trim().toLowerCase();

    return data.filter((item: any) => {
      const nombre = this.tab === 'catalogo' ? item.nombre : item.empleado;
      const coincideBusqueda = !texto || nombre.toLowerCase().includes(texto);
      const coincideEstado = this.filtroEstado === 'Todos los estados' || item.estado === this.filtroEstado;
      return coincideBusqueda && coincideEstado;
    });
  }

  getEstadoClass(estado: string): string {
    return (estado === 'Activo') ? 'estado-badge--active' : 'estado-badge--inactive';
  }

  toggleDia(diaId: string): void {
    const index = this.nuevoTurno.dias.indexOf(diaId);
    if (index > -1) {
      this.nuevoTurno.dias.splice(index, 1);
    } else {
      this.nuevoTurno.dias.push(diaId);
    }
    // Forzar actualización de la UI
    this.nuevoTurno.dias = [...this.nuevoTurno.dias];
    this.cdr.detectChanges();
  }

  isDiaSelected(diaId: string): boolean {
    return this.nuevoTurno.dias.includes(diaId);
  }

  private crearFormularioTurnoVacio(): TurnoForm {
    return {
      nombre: '',
      entrada: '08:00',
      salida: '17:00',
      tolerancia: 15,
      estado: 'Activo',
      horasEsperadas: 8,
      dias: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie']
    };
  }

  private crearFormularioAsignacionVacio(): AsignacionForm {
    return {
      empleadoId: null,
      turnoId: null,
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: '',
      estado: 'Activo'
    };
  }

  private mostrarNotificacion(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mostrarMensajeExito = true;
    setTimeout(() => this.mostrarMensajeExito = false, 3000);
  }
}
