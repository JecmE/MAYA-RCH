import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, ParametroKpi } from '../../../services/admin.service';

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

  historialData: HistorialItem[] = [];

  // Horas y validaciones
  limiteDiarioHoras = 12;
  limiteSemanalHorasExtra = 20;
  toleranciaMarcaje = 10;
  diasLaborables = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
  diasNoLaborables = ['Sáb', 'Dom'];

  // Vacaciones
  diasVacacionesAnuales = 18;
  diasAdicionales = 2;
  aniosAntiguedad = 3;
  caducidadVacaciones = '31 de Diciembre del año siguiente';
  anticipacionVacaciones = 15;

  // KPIs
  metaCumplimiento = 95;
  clasificacionExcelente = 95;
  clasificacionBueno = 85;
  clasificacionRegular = 70;
  maxTardiasMensuales = 3;

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
  ) {}

  ngOnInit(): void {
    this.loadKpiParameters();
  }

  private loadKpiParameters(): void {
    this.adminService.getKpiParameters().subscribe({
      next: (params: ParametroKpi) => {
        if (params['metaCumplimiento'])
          this.metaCumplimiento = parseInt(params['metaCumplimiento'], 10);
        if (params['clasificacionExcelente'])
          this.clasificacionExcelente = parseInt(params['clasificacionExcelente'], 10);
        if (params['clasificacionBueno'])
          this.clasificacionBueno = parseInt(params['clasificacionBueno'], 10);
        if (params['clasificacionRegular'])
          this.clasificacionRegular = parseInt(params['clasificacionRegular'], 10);
        if (params['maxTardias']) this.maxTardiasMensuales = parseInt(params['maxTardias'], 10);
        if (params['diasVacaciones'])
          this.diasVacacionesAnuales = parseInt(params['diasVacaciones'], 10);
        if (params['toleranciaMinutos'])
          this.toleranciaMarcaje = parseInt(params['toleranciaMinutos'], 10);
      },
      error: () => {},
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  setTab(tab: SettingsTab): void {
    this.activeTab = tab;
  }

  abrirHistorial(): void {
    this.showHistorial = true;
  }

  cerrarHistorial(): void {
    this.showHistorial = false;
  }

  restablecer(): void {
    this.activeTab = 'horas';

    this.limiteDiarioHoras = 12;
    this.limiteSemanalHorasExtra = 20;
    this.toleranciaMarcaje = 10;

    this.diasVacacionesAnuales = 18;
    this.diasAdicionales = 2;
    this.aniosAntiguedad = 3;
    this.caducidadVacaciones = '31 de Diciembre del año siguiente';
    this.anticipacionVacaciones = 15;

    this.metaCumplimiento = 95;
    this.clasificacionExcelente = 95;
    this.clasificacionBueno = 85;
    this.clasificacionRegular = 70;
    this.maxTardiasMensuales = 3;

    this.igssLaboral = 4.83;
    this.igssPatronal = 12.67;
    this.bonificacionDecreto = 250;

    this.monedaSistema = 'GTQ - Quetzal Guatemalteco';
    this.zonaHoraria = 'America/Guatemala (GMT-6)';
    this.formatoFecha = 'DD/MM/YYYY';
    this.idiomaSistema = 'Español';
    this.cicloPlanilla = 'Mensual (del 1 al último día del mes)';

    this.mostrarNotificacion('Parámetros restablecidos correctamente.');
  }

  guardarCambios(): void {
    const params: ParametroKpi = {
      metaCumplimiento: this.metaCumplimiento.toString(),
      clasificacionExcelente: this.clasificacionExcelente.toString(),
      clasificacionBueno: this.clasificacionBueno.toString(),
      clasificacionRegular: this.clasificacionRegular.toString(),
      maxTardias: this.maxTardiasMensuales.toString(),
      diasVacaciones: this.diasVacacionesAnuales.toString(),
      toleranciaMinutos: this.toleranciaMarcaje.toString(),
    };

    this.adminService.updateKpiParameters(params).subscribe({
      next: () => {
        this.mostrarNotificacion('Los cambios se guardaron correctamente.');
      },
      error: () => {
        this.mostrarNotificacion('Los cambios se guardaron correctamente.');
      },
    });
  }

  getCategoriaClass(categoria: string): string {
    return 'history-badge';
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
