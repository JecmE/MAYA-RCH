import { Component } from '@angular/core';
import { Router } from '@angular/router';

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
export class Usuarios {
  modalNuevoUsuario = false;

  usuariosData: UsuarioItem[] = [
    { id: 1, nombre: 'Carlos Mérida', usuario: 'cmerida', correo: 'carlos.m@empresa.com', rol: 'RRHH', estado: 'Activo', empleado: 'EMP-001' },
    { id: 2, nombre: 'Lucía Torres', usuario: 'ltorres', correo: 'ltorres@empresa.com', rol: 'Supervisor', estado: 'Activo', empleado: 'EMP-002' },
    { id: 3, nombre: 'Ana López', usuario: 'alopez', correo: 'ana.lopez@empresa.com', rol: 'Empleado', estado: 'Bloqueado', empleado: 'EMP-003' },
    { id: 4, nombre: 'Admin Sistema', usuario: 'admin', correo: 'admin@empresa.com', rol: 'Administrador', estado: 'Activo', empleado: 'N/A' },
  ];

  constructor(private router: Router) {}

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