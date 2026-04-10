import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface SolicitudItem {
  id: number;
  date: string;
  type: string;
  period: string;
  status: string;
  comments: string;
}

@Component({
  selector: 'app-solicitud-permiso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitud-permiso.html',
  styleUrls: ['./solicitud-permiso.css'],
})
export class SolicitudPermiso {
  modalOpen = false;
  successModalOpen = false;
  detailsModalOpen = false;
  selectedRequest: SolicitudItem | null = null;

  tipoPermiso = '';
  fechaInicio = '';
  fechaFin = '';
  motivo = '';
  tiempo: number | null = null;
  unidadTiempo = 'dias';
  filtroEstado = 'Todas';

  solicitudesData: SolicitudItem[] = [
    {
      id: 1,
      date: '03/15/2026',
      type: 'Vacaciones',
      period: '03/20/26 - 03/25/26',
      status: 'Aprobada',
      comments: 'Disfruta tus vacaciones',
    },
    {
      id: 2,
      date: '03/01/2026',
      type: 'Permiso Médico',
      period: '03/02/26 - 03/02/26',
      status: 'Aprobada',
      comments: 'Certificado recibido',
    },
    {
      id: 3,
      date: '02/10/2026',
      type: 'Día personal',
      period: '02/15/26 - 02/15/26',
      status: 'Rechazada',
      comments: 'Alta demanda operativa',
    },
  ];

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/']);
  }

  openAttachModal(): void {
    this.modalOpen = true;
  }

  closeAttachModal(): void {
    this.modalOpen = false;
  }

  openSuccessModal(): void {
    this.successModalOpen = true;
  }

  closeSuccessModal(): void {
    this.successModalOpen = false;
  }

  openDetailsModal(request: SolicitudItem): void {
    this.selectedRequest = request;
    this.detailsModalOpen = true;
  }

  closeDetailsModal(): void {
    this.detailsModalOpen = false;
    this.selectedRequest = null;
  }

  limpiarFormulario(): void {
    this.tipoPermiso = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.motivo = '';
    this.tiempo = null;
    this.unidadTiempo = 'dias';
  }

  get solicitudesFiltradas(): SolicitudItem[] {
    if (this.filtroEstado === 'Todas') {
      return this.solicitudesData;
    }

    return this.solicitudesData.filter((item) => item.status === this.filtroEstado);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Aprobada':
        return 'status-approved';
      case 'Pendiente':
        return 'status-pending';
      case 'Rechazada':
        return 'status-rejected';
      default:
        return 'status-default';
    }
  }
}
