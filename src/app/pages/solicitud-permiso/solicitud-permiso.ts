import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import {
  LeavesService,
  TipoPermiso,
  SolicitudPermiso as SolicitudBackend,
  AdjuntoSolicitud,
} from '../../services/leaves.service';

interface SolicitudItem {
  id: number;
  date: string;
  type: string;
  period: string;
  status: string;
  comments: string;
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
  decision?: {
    revisadoPor?: string;
    comentario?: string;
    fechaDecision?: string;
  };
  adjuntos?: AdjuntoSolicitud[];
}

@Component({
  selector: 'app-solicitud-permiso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitud-permiso.html',
  styleUrls: ['./solicitud-permiso.css'],
})
export class SolicitudPermiso implements OnInit, OnDestroy {
  private routerSubscription?: Subscription;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  isBrowser: boolean;

  modalOpen = false;
  successModalOpen = false;
  detailsModalOpen = false;
  selectedRequest: SolicitudItem | null = null;
  warningModalOpen = false;
  warningMessage = '';
  backendErrorModalOpen = false;
  backendErrorMessage = '';

  tipoPermiso = '';
  fechaInicio = '';
  fechaFin = '';
  motivo = '';
  filtroEstado = 'Todas';

  selectedFileName: string | null = null;
  selectedFile: File | null = null;

  solicitudesData: SolicitudItem[] = [];
  tiposPermiso: TipoPermiso[] = [];

  vacationBalance = { diasDisponibles: 0, diasUsados: 0, diasTotales: 0 };

  constructor(
    private router: Router,
    private leavesService: LeavesService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadAllData();
      this.routerSubscription = this.router.events
        .pipe(filter((e) => e instanceof NavigationEnd))
        .subscribe((event) => {
          if ((event as NavigationEnd).urlAfterRedirects === '/solicitudes') {
            this.loadAllData();
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private loadAllData(): void {
    this.loadTiposPermiso();
    this.loadSolicitudes();
    this.loadVacationBalance();
  }

  private loadTiposPermiso(): void {
    this.leavesService.getTypes().subscribe({
      next: (tipos) => {
        this.tiposPermiso = tipos;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando tipos:', err),
    });
  }

  private loadSolicitudes(): void {
    this.leavesService.getMyRequests().subscribe({
      next: (solicitudes) => {
        this.solicitudesData = solicitudes.map((s) => this.mapToItem(s));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando solicitudes:', err);
        this.solicitudesData = [];
        this.cdr.detectChanges();
      },
    });
  }

  private loadVacationBalance(): void {
    this.leavesService.getVacationBalance().subscribe({
      next: (balance: any) => {
        this.vacationBalance = {
          diasDisponibles: balance.diasDisponibles || 0,
          diasUsados: balance.diasUsados || 0,
          diasTotales: balance.diasTotales || 0,
        };
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  private mapToItem(s: SolicitudBackend): SolicitudItem {
    const decision = s.decisiones && s.decisiones.length > 0 ? s.decisiones[0] : undefined;
    return {
      id: s.solicitudId || 0,
      date: s.fechaSolicitud ? new Date(s.fechaSolicitud).toLocaleDateString('es-GT') : '',
      type: typeof s.tipoPermiso === 'string' ? s.tipoPermiso : s.tipoPermiso?.nombre || 'Permiso',
      period: `${this.formatDateSimple(s.fechaInicio)} - ${this.formatDateSimple(s.fechaFin)}`,
      status: this.capitalize(s.estado),
      comments: s.motivo || '',
      fechaInicio: s.fechaInicio || '',
      fechaFin: s.fechaFin || '',
      motivo: s.motivo || '',
      decision: decision
        ? {
            revisadoPor: decision.comentario || '',
            comentario: decision.comentario || '',
            fechaDecision: decision.fechaHora || '',
          }
        : undefined,
      adjuntos: s.adjuntos,
    };
  }

  private capitalize(str: string): string {
    if (!str) return 'Pendiente';
    const s = str.toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private formatDateSimple(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    const userTimezoneOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() + userTimezoneOffset).toLocaleDateString('es-GT');
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.selectedFileName = input.files[0].name;
      this.cdr.detectChanges();
    }
  }

  clearFile(): void {
    this.selectedFile = null;
    this.selectedFileName = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.cdr.detectChanges();
  }

  closeSuccessModal(): void {
    this.successModalOpen = false;
  }

  closeWarningModal(): void {
    this.warningModalOpen = false;
    this.warningMessage = '';
  }

  closeBackendErrorModal(): void {
    this.backendErrorModalOpen = false;
    this.backendErrorMessage = '';
  }

  openDetailsModal(request: SolicitudItem): void {
    this.selectedRequest = request;
    this.detailsModalOpen = true;
  }

  closeDetailsModal(): void {
    this.detailsModalOpen = false;
    this.selectedRequest = null;
  }

  private calculateDaysRequested(): number {
    if (!this.fechaInicio || !this.fechaFin) return 0;
    const start = new Date(this.fechaInicio);
    const end = new Date(this.fechaFin);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  guardarSolicitud(): void {
    if (!this.tipoPermiso || !this.fechaInicio || !this.fechaFin) {
      this.warningMessage =
        'Por favor completa todos los campos obligatorios: tipo, fecha inicio y fecha fin';
      this.warningModalOpen = true;
      return;
    }

    const tipo = this.tiposPermiso.find((t) => t.nombre === this.tipoPermiso);

    if (!tipo) {
      this.warningMessage = 'Tipo de permiso no válido';
      this.warningModalOpen = true;
      return;
    }

    if (tipo.requiereDocumento && !this.selectedFile) {
      this.warningMessage = `El tipo "${tipo.nombre}" requiere adjuntar un documento.`;
      this.warningModalOpen = true;
      return;
    }

    const daysRequested = this.calculateDaysRequested();

    if (daysRequested <= 0) {
      this.warningMessage = 'El rango de fechas no es válido';
      this.warningModalOpen = true;
      return;
    }

    if (tipo.descuentaVacaciones) {
      const daysAvailable = this.vacationBalance?.diasDisponibles ?? 0;
      if (daysAvailable <= 0 || daysRequested > daysAvailable) {
        this.warningMessage = `No tienes suficientes días de vacaciones (${daysAvailable} disponibles).`;
        this.warningModalOpen = true;
        return;
      }
    }

    if (!this.motivo || this.motivo.trim().length < 10) {
      this.warningMessage = 'Por favor ingresa un motivo con al menos 10 caracteres';
      this.warningModalOpen = true;
      return;
    }

    const requestData: any = {
      tipoPermisoId: tipo.tipoPermisoId,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      motivo: this.motivo,
    };

    if (this.selectedFile) {
      this.fileToBase64(this.selectedFile).then((base64) => {
        requestData.archivo = base64;
        requestData.nombreArchivo = this.selectedFileName;
        requestData.tipoMime = this.selectedFile?.type || 'application/octet-stream';
        this.sendRequest(requestData);
      });
    } else {
      this.sendRequest(requestData);
    }
  }

  private sendRequest(requestData: any): void {
    this.leavesService.createRequest(requestData).subscribe({
      next: () => {
        this.successModalOpen = true;
        this.limpiarFormulario();
        this.loadAllData();
      },
      error: (err) => {
        this.backendErrorMessage = err.error?.message || 'Error al crear la solicitud';
        this.backendErrorModalOpen = true;
        this.cdr.detectChanges();
      },
    });
  }

  downloadAttachment(rutaUrl: string): void {
    this.leavesService.downloadAttachment(rutaUrl).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'adjunto_permiso';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
    });
  }

  limpiarFormulario(): void {
    this.tipoPermiso = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.motivo = '';
    this.clearFile();
  }

  get solicitudesFiltradas(): SolicitudItem[] {
    if (this.filtroEstado === 'Todas') {
      return this.solicitudesData;
    }
    return this.solicitudesData.filter((item) => item.status === this.filtroEstado);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Aprobado': return 'status-approved';
      case 'Pendiente': return 'status-pending';
      case 'Rechazado': return 'status-rejected';
      default: return 'status-default';
    }
  }

  get selectedTipo(): TipoPermiso | undefined {
    return this.tiposPermiso.find((t) => t.nombre === this.tipoPermiso);
  }

  get daysRequestedPreview(): number {
    return this.calculateDaysRequested();
  }
}
