import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, Rol } from '../../../services/admin.service';
import { UsersService, Empleado } from '../../../services/users.service';

interface UsuarioItem {
  usuarioId: number;
  nombre: string;
  usuario: string;
  correo: string;
  roles: string[];
  estado: string;
  empleado: string;
  empleadoId: number;
  supervisorId?: number;
  supervisorNombre?: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  usuariosData: UsuarioItem[] = [];
  rolesList: Rol[] = [];
  empleadosList: Empleado[] = [];

  filtroBusqueda = '';
  filtroEstado = 'Todos los estados';
  filtroRol = 'Todos los roles';

  modalUsuario = false;
  modalDetalle = false;
  modoEdicion = false;
  isLoading = false;
  isSaving = false;

  usuarioForm = {
    usuarioId: 0,
    empleadoId: null as number | null, // Dueño de la cuenta (Persona)
    username: '',
    password: '',
    roleId: null as number | null,
    bossId: null as number | null, // Jefe inmediato
    estado: 'activo'
  };

  usuarioSeleccionado: UsuarioItem | null = null;

  constructor(
    private router: Router,
    private adminService: AdminService,
    private usersService: UsersService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.isLoading = true;
    this.loadUsers();
    this.adminService.getRoles().subscribe(roles => this.rolesList = roles);
    this.usersService.getAll('true').subscribe(emps => {
      this.empleadosList = emps;
      this.cdr.detectChanges();
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getUsers().subscribe({
      next: (data) => {
        this.usuariosData = data.map(u => ({
          usuarioId: u.usuarioId,
          nombre: u.nombreCompleto,
          usuario: u.username,
          correo: u.email,
          roles: u.roles,
          estado: u.estado.toLowerCase() === 'activo' ? 'Activo' : 'Inactivo',
          empleado: u.empleadoCodigo || 'N/A',
          empleadoId: u.empleadoId,
          supervisorId: u.supervisorId,
          supervisorNombre: u.supervisorNombre
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getRoleName(id: number | null): string {
    if (!id) return '';
    return this.rolesList.find(r => r.rolId === id)?.nombre || '';
  }

  // LISTA DE JEFES BASADA EN ROL DE SISTEMA (Super -> RRHH -> Admin)
  get jefesPorJerarquia(): UsuarioItem[] {
    const rolSeleccionado = this.getRoleName(this.usuarioForm.roleId);

    if (rolSeleccionado === 'Administrador' || !rolSeleccionado) return [];

    return this.usuariosData.filter(u => {
        if (this.modoEdicion && u.usuarioId === this.usuarioForm.usuarioId) return false;

        if (rolSeleccionado === 'Empleado') {
            // Empleado -> Sus jefes son los que tienen ROL de Supervisor
            return u.roles.includes('Supervisor');
        }

        if (rolSeleccionado === 'Supervisor') {
            // Supervisor -> Sus jefes son RRHH
            return u.roles.includes('RRHH');
        }

        if (rolSeleccionado === 'RRHH') {
            // RRHH -> Sus jefes son Administradores
            return u.roles.includes('Administrador');
        }

        return false;
    });
  }

  get dataFiltrada(): UsuarioItem[] {
    const texto = this.filtroBusqueda.toLowerCase().trim();
    return this.usuariosData.filter(u => {
      const coincideBusqueda = !texto ||
        u.nombre.toLowerCase().includes(texto) ||
        u.usuario.toLowerCase().includes(texto) ||
        u.correo?.toLowerCase().includes(texto);

      const coincideEstado = this.filtroEstado === 'Todos los estados' || u.estado === this.filtroEstado;
      const coincideRol = this.filtroRol === 'Todos los roles' || u.roles.includes(this.filtroRol);

      return coincideBusqueda && coincideEstado && coincideRol;
    });
  }

  openNuevoUsuario(): void {
    this.modoEdicion = false;
    this.usuarioForm = {
      usuarioId: 0,
      empleadoId: null,
      username: '',
      password: '',
      roleId: null,
      bossId: null,
      estado: 'activo'
    };
    this.modalUsuario = true;
  }

  editarUsuario(u: UsuarioItem): void {
    this.modoEdicion = true;
    const currentRoleId = this.rolesList.find(r => u.roles.includes(r.nombre))?.rolId || null;

    this.usuarioForm = {
      usuarioId: u.usuarioId,
      empleadoId: u.empleadoId,
      username: u.usuario,
      password: '',
      roleId: currentRoleId,
      bossId: u.supervisorId || null,
      estado: u.estado.toLowerCase() === 'activo' ? 'activo' : 'inactivo'
    };
    this.modalUsuario = true;
  }

  verDetalle(u: UsuarioItem): void {
    this.usuarioSeleccionado = u;
    this.modalDetalle = true;
  }

  cerrarModales(): void {
    this.modalUsuario = false;
    this.modalDetalle = false;
    this.isSaving = false;
  }

  guardarUsuario(): void {
    if (!this.usuarioForm.username || (!this.modoEdicion && !this.usuarioForm.password) || !this.usuarioForm.empleadoId || !this.usuarioForm.roleId) {
      alert('Error: Debe seleccionar la persona, el identificador y el rol de acceso.');
      return;
    }

    this.isSaving = true;
    const request = this.modoEdicion
        ? this.adminService.updateUser(this.usuarioForm.usuarioId, this.usuarioForm)
        : this.adminService.createUser(this.usuarioForm);

    request.subscribe({
      next: () => {
        this.loadUsers();
        this.cerrarModales();
      },
      error: (err) => {
        this.isSaving = false;
        alert(err.error?.message || 'Error de datos duplicados. Intente con otro usuario.');
      }
    });
  }

  toggleBloqueo(u: UsuarioItem): void {
    const nuevoEstado = u.estado === 'Activo' ? 'inactivo' : 'activo';
    this.adminService.toggleUserStatus(u.usuarioId, nuevoEstado).subscribe({
      next: () => this.loadUsers(),
      error: () => alert('Fallo al actualizar el estado de cuenta.')
    });
  }

  resetPassword(u: UsuarioItem): void {
    if (confirm(`¿Restablecer clave para @${u.usuario}?\nClave temporal: Test1234`)) {
      this.adminService.resetPassword(u.usuarioId).subscribe(res => {
        alert('Contraseña restablecida correctamente.');
      });
    }
  }

  getRolClass(rol: string): string {
    if (rol === 'Administrador') return 'badge--purple';
    if (rol === 'RRHH') return 'badge--blue';
    if (rol === 'Supervisor') return 'badge--amber';
    return 'badge--slate';
  }

  getEstadoClass(estado: string): string {
    return estado === 'Activo' ? 'status--active' : 'status--inactive';
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
