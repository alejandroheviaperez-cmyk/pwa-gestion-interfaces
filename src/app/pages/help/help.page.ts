import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle 
} from '@ionic/angular';

/**
 * Vista de Manual de Usuario Embebido y Documentación Técnica del Sistema
 * Cumplimiento RA 6: Manual de usuario embebido en la propia aplicación como sistema de ayuda contextual.
 * Cumplimiento RA 4: Verificación de accesibilidad WCAG y pautas ergonómicas.
 */
@Component({
  selector: 'app-help',
  templateUrl: './help.page.html',
  styleUrls: ['./help.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpPage {
  public activeSection = signal<'roles' | 'data' | 'accessibility' | 'lighthouse' | 'architecture'>('roles');

  setSection(section: 'roles' | 'data' | 'accessibility' | 'lighthouse' | 'architecture'): void {
    this.activeSection.set(section);
  }
}
