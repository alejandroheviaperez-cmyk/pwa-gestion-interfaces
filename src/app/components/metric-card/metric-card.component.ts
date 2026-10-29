import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente Reutilizable de Tarjeta Métrica / KPI
 * Cumplimiento RA 3: Componente independiente e instanciable que recibe Props (@Input) y emite Eventos (@Output).
 */
@Component({
  selector: 'app-metric-card',
  templateUrl: './metric-card.component.html',
  styleUrls: ['./metric-card.component.scss'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricCardComponent {
  @Input({ required: true }) title: string = '';
  @Input({ required: true }) value: string | number = '';
  @Input() subtitle?: string;
  @Input() iconName?: string;
  @Input() color: 'primary' | 'success' | 'warning' | 'danger' | 'tertiary' = 'primary';
  @Input() trend?: { percentage: number; isPositive: boolean };

  @Output() cardClick = new EventEmitter<void>();

  onClick(): void {
    this.cardClick.emit();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.cardClick.emit();
    }
  }
}
