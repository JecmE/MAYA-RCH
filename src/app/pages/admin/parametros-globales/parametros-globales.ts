import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, ParametroKpi, AuditLog } from '../../../services/admin.service';
import { SettingsService } from '../../../services/settings.service';

interface HistorialItem {
  id: number;
  fecha: string;
  usuario: string;
  categoria: string;
  cambio: string;
}

type SettingsTab = 'horas' | 'vacaciones' | 'kpis' | 'planilla' | 'generales';

@Component({
  selector: 'app-parametros-globales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parametros-globales.html',
  styleUrl: './parametros-globales.css',
})
export class ParametrosGlobales implements OnInit {
  activeTab: SettingsTab = 'horas';
  showHistorial = false;
  mostrarMensajeExito = false;
  mensajeExito = '';
  isLoading = false;
  isSaving = false;

  historialData: HistorialItem[] = [];

  // Horas
  limiteDiarioHoras = 12;
  limiteSemanalHorasExtra = 20;
  toleranciaMarcaje = 10;
  diasLaborables = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
  diasNoLaborables = ['Sáb', 'Dom'];

  // Vacaciones
  diasVacacionesAnuales = 15;
  diasAdicionales = 1;
  aniosAntiguedad = 2;
  caducidadVacaciones = '31 de Diciembre del año siguiente';
  anticipacionVacaciones = 15;

  // KPIs
  metaCumplimiento = 90;
  clasificacionExcelente = 95;
  clasificacionBueno = 85;
  clasificacionRegular = 70;
  maxTardiasMensuales = 4;

  // Planilla
  igssLaboral = 4.83;
  igssPatronal = 12.67;
  bonificacionDecreto = 250;

  // Generales
  monedaSistema = 'GTQ - Quetzal Guatemalteco';
  zonaHoraria = 'America/Guatemala (GMT-6)';
  formatoFecha = 'DD/MM/YYYY';
  idiomaSistema = 'Español';
  cicloPlanilla = 'Mensual (del 1 al último día del mes)';

  constructor(
    private router: Router,
    private adminService: AdminService,
    private settingsService: SettingsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAllParameters();
    this.loadHistory();
  }

  private loadAllParameters(): void {
    this.isLoading = true;
    this.adminService.getKpiParameters().subscribe({
      next: (params: ParametroKpi) => {
        // Horas
        if (params['limite_horas_diarias']) this.limiteDiarioHoras = Number(params['limite_horas_diarias']);
        if (params['limite_horas_semanales']) this.limiteSemanalHorasExtra = Number(params['limite_horas_semanales']);
        if (params['tolerancia_minutos']) this.toleranciaMarcaje = Number(params['tolerancia_minutos']);

        // Vacaciones
        if (params['dias_vacaciones']) this.diasVacacionesAnuales = Number(params['dias_vacaciones']);
        if (params['vacaciones_adicionales']) this.diasAdicionales = Number(params['vacaciones_adicionales']);
        if (params['antiguedad_anios']) this.aniosAntiguedad = Number(params['antiguedad_anios']);
        if (params['caducidad_vacaciones']) this.caducidadVacaciones = params['caducidad_vacaciones'];
        if (params['anticipacion_solicitud']) this.anticipacionVacaciones = Number(params['anticipacion_solicitud']);

        // KPIs
        if (params['meta_cumplimiento']) this.metaCumplimiento = Number(params['meta_cumplimiento']);
        if (params['kpi_excelente']) this.clasificacionExcelente = Number(params['kpi_excelente']);
        if (params['kpi_bueno']) this.clasificacionBueno = Number(params['kpi_bueno']);
        if (params['kpi_regular']) this.clasificacionRegular = Number(params['kpi_regular']);
        if (params['max_tardias']) this.maxTardiasMensuales = Number(params['max_tardias']);

        // Planilla
        if (params['igss_laboral']) this.igssLaboral = Number(params['igss_laboral']);
        if (params['igss_patronal']) this.igssPatronal = Number(params['igss_patronal']);
        if (params['bono_decreto']) this.bonificacionDecreto = Number(params['bono_decreto']);

        // Generales
        if (params['moneda_sistema']) this.monedaSistema = params['moneda_sistema'];
        if (params['zona_horaria']) this.zonaHoraria = params['zona_horaria'];
        if (params['formato_fecha']) this.formatoFecha = params['formato_fecha'];
        if (params['idioma_sistema']) this.idiomaSistema = params['idioma_sistema'];
        if (params['ciclo_planilla']) this.cicloPlanilla = params['ciclo_planilla'];

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  private loadHistory(): void {
    this.adminService.getAuditLogs(undefined, undefined, undefined, 'ADMIN').subscribe({
      next: (logs: AuditLog[]) => {
        this.historialData = logs
          .filter(l => l.accion === 'UPDATE_KPI_PARAMETERS' || l.entidad === 'PARAMETROS')
          .slice(0, 15)
          .map(l => ({
            id: l.auditId,
            fecha: new Date(l.fechaHora).toLocaleString('es-GT'),
            usuario: typeof l.usuario === 'object' ? (l.usuario as any).username : (l.usuario || 'testempleado'),
            categoria: this.mapDetailToCategory(l.detalle),
            cambio: l.detalle
          }));
        this.cdr.detectChanges();
      }
    });
  }

  private mapDetailToCategory(detalle: string): string {
    const d = detalle.toLowerCase();
    if (d.includes('horas') || d.includes('tolerancia') || d.includes('día')) return 'Horas y validaciones';
    if (d.includes('vacaciones') || d.includes('anticipacion')) return 'Vacaciones';
    if (d.includes('kpi') || d.includes('meta')) return 'KPIs y Metas';
    if (d.includes('planilla') || d.includes('igss') || d.includes('bono')) return 'Planilla';
    if (d.includes('moneda') || d.includes('zona') || d.includes('ciclo') || d.includes('formato')) return 'Generales';
    return 'Configuración';
  }

  goBack(): void { this.router.navigate(['/']); }
  setTab(tab: SettingsTab): void { this.activeTab = tab; }
  abrirHistorial(): void { this.loadHistory(); this.showHistorial = true; }
  cerrarHistorial(): void { this.showHistorial = false; }

  restablecer(): void {
    if (confirm('¿Restablecer valores por defecto recomendados?')) {
        if (this.activeTab === 'generales') {
            this.monedaSistema = 'GTQ - Quetzal Guatemalteco';
            this.zonaHoraria = 'America/Guatemala (GMT-6)';
            this.formatoFecha = 'DD/MM/YYYY';
            this.idiomaSistema = 'Español';
            this.cicloPlanilla = 'Mensual (del 1 al último día del mes)';
        }
        this.mostrarNotificacion('Valores de referencia cargados. Guarde para aplicar.');
    }
  }

  guardarCambios(): void {
    if (this.isSaving) return;
    this.isSaving = true;

    const categoryMap: Record<SettingsTab, string> = {
        horas: 'Horas y validaciones', vacaciones: 'Vacaciones', kpis: 'KPIs y Metas', planilla: 'Planilla', generales: 'Generales'
    };

    const payload: any = { categoryName: categoryMap[this.activeTab] };

    if (this.activeTab === 'horas') {
        payload.limite_horas_diarias = this.limiteDiarioHoras.toString();
        payload.limite_horas_semanales = this.limiteSemanalHorasExtra.toString();
        payload.tolerancia_minutos = this.toleranciaMarcaje.toString();
    } else if (this.activeTab === 'vacaciones') {
        payload.dias_vacaciones = this.diasVacacionesAnuales.toString();
        payload.vacaciones_adicionales = this.diasAdicionales.toString();
        payload.antiguedad_anios = this.aniosAntiguedad.toString();
        payload.caducidad_vacaciones = this.caducidadVacaciones;
        payload.anticipacion_solicitud = this.anticipacionVacaciones.toString();
    } else if (this.activeTab === 'kpis') {
        payload.meta_cumplimiento = this.metaCumplimiento.toString();
        payload.kpi_excelente = this.clasificacionExcelente.toString();
        payload.kpi_bueno = this.clasificacionBueno.toString();
        payload.kpi_regular = this.clasificacionRegular.toString();
        payload.max_tardias = this.maxTardiasMensuales.toString();
    } else if (this.activeTab === 'planilla') {
        payload.igss_laboral = this.igssLaboral.toString();
        payload.igss_patronal = this.igssPatronal.toString();
        payload.bono_decreto = this.bonificacionDecreto.toString();
    } else if (this.activeTab === 'generales') {
        payload.moneda_sistema = this.monedaSistema;
        payload.zona_horaria = this.zonaHoraria;
        payload.formato_fecha = this.formatoFecha;
        payload.idioma_sistema = this.idiomaSistema;
        payload.ciclo_planilla = this.cicloPlanilla;
    }

    this.adminService.updateKpiParameters(payload).subscribe({
      next: () => {
        setTimeout(() => {
            this.mostrarNotificacion('Configuración actualizada con éxito.');
            this.loadHistory();
            this.settingsService.refreshSettings(); // RECARGAR SETTINGS GLOBALES
            this.isSaving = false;
            this.cdr.detectChanges();
        }, 1200);
      },
      error: () => { this.isSaving = false; alert('Error de conexión.'); this.cdr.detectChanges(); }
    });
  }

  getCategoriaBadgeClass(categoria: string): string {
    if (categoria === 'Horas y validaciones') return 'badge-blue';
    if (categoria === 'Vacaciones') return 'badge-green';
    if (categoria === 'KPIs y Metas') return 'badge-purple';
    if (categoria === 'Planilla') return 'badge-amber';
    return 'badge-slate';
  }

  private mostrarNotificacion(mensaje: string): void {
    this.mensajeExito = mensaje; this.mostrarMensajeExito = true;
    setTimeout(() => { this.mostrarMensajeExito = false; this.cdr.detectChanges(); }, 3000);
  }
}
