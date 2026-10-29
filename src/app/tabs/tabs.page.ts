import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  IonTabs, 
  IonTabBar, 
  IonTabButton, 
  IonIcon, 
  IonLabel
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  pieChartOutline, 
  cubeOutline, 
  pulseOutline, 
  documentTextOutline, 
  helpCircleOutline,
  logOutOutline,
  personOutline
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

/**
 * Contenedor de Navegación Global (Tabs / Side Menu)
 * Cumplimiento RA 1: Paso 1.1 - Sistema de navegación con soporte responsive y carga diferida.
 */
@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonTabs, 
    IonTabBar, 
    IonTabButton, 
    IonIcon, 
    IonLabel
  ],
})
export class TabsPage {
  public authService = inject(AuthService);

  constructor() {
    addIcons({ 
      pieChartOutline, 
      cubeOutline, 
      pulseOutline, 
      documentTextOutline, 
      helpCircleOutline,
      logOutOutline,
      personOutline
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
