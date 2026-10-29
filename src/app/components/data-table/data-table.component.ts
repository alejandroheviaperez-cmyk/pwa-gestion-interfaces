import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  ChangeDetectionStrategy, 
  computed, 
  signal 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonBadge 
} from '@ionic/angular';
import { TableColumn } from '../../models/record.model';

/**
 * Componente Reutilizable y Agnóstico de Tabla de Datos Avanzada
 * Cumplimiento RA 3: Componente independiente que recibe @Input() y emite @Output()
 * Optimizado con ChangeDetectionStrategy.OnPush y Angular Signals.
 */
@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonBadge
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent {
  // Inputs declarativos
  @Input({ required: true }) set data(value: any[]) {
    this._rawData.set(value || []);
    this.currentPage.set(1);
  }
  @Input({ required: true }) columns: TableColumn[] = [];
  @Input() pageSize: number = 6;
  @Input() title: string = 'Registros';
  @Input() filterPlaceholder: string = 'Buscar por cualquier campo...';
  @Input() canEdit: boolean = true;
  @Input() canDelete: boolean = true;

  // Outputs personalizados
  @Output() rowSelect = new EventEmitter<any>();
  @Output() rowAction = new EventEmitter<{ action: 'edit' | 'delete' | 'view'; item: any }>();

  // Estado interno reactivo gestionado mediante Signals
  private _rawData = signal<any[]>([]);
  public searchTerm = signal<string>('');
  public sortKey = signal<string>('');
  public sortAsc = signal<boolean>(true);
  public currentPage = signal<number>(1);

  // Computación reactiva: Filtrado + Ordenación
  public filteredData = computed(() => {
    let list = [...this._rawData()];
    const term = this.searchTerm().trim().toLowerCase();

    if (term) {
      list = list.filter(item => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(term)
        )
      );
    }

    const key = this.sortKey();
    if (key) {
      const asc = this.sortAsc();
      list.sort((a, b) => {
        const valA = a[key] ?? '';
        const valB = b[key] ?? '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return asc ? valA - valB : valB - valA;
        }
        return asc 
          ? String(valA).localeCompare(String(valB)) 
          : String(valB).localeCompare(String(valA));
      });
    }

    return list;
  });

  // Computación reactiva: Paginación
  public totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredData().length / this.pageSize));
  });

  public paginatedData = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredData().slice(start, start + this.pageSize);
  });

  onSearchChange(event: any): void {
    const val = typeof event === 'string' ? event : event?.target?.value ?? '';
    this.searchTerm.set(val);
    this.currentPage.set(1);
  }

  sortBy(key: string): void {
    if (this.sortKey() === key) {
      this.sortAsc.update(prev => !prev);
    } else {
      this.sortKey.set(key);
      this.sortAsc.set(true);
    }
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onSelect(item: any): void {
    this.rowSelect.emit(item);
  }

  emitAction(action: 'edit' | 'delete' | 'view', item: any, event: Event): void {
    event.stopPropagation();
    this.rowAction.emit({ action, item });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Activo': return 'success';
      case 'Bajo Stock': return 'warning';
      case 'Agotado': return 'danger';
      case 'En Revisión': return 'medium';
      default: return 'primary';
    }
  }
}
