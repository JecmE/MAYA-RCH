import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, Rol, PermisoItem } from '../../../services/admin.service';

type PermisoKey = 'ver' | 'crear' | 'editar' | 'aprobar' | 'exportar' | 'administrar';

@Component({
  selector: 'app-roles-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles-permisos.html',
  styleUrl: './roles-permisos.css',
})
export class RolesPermisos implements OnInit {
  rolesList: Rol[] = [];
  activeRolObj: Rol | null = null;
  permisosData: PermisoItem[] = [];

  editandoMatriz = false;
  isLoading = false;
  isSaving = false;

  mostrarModalNuevoRol = false;
  mostrarModalEliminarRol = false;
  mostrarMensajeExito = false;
  mensajeExito = '';

  nuevoRolNombre = '';
  nuevoRolDesc = '';
  rolAEliminar: Rol | null = null;

  constructor(
    private router: Router,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.isLoading = true;
    this.adminService.getRoles().subscribe({
      next: (data) => {
        this.rolesList = data;
        if (this.rolesList.length > 0) {
          const lastActive = localStorage.getItem('activeRolId');
          const found = this.rolesList.find(r => r.rolId === Number(lastActive));
          this.setActiveRole(found || this.rolesList[0]);
        } else {
          this.isLoading = false;
        }
        this.cdr.detectChanges();
      },
      error: () => this.isLoading = false
    });
  }

  setActiveRole(rol: Rol): void {
    this.activeRolObj = rol;
    localStorage.setItem('activeRolId', rol.rolId.toString());
    this.editandoMatriz = false;
    this.loadPermissions(rol.rolId);
  }

  private loadPermissions(rolId: number): void {
    this.isLoading = true;
    this.adminService.getRolePermissions(rolId).subscribe({
      next: (perms) => {
        this.permisosData = perms;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleEditarMatriz(): void {
    if (this.editandoMatriz) {
      this.guardarPermisos();
      return;
    }
    this.editandoMatriz = true;
  }

  guardarPermisos(): void {
    if (!this.activeRolObj) return;

    this.isSaving = true;
    this.adminService.updateRolePermissions(this.activeRolObj.rolId, this.permisosData).subscribe({
      next: () => {
        this.isSaving = false;
        this.editandoMatriz = false;
        this.mostrarNotificacion('Matriz de permisos actualizada correctamente.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSaving = false;
        this.mostrarNotificacion('Error al guardar cambios.');
        this.cdr.detectChanges();
      }
    });
  }

  togglePermiso(row: PermisoItem, key: PermisoKey): void {
    if (!this.editandoMatriz) return;
    row[key] = !row[key];
    this.cdr.detectChanges();
  }

  abrirModalNuevoRol(): void {
    this.nuevoRolNombre = '';
    this.nuevoRolDesc = '';
    this.mostrarModalNuevoRol = true;
  }

  cerrarModalNuevoRol(): void {
    this.mostrarModalNuevoRol = false;
  }

  crearNuevoRol(): void {
    if (!this.nuevoRolNombre.trim()) return;

    this.isSaving = true;
    this.adminService.createRole({
      nombre: this.nuevoRolNombre,
      descripcion: this.nuevoRolDesc
    }).subscribe({
      next: (newRol) => {
        this.isSaving = false;
        this.rolesList.push(newRol);
        this.setActiveRole(newRol);
        this.cerrarModalNuevoRol();
        this.mostrarNotificacion(`Rol "${newRol.nombre}" creado exitosamente.`);
      },
      error: (err) => {
        this.isSaving = false;
        alert(err.error?.message || 'Fallo al crear rol.');
      }
    });
  }

  abrirModalEliminarRol(): void {
    if (!this.activeRolObj) return;
    if (['Administrador', 'Supervisor', 'RRHH', 'Empleado'].includes(this.activeRolObj.nombre)) {
      alert('Restricción: Los roles base del sistema no pueden ser eliminados.');
      return;
    }
    this.rolAEliminar = this.activeRolObj;
    this.mostrarModalEliminarRol = true;
  }

  cerrarModalEliminarRol(): void {
    this.mostrarModalEliminarRol = false;
    this.rolAEliminar = null;
  }

  eliminarRol(): void {
    if (!this.rolAEliminar) return;

    this.isSaving = true;
    this.adminService.deleteRole(this.rolAEliminar.rolId).subscribe({
      next: () => {
        this.isSaving = false;
        this.rolesList = this.rolesList.filter(r => r.rolId !== this.rolAEliminar?.rolId);
        if (this.rolesList.length > 0) {
          this.setActiveRole(this.rolesList[0]);
        }
        this.cerrarModalEliminarRol();
        this.mostrarNotificacion('Rol eliminado de la base de datos.');
      },
      error: () => {
        this.isSaving = false;
        alert('Error al intentar eliminar el rol.');
      }
    });
  }

  private mostrarNotificacion(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mostrarMensajeExito = true;
    setTimeout(() => {
      this.mostrarMensajeExito = false;
    }, 3000);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
