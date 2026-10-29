import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormBuilder, 
  FormGroup, 
  Validators, 
  ReactiveFormsModule, 
  AbstractControl, 
  AsyncValidatorFn 
} from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonSpinner, 
  IonModal 
} from '@ionic/angular';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from '../../services/supabase.service';
import { FirebaseService } from '../../services/firebase.service';
import { AuthService } from '../../services/auth.service';
import { BusinessRecord, TableColumn, RecordStatus } from '../../models/record.model';
import { DataTableComponent } from '../../components/data-table/data-table.component';

/**
 * Validador Asíncrono para verificar unicidad del código de producto contra Supabase
 * Cumplimiento RA 2: Validaciones asíncronas contra servicio (ej. verificar si código ya existe)
 */
export function uniqueCodeValidator(supabaseService: SupabaseService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<{ codeTaken: boolean } | null> => {
    if (!control.value || control.value.trim() === '') {
      return of(null);
    }
    return supabaseService.checkCodeExists(control.value).pipe(
      map(exists => (exists ? { codeTaken: true } : null)),
      catchError(() => of(null))
    );
  };
}

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.page.html',
  styleUrls: ['./inventory.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonSpinner,
    IonModal,
    DataTableComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryPage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private firebaseService = inject(FirebaseService);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);

  public isLoading = signal<boolean>(true);
  public records = signal<BusinessRecord[]>([]);
  public isModalOpen = signal<boolean>(false);
  public isSaving = signal<boolean>(false);
  public editingRecordId = signal<string | null>(null);

  // Formulario reactivo con validador asíncrono
  public recordForm!: FormGroup;

  // Definición declarativa de columnas para el componente reutilizable
  public tableColumns: TableColumn[] = [
    { key: 'codigo', header: 'Código', sortable: true, type: 'text' },
    { key: 'nombre', header: 'Nombre del Activo', sortable: true, type: 'text' },
    { key: 'categoria', header: 'Categoría', sortable: true, type: 'text' },
    { key: 'precio', header: 'Precio Unitario', sortable: true, type: 'currency' },
    { key: 'stock', header: 'Stock', sortable: true, type: 'number' },
    { key: 'estado', header: 'Estado', sortable: true, type: 'status' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadRecords();
  }

  private initForm(): void {
    this.recordForm = this.fb.group({
      codigo: ['', {
        validators: [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)],
        asyncValidators: [uniqueCodeValidator(this.supabaseService)],
        updateOn: 'blur'
      }],
      nombre: ['', [Validators.required, Validators.minLength(4)]],
      categoria: ['Hardware', Validators.required],
      precio: [100, [Validators.required, Validators.min(0.01)]],
      stock: [10, [Validators.required, Validators.min(0)]],
      estado: ['Activo' as RecordStatus, Validators.required],
      descripcion: ['']
    });
  }

  async loadRecords(): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await this.supabaseService.getRecords();
      this.records.set(data);
    } catch (e) {
      console.error('Error al cargar inventario:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  openCreateModal(): void {
    this.editingRecordId.set(null);
    this.recordForm.reset({
      codigo: 'PRD-' + Math.floor(1000 + Math.random() * 9000),
      nombre: '',
      categoria: 'Hardware',
      precio: 150.00,
      stock: 10,
      estado: 'Activo',
      descripcion: ''
    });
    this.recordForm.get('codigo')?.enable();
    this.isModalOpen.set(true);
  }

  openEditModal(record: BusinessRecord): void {
    this.editingRecordId.set(record.id);
    this.recordForm.setValue({
      codigo: record.codigo,
      nombre: record.nombre,
      categoria: record.categoria,
      precio: record.precio,
      stock: record.stock,
      estado: record.estado,
      descripcion: record.descripcion || ''
    });
    // Al editar no permitimos modificar el código primario
    this.recordForm.get('codigo')?.disable();
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingRecordId.set(null);
  }

  async onSaveRecord(): Promise<void> {
    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formVal = this.recordForm.getRawValue();
    const user = this.authService.getSnapshot().user;

    try {
      const editId = this.editingRecordId();
      if (editId) {
        // Actualización
        await this.supabaseService.updateRecord(editId, formVal);
        await this.firebaseService.logAction({
          accion: 'EDITAR_REGISTRO',
          entidad: 'Inventario SQL',
          usuario: user?.email || 'anónimo',
          rol: user?.rol || 'Standard',
          detalles: `Modificación de ${formVal.codigo} - ${formVal.nombre}`
        });
      } else {
        // Creación
        await this.supabaseService.createRecord(formVal);
        await this.firebaseService.logAction({
          accion: 'CREAR_REGISTRO',
          entidad: 'Inventario SQL',
          usuario: user?.email || 'anónimo',
          rol: user?.rol || 'Standard',
          detalles: `Alta de nuevo ítem ${formVal.codigo} - ${formVal.nombre}`
        });
      }

      await this.loadRecords();
      this.closeModal();
    } catch (err) {
      console.error('Error al guardar:', err);
    } finally {
      this.isSaving.set(false);
    }
  }

  async handleTableAction(event: { action: 'edit' | 'delete' | 'view'; item: BusinessRecord }): Promise<void> {
    if (event.action === 'edit') {
      this.openEditModal(event.item);
    } else if (event.action === 'delete') {
      if (confirm(`¿Confirma que desea eliminar el registro ${event.item.codigo} (${event.item.nombre})?`)) {
        await this.supabaseService.deleteRecord(event.item.id);
        const user = this.authService.getSnapshot().user;
        await this.firebaseService.logAction({
          accion: 'ELIMINAR_REGISTRO',
          entidad: 'Inventario SQL',
          usuario: user?.email || 'anónimo',
          rol: user?.rol || 'Standard',
          detalles: `Eliminado registro ${event.item.codigo}`
        });
        await this.loadRecords();
      }
    }
  }

  handleRowSelect(item: BusinessRecord): void {
    // Si es admin o standard, abrimos edición o detalle
    this.openEditModal(item);
  }
}
