import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, Rol } from '../../../services/admin.service';

interface PermisoItem {
  modulo: string;
  ver: boolean;
  crear: boolean;
  editar: boolean;
  aprobar: boolean;
  exportar: boolean;
  administrar: boolean;
}

type PermisoKey = 'ver' | 'crear' | 'editar' | 'aprobar' | 'exportar' | 'administrar';

@Component({
  selector: 'app-roles-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles-permisos.html',
  styleUrl: './roles-permisos.css',
})
export class RolesPermisos implements OnInit {
  roles: string[] = ['Administrador', 'Supervisor', 'RRHH', 'Empleado'];
  activeRole = 'Administrador';

  editandoMatriz = false;
  mostrarModalNuevoRol = false;
  mostrarModalEliminarRol = false;
  mostrarMensajeExito = false;
  mensajeExito = '';

  nuevoRol = '';
  rolAEliminar = '';

  permisosPorRol: Record<string, PermisoItem[]> = {
    Administrador: [
      {
        modulo: 'Usuarios',
        ver: true,
        crear: true,
        editar: true,
        aprobar: false,
        exportar: true,
        administrar: true,
      },
      {
        modulo: 'Empleados',
        ver: true,
        crear: true,
        editar: true,
        aprobar: false,
        exportar: true,
        administrar: true,
      },
      {
        modulo: 'Permisos',
        ver: true,
        crear: true,
        editar: true,
        aprobar: true,
        exportar: true,
        administrar: true,
      },
      {
        modulo: 'Planilla',
        ver: true,
        crear: true,
        editar: true,
        aprobar: true,
        exportar: true,
        administrar: true,
      },
      {
        modulo: 'Reportes',
        ver: true,
        crear: false,
        editar: false,
        aprobar: false,
        exportar: true,
        administrar: true,
      },
    ],
    Supervisor: [
      {
        modulo: 'Usuarios',
        ver: false,
        crear: false,
        editar: false,
        aprobar: false,
        exportar: false,
        administrar: false,
      },
      {
        modulo: 'Empleados',
        ver: true,
        crear: false,
        editar: true,
        aprobar: false,
        exportar: false,
        administrar: false,
      },
      {
        modulo: 'Permisos',
        ver: true,
        crear: false,
        editar: false,
        aprobar: true,
        exportar: true,
        administrar: false,
      },
      {
        modulo: 'Planilla',
        ver: false,
        crear: false,
        editar: false,
        aprobar: false,
        exportar: false,
        administrar: false,
      },
      {
        modulo: 'Reportes',
        ver: true,
        crear: false,
        editar: false,
        aprobar: false,
        exportar: true,
        administrar: false,
      },
    ],
    RRHH: [
      {
        modulo: 'Usuarios',
        ver: true,
        crear: true,
        editar: true,
        aprobar: false,
        exportar: false,
        administrar: false,
      },
      {
        modulo: 'Empleados',
        ver: true,
        crear: true,
        editar: true,
        aprobar: false,
        exportar: true,
        administrar: false,
      },
      {
        modulo: 'Permisos',
        ver: true,
        crear: true,
        editar: true,
        aprobar: true,
        exportar: true,
        administrar: false,
      },
      {
        modulo: 'Planilla',
        ver: true,
        crear: false,
        editar: true,
        aprobar: false,
        exportar: true,
        administrar: false,
      },
      {
        modulo: 'Reportes',
        ver: true,
        crear: false,
        editar: false,
        aprobar: false,
        exportar: true,
        administrar: false,
      },
    ],
    Empleado: [
      {
        modulo: 'Usuarios',
        ver: false,
        crear: false,
        editar: false,
        aprobar: false,
        exportar: false,
        administrar: false,
      },
      {
        modulo: 'Empleados',
        ver: true,
        crear: false,
        editar: false,
        aprobar: false,
        exportar: false,
        administrar: false,
      },
      {
        modulo: 'Permisos',
        ver: true,
        crear: true,
        editar: false,
        aprobar: false,
        exportar: false,
        administrar: false,
      },
      {
        modulo: 'Planilla',
        ver: true,
        crear: false,
        editar: false,
        aprobar: false,
        exportar: true,
        administrar: false,
      },
      {
        modulo: 'Reportes',
        ver: true,
        crear: false,
        editar: false,
        aprobar: false,
        exportar: true,
        administrar: false,
      },
    ],
  };

  constructor(
    private router: Router,
    private adminService: AdminService,
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  private loadRoles(): void {
    this.adminService.getRoles().subscribe({
      next: (data: Rol[]) => {
        const apiRoles = data.map((r) => r.nombre);
        this.roles = [...new Set(['Administrador', 'Supervisor', 'RRHH', 'Empleado', ...apiRoles])];
      },
      error: () => {},
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  setActiveRole(rol: string): void {
    this.activeRole = rol;
    this.editandoMatriz = false;
  }

  get permisosData(): PermisoItem[] {
    return this.permisosPorRol[this.activeRole] || [];
  }

  get puedeEliminarRolActivo(): boolean {
    return !['Administrador', 'Supervisor', 'RRHH', 'Empleado'].includes(this.activeRole);
  }

  toggleEditarMatriz(): void {
    if (this.editandoMatriz) {
      this.editandoMatriz = false;
      this.mostrarNotificacion(`Matriz de permisos actualizada para ${this.activeRole}.`);
      return;
    }

    this.editandoMatriz = true;
  }

  togglePermiso(row: PermisoItem, key: PermisoKey): void {
    if (!this.editandoMatriz) {
      return;
    }

    row[key] = !row[key];
  }

  abrirModalNuevoRol(): void {
    this.nuevoRol = '';
    this.mostrarModalNuevoRol = true;
  }

  cerrarModalNuevoRol(): void {
    this.mostrarModalNuevoRol = false;
    this.nuevoRol = '';
  }

  crearNuevoRol(): void {
    const nombreRol = this.nuevoRol.trim();

    if (!nombreRol) {
      return;
    }

    const yaExiste = this.roles.some((rol) => rol.toLowerCase() === nombreRol.toLowerCase());

    if (yaExiste) {
      this.mostrarNotificacion('Ese rol ya existe.');
      return;
    }

    this.roles = [...this.roles, nombreRol];
    this.permisosPorRol[nombreRol] = this.crearPermisosBase();
    this.activeRole = nombreRol;

    this.cerrarModalNuevoRol();
    this.mostrarNotificacion(`Rol "${nombreRol}" creado correctamente.`);
  }

  abrirModalEliminarRol(): void {
    if (!this.puedeEliminarRolActivo) {
      this.mostrarNotificacion('Este rol base no se puede eliminar.');
      return;
    }

    this.rolAEliminar = this.activeRole;
    this.mostrarModalEliminarRol = true;
  }

  cerrarModalEliminarRol(): void {
    this.mostrarModalEliminarRol = false;
    this.rolAEliminar = '';
  }

  eliminarRol(): void {
    if (!this.rolAEliminar) {
      return;
    }

    if (!this.puedeEliminarRolActivo) {
      this.mostrarNotificacion('Este rol base no se puede eliminar.');
      this.cerrarModalEliminarRol();
      return;
    }

    const rolEliminado = this.rolAEliminar;

    this.roles = this.roles.filter((rol) => rol !== rolEliminado);
    delete this.permisosPorRol[rolEliminado];

    this.activeRole = this.roles.length ? this.roles[0] : '';
    this.editandoMatriz = false;

    this.cerrarModalEliminarRol();
    this.mostrarNotificacion(`Rol "${rolEliminado}" eliminado correctamente.`);
  }

  private crearPermisosBase(): PermisoItem[] {
    return [
      {
        modulo: 'Usuarios',
        ver: false,
        crear: false,
        editar: false,
        aprobar: false,
        exportar: false,
        administrar: false,
      },
      {
        modulo: 'Empleados',
        ver: false,
        crear: false,
        editar: false,
        aprobar: false,
        exportar: false,
        administrar: false,
      },
      {
        modulo: 'Permisos',
        ver: false,
        crear: false,
        editar: false,
        aprobar: false,
        exportar: false,
        administrar: false,
      },
      {
        modulo: 'Planilla',
        ver: false,
        crear: false,
        editar: false,
        aprobar: false,
        exportar: false,
        administrar: false,
      },
      {
        modulo: 'Reportes',
        ver: false,
        crear: false,
        editar: false,
        aprobar: false,
        exportar: false,
        administrar: false,
      },
    ];
  }

  private mostrarNotificacion(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mostrarMensajeExito = true;

    setTimeout(() => {
      this.mostrarMensajeExito = false;
      this.mensajeExito = '';
    }, 3000);
  }
}
