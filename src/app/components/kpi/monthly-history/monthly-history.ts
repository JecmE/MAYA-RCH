import { Component } from '@angular/core';

@Component({
  selector: 'app-monthly-history',
  standalone: true,
  imports: [],
  templateUrl: './monthly-history.html',
  styleUrl: './monthly-history.css',
})
export class MonthlyHistory {
  historyData = [
    { label: 'Mes', value: 'Enero' },
    { label: 'Días trabajados', value: '25' },
    { label: 'Tardías', value: '3' },
    { label: 'Faltas', value: '1' },
    { label: 'Cumplimiento', value: '90%' },
    { label: 'Clasificación', value: 'Bueno' },
  ];
}