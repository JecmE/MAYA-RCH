import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectsService, Proyecto } from '../../../services/projects.service';
import { UsersService, Empleado } from '../../../services/users.service';

interface ProyectoItem {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  responsable: string;
  estado: string;
  totalEmpleados: number;
  horasAcumuladas: number;
  activo: boolean;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proyectos.html',
  styleUrl: './proyectos.css',
})
export class Proyectos implements OnInit {
  proyectos: ProyectoItem[] = [];
  empleados: Empleado[] = [];
  adminStaff: any[] = []; // Para el selector de responsables

  filtroBusqueda: string = '';
  filtroEstado: string = 'Todos';

  modalNuevo: boolean = false;
  modalDetalle: boolean = false;
  modalAsignar: boolean = false;

  modoEdicion: boolean = false;

  proyectoForm: any = this.getProyectoVacio();
  asignacionForm: any = { empleadoId: 0, fechaInicio: this.getTodayISO(), fechaFin: '' };

  proyectoSeleccionado: any = null;
  mostrarMensajeExito: boolean = false;
  mensajeExito: string = '';

  constructor(
    private router: Router,
    private projectsService: ProjectsService,
    private usersService: UsersService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.projectsService.getAll().subscribe({
      next: (data: Proyecto[]) => {
        this.proyectos = data.map(p => ({
          id: p.proyectoId!,
          codigo: p.codigo,
          nombre: p.nombre,
          descripcion: p.descripcion || '-',
          responsable: p.responsable || 'Sin asignar',
          estado: p.activo ? 'Activo' : 'Cerrado',
          totalEmpleados: (p as any).totalEmpleados || 0,
          horasAcumuladas: (p as any).horasAcumuladas || 0,
          activo: p.activo
        }));
        this.cdr.detectChanges();
      }
    });

    this.usersService.getAll('true').subscribe({
      next: (data: Empleado[]) => {
        this.empleados = data;
        this.cdr.detectChanges();
      }
    });

    this.projectsService.getAdminStaff().subscribe({
      next: (data) => {
        this.adminStaff = data;
        this.cdr.detectChanges();
      }
    });
  }

  get proyectosFiltrados(): ProyectoItem[] {
    return this.proyectos.filter(p => {
      const matchBusqueda = !this.filtroBusqueda ||
                            p.nombre.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
                            p.codigo.toLowerCase().includes(this.filtroBusqueda.toLowerCase());
      const matchEstado = this.filtroEstado === 'Todos' || p.estado === this.filtroEstado;
      return matchBusqueda && matchEstado;
    });
  }

  abrirNuevo(): void {
    this.modoEdicion = false;
    this.proyectoForm = this.getProyectoVacio();
    this.modalNuevo = true;
  }

  editarProyecto(p: ProyectoItem): void {
    this.modoEdicion = true;
    this.proyectoForm = {
      proyectoId: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion,
      responsable: p.responsable,
      activo: p.activo
    };
    this.modalNuevo = true;
  }

  guardarProyecto(): void {
    const action = this.modoEdicion
      ? this.projectsService.update(this.proyectoForm.proyectoId, this.proyectoForm)
      : this.projectsService.create(this.proyectoForm);

    action.subscribe({
      next: () => {
        this.notificar('Proyecto guardado correctamente.');
        this.modalNuevo = false;
        this.loadData();
      },
      error: (err) => alert(err.error?.message || 'Error al guardar')
    });
  }

  verDetalle(p: ProyectoItem): void {
    this.projectsService.getById(p.id).subscribe({
      next: (data: any) => {
        this.proyectoSeleccionado = data;
        this.modalDetalle = true;
        this.cdr.detectChanges();
      }
    });
  }

  abrirAsignar(p: ProyectoItem): void {
    this.proyectoSeleccionado = p;
    this.asignacionForm = {
      proyectoId: p.id,
      empleadoId: 0,
      fechaInicio: this.getTodayISO(),
      fechaFin: ''
    };
    this.modalAsignar = true;
  }

  guardarAsignacion(): void {
    if (!this.asignacionForm.empleadoId || !this.asignacionForm.fechaInicio) {
      alert('Seleccione empleado y fecha de inicio.');
      return;
    }

    this.projectsService.assignEmployee(this.asignacionForm).subscribe({
      next: () => {
        this.notificar('Empleado asignado al proyecto.');
        this.modalAsignar = false;
        this.loadData();
      },
      error: (err) => alert(err.error?.message || 'Error al asignar')
    });
  }

  desvincular(empProyId: number): void {
    if (!confirm('¿Seguro que desea desvincular a este empleado del proyecto?')) return;
    this.projectsService.unassignEmployee(empProyId).subscribe({
      next: () => {
        this.notificar('Empleado desvinculado.');
        this.modalDetalle = false;
        this.loadData();
      }
    });
  }

  desactivarProyecto(p: ProyectoItem): void {
    if (!confirm(`¿Seguro que desea cerrar el proyecto ${p.nombre}?`)) return;
    this.projectsService.delete(p.id).subscribe({
      next: () => {
        this.notificar('Proyecto cerrado.');
        this.loadData();
      }
    });
  }

  private notificar(msg: string): void {
    this.mensajeExito = msg;
    this.mostrarMensajeExito = true;
    setTimeout(() => this.mostrarMensajeExito = false, 3000);
  }

  private getProyectoVacio() {
    return { codigo: '', nombre: '', descripcion: '', responsable: '', activo: true };
  }

  private getTodayISO(): string {
    return new Date().toISOString().split('T')[0];
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
