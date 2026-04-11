import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsersService, Empleado } from '../../../services/users.service';

interface UsuarioItem {
  id: number;
  nombre: string;
  usuario: string;
  correo: string;
  rol: string;
  estado: string;
  empleado: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  modalNuevoUsuario = false;

  usuariosData: UsuarioItem[] = [];

  constructor(
    private router: Router,
    private usersService: UsersService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.usersService.getAll().subscribe({
      next: (data: Empleado[]) => {
        this.usuariosData = data.map((emp) => this.mapEmpleadoToUsuario(emp));
      },
      error: () => {
        this.usuariosData = [];
      },
    });
  }

  private mapEmpleadoToUsuario(emp: Empleado): UsuarioItem {
    return {
      id: emp.empleadoId ?? 0,
      nombre: emp.nombreCompleto || `${emp.nombres} ${emp.apellidos}`.trim(),
      usuario: emp.email?.split('@')[0] || `user${emp.empleadoId}`,
      correo: emp.email || '',
      rol: emp.puesto || 'Empleado',
      estado: emp.activo ? 'Activo' : 'Inactivo',
      empleado: emp.codigoEmpleado || `EMP-${emp.empleadoId}`,
    };
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  openNuevoUsuario(): void {
    this.modalNuevoUsuario = true;
  }

  closeNuevoUsuario(): void {
    this.modalNuevoUsuario = false;
  }

  getRolClass(rol: string): string {
    if (rol === 'Administrador') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (rol === 'RRHH') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (rol === 'Supervisor') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  }

  getEstadoClass(estado: string): string {
    if (estado === 'Activo') return 'bg-emerald-50 text-emerald-700';
    if (estado === 'Bloqueado') return 'bg-red-50 text-red-700';
    return 'bg-slate-100 text-slate-600';
  }
}
