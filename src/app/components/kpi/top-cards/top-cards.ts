import { Component } from '@angular/core';

@Component({
  selector: 'app-top-cards',
  standalone: true,
  imports: [],
  templateUrl: './top-cards.html',
  styleUrl: './top-cards.css',
})
export class TopCards {
  kpiData = [
    { label: 'Días trabajados', value: '21' },
    { label: 'Tardías', value: '2' },
    { label: 'Faltas', value: '0' },
    { label: 'Horas esperadas', value: '168 h' },
    { label: 'Horas trabajadas', value: '162 h' },
    { label: 'Cumplimiento', value: '94.6%' },
    { label: 'Clasificación', value: 'Bueno' },
  ];
}