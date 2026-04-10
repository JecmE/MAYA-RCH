import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface ConceptoBoleta {
  id: number;
  concepto: string;
  tipo: 'Ingreso' | 'Deducción';
  monto: string;
  obs: string;
}

interface ResumenBoleta {
  salarioBase: string;
  bonificaciones: string;
  deducciones: string;
  isr: string;
  netoPagar: string;
}

interface BoletaPeriodo {
  resumen: ResumenBoleta;
  conceptos: ConceptoBoleta[];
}

@Component({
  selector: 'app-boleta',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './boleta.html',
  styleUrl: './boleta.css',
})
export class Boleta {
  periodo = '02-2026';
  showSuccessModal = false;

  boletasPorPeriodo: Record<string, BoletaPeriodo> = {
    '03-2026': {
      resumen: {
        salarioBase: '8,500.00',
        bonificaciones: '1,450.00',
        deducciones: '908.00',
        isr: '215.00',
        netoPagar: '8,827.00',
      },
      conceptos: [
        { id: 1, concepto: 'Salario Base', tipo: 'Ingreso', monto: '8,500.00', obs: 'Correspondiente al mes' },
        { id: 2, concepto: 'Bonificación Decreto 37-2001', tipo: 'Ingreso', monto: '250.00', obs: 'Ley' },
        { id: 3, concepto: 'Bono por Desempeño', tipo: 'Ingreso', monto: '1,200.00', obs: 'KPIs alcanzados' },
        { id: 4, concepto: 'IGSS', tipo: 'Deducción', monto: '408.00', obs: '4.83% s/Salario Base' },
        { id: 5, concepto: 'ISR', tipo: 'Deducción', monto: '215.00', obs: 'Retención mensual' },
        { id: 6, concepto: 'Préstamo Interno', tipo: 'Deducción', monto: '285.00', obs: 'Cuota 4 de 10' },
      ],
    },
    '02-2026': {
      resumen: {
        salarioBase: '8,500.00',
        bonificaciones: '1,450.00',
        deducciones: '1,123.00',
        isr: '215.00',
        netoPagar: '8,827.00',
      },
      conceptos: [
        { id: 1, concepto: 'Salario Base', tipo: 'Ingreso', monto: '8,500.00', obs: 'Correspondiente al mes' },
        { id: 2, concepto: 'Bonificación Decreto 37-2001', tipo: 'Ingreso', monto: '250.00', obs: 'Ley' },
        { id: 3, concepto: 'Bono por Desempeño', tipo: 'Ingreso', monto: '1,200.00', obs: 'KPIs alcanzados' },
        { id: 4, concepto: 'IGSS', tipo: 'Deducción', monto: '408.00', obs: '4.83% s/Salario Base' },
        { id: 5, concepto: 'ISR', tipo: 'Deducción', monto: '215.00', obs: 'Retención mensual' },
        { id: 6, concepto: 'Préstamo Interno', tipo: 'Deducción', monto: '500.00', obs: 'Cuota 3 de 10' },
      ],
    },
    '01-2026': {
      resumen: {
        salarioBase: '8,500.00',
        bonificaciones: '950.00',
        deducciones: '873.00',
        isr: '200.00',
        netoPagar: '8,577.00',
      },
      conceptos: [
        { id: 1, concepto: 'Salario Base', tipo: 'Ingreso', monto: '8,500.00', obs: 'Correspondiente al mes' },
        { id: 2, concepto: 'Bonificación Decreto 37-2001', tipo: 'Ingreso', monto: '250.00', obs: 'Ley' },
        { id: 3, concepto: 'Bono por Desempeño', tipo: 'Ingreso', monto: '700.00', obs: 'Cumplimiento parcial de KPIs' },
        { id: 4, concepto: 'IGSS', tipo: 'Deducción', monto: '408.00', obs: '4.83% s/Salario Base' },
        { id: 5, concepto: 'ISR', tipo: 'Deducción', monto: '200.00', obs: 'Retención mensual' },
        { id: 6, concepto: 'Préstamo Interno', tipo: 'Deducción', monto: '265.00', obs: 'Cuota 2 de 10' },
      ],
    },
    '12-2025': {
      resumen: {
        salarioBase: '8,500.00',
        bonificaciones: '1,000.00',
        deducciones: '658.00',
        isr: '190.00',
        netoPagar: '8,842.00',
      },
      conceptos: [
        { id: 1, concepto: 'Salario Base', tipo: 'Ingreso', monto: '8,500.00', obs: 'Correspondiente al mes' },
        { id: 2, concepto: 'Bonificación Decreto 37-2001', tipo: 'Ingreso', monto: '250.00', obs: 'Ley' },
        { id: 3, concepto: 'Bono por Desempeño', tipo: 'Ingreso', monto: '750.00', obs: 'Cierre mensual' },
        { id: 4, concepto: 'IGSS', tipo: 'Deducción', monto: '408.00', obs: '4.83% s/Salario Base' },
        { id: 5, concepto: 'ISR', tipo: 'Deducción', monto: '190.00', obs: 'Retención mensual' },
        { id: 6, concepto: 'Ajuste Administrativo', tipo: 'Deducción', monto: '60.00', obs: 'Regularización interna' },
      ],
    },
  };

  resumen: ResumenBoleta = this.boletasPorPeriodo[this.periodo].resumen;
  conceptosFiltrados: ConceptoBoleta[] = this.boletasPorPeriodo[this.periodo].conceptos;

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/']);
  }

  consultar(): void {
    const boletaSeleccionada = this.boletasPorPeriodo[this.periodo];

    if (boletaSeleccionada) {
      this.resumen = boletaSeleccionada.resumen;
      this.conceptosFiltrados = boletaSeleccionada.conceptos;
    }
  }

  exportarPDF(): void {
    this.showSuccessModal = true;
  }

  cerrarModal(): void {
    this.showSuccessModal = false;
  }
}