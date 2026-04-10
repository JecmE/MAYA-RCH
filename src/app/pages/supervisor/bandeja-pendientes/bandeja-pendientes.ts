import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type TabType = 'permisos' | 'horas';

interface PermisoItem {
  id: number;
  empleado: string;
  tipo: string;
  fecha: string;
  estado: string;
  urgencia: string;
  dias: number;
}

interface HoraItem {
  id: number;
  empleado: string;
  proyecto: string;
  fecha: string;
  horas: number;
  estado: string;
}

type PendienteItem = PermisoItem | HoraItem;

@Component({
  selector: 'app-bandeja-pendientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bandeja-pendientes.html',
  styleUrl: './bandeja-pendientes.css'
})
export class BandejaPendientes {
  tab: TabType = 'permisos';
  modalOpen = false;
  selectedItem: PendienteItem | null = null;
  filtroEstado = 'Todos';

  permisosData: PermisoItem[] = [
    {
      id: 1,
      empleado: 'Carlos Mérida',
      tipo: 'Vacaciones',
      fecha: '20/03/26 - 25/03/26',
      estado: 'Pendiente',
      urgencia: 'Alta',
      dias: 5
    },
    {
      id: 2,
      empleado: 'Lucía Torres',
      tipo: 'Permiso Médico',
      fecha: '18/03/26 - 18/03/26',
      estado: 'Pendiente',
      urgencia: 'Media',
      dias: 1
    }
  ];

  horasData: HoraItem[] = [
    {
      id: 3,
      empleado: 'Carlos Mérida',
      proyecto: 'CRH',
      fecha: '19/03/26',
      horas: 4,
      estado: 'Pendiente'
    },
    {
      id: 4,
      empleado: 'Mario Paz',
      proyecto: 'RRHH',
      fecha: '18/03/26',
      horas: 2,
      estado: 'Pendiente'
    }
  ];

  setTab(tab: TabType): void {
    this.tab = tab;
  }

  handleVerDetalle(item: PendienteItem): void {
    this.selectedItem = item;
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.selectedItem = null;
  }

  get datosFiltrados(): PendienteItem[] {
    const data = this.tab === 'permisos' ? this.permisosData : this.horasData;
    return data.filter(item => this.filtroEstado === 'Todos' || item.estado === this.filtroEstado);
  }

  isPermiso(item: PendienteItem): item is PermisoItem {
    return this.tab === 'permisos';
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Pendiente':
        return 'estado estado-pendiente';
      case 'Aprobado':
        return 'estado estado-aprobado';
      default:
        return 'estado estado-rechazado';
    }
  }

  getUrgenciaClass(urgencia: string): string {
    return urgencia === 'Alta'
      ? 'urgencia urgencia-alta'
      : 'urgencia urgencia-media';
  }
}