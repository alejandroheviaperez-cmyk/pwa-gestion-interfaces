import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonSpinner, 
  IonBadge 
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { FirebaseService } from '../../services/firebase.service';
import { AuthService } from '../../services/auth.service';
import { AuditLog, AuditAction } from '../../models/audit-log.model';

/**
 * Vista de Auditoría y Telemetría en Tiempo Real NoSQL (Firebase Firestore)
 * Cumplimiento RA 5: Paso 3.1 - Servicio en tiempo real basado en documentos NoSQL con subscripciones reactivas.
 */
@Component({
  selector: 'app-realtime',
  templateUrl: './realtime.page.html',
  styleUrls: ['./realtime.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonSpinner,
    IonBadge
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RealtimePage implements OnInit, OnDestroy {
  private firebaseService = inject(FirebaseService);
  public authService = inject(AuthService);

  public logs = signal<AuditLog[]>([]);
  public isConnected = signal<boolean>(false);
  public isEmitting = signal<boolean>(false);
  public selectedFilter = signal<string>('TODAS');

  private logsSub?: Subscription;

  ngOnInit(): void {
    this.subscribeToFirestore();
  }

  /**
   * Suscripción en tiempo real a la colección de Firestore
   */
  subscribeToFirestore(): void {
    this.logsSub = this.firebaseService.getRealtimeAuditLogs(50).subscribe({
      next: (data) => {
        this.logs.set(data);
        this.isConnected.set(true);
      },
      error: (err) => {
        console.error('Error en subscripción a Firestore:', err);
        this.isConnected.set(false);
      }
    });
  }

  /**
   * Genera un evento de auditoría manual para demostrar la reactividad instantánea
   */
  async triggerTestEvent(): Promise<void> {
    this.isEmitting.set(true);
    const user = this.authService.getSnapshot().user;

    await this.firebaseService.logAction({
      accion: 'FILTRADO_DASHBOARD',
      entidad: 'Prueba Docente NoSQL',
      usuario: user ? user.email : 'evaluador@empresa.com',
      rol: user ? user.rol : 'Standard',
      detalles: 'Evento manual de verificación en tiempo real disparado desde la interfaz'
    });

    this.isEmitting.set(false);
  }

  getFilteredLogs(): AuditLog[] {
    const filter = this.selectedFilter();
    if (filter === 'TODAS') {
      return this.logs();
    }
    return this.logs().filter(l => l.accion === filter);
  }

  getActionBadgeColor(accion: AuditAction): string {
    switch (accion) {
      case 'LOGIN': return 'primary';
      case 'CREAR_REGISTRO': return 'success';
      case 'EDITAR_REGISTRO': return 'warning';
      case 'ELIMINAR_REGISTRO': return 'danger';
      case 'EXPORTAR_PDF': 
      case 'EXPORTAR_CSV': return 'tertiary';
      default: return 'medium';
    }
  }

  /**
   * Evita fugas de memoria cancelando la subscripción de Firestore (RA 3)
   */
  ngOnDestroy(): void {
    if (this.logsSub) {
      this.logsSub.unsubscribe();
    }
  }
}
