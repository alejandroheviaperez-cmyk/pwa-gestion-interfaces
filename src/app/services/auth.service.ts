import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User, UserRole, AuthState } from '../models/user.model';
import { FirebaseService } from './firebase.service';

/**
 * Servicio de Autenticación, Gestión de Sesión y Control de Acceso por Roles (RBAC)
 * Cumplimiento RA 1: Gestión de estado predecible, tokens asíncronos y protección de rutas.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private firebaseService = inject(FirebaseService);

  private readonly TOKEN_KEY = 'auth_session_token';
  private readonly USER_KEY = 'auth_session_user';

  // Usuarios preconfigurados para evaluación docente y pruebas
  private demoUsers: (User & { passwordHash: string })[] = [
    {
      id: 'usr-admin-01',
      email: 'admin@empresa.com',
      passwordHash: 'Admin123!',
      nombre: 'Alejandro Martínez (Admin)',
      rol: 'Admin',
      departamento: 'Dirección de Operaciones',
      avatarUrl: 'assets/icon/favicon.png'
    },
    {
      id: 'usr-std-02',
      email: 'usuario@empresa.com',
      passwordHash: 'User123!',
      nombre: 'Lucía Fernández (Estándar)',
      rol: 'Standard',
      departamento: 'Gestión de Inventario',
      avatarUrl: 'assets/icon/favicon.png'
    }
  ];

  // Estado reactivo predecible mediante BehaviorSubject
  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    role: null,
    token: null
  });

  public readonly authState$: Observable<AuthState> = this.authStateSubject.asObservable();
  public readonly currentUser$: Observable<User | null> = this.authState$.pipe(map(s => s.user));
  public readonly currentRole$: Observable<UserRole | null> = this.authState$.pipe(map(s => s.role));
  public readonly isAuthenticated$: Observable<boolean> = this.authState$.pipe(map(s => s.isAuthenticated));

  constructor() {
    this.restoreSession();
  }

  /**
   * Restaura la sesión persistida de forma segura
   */
  private restoreSession(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userJson = localStorage.getItem(this.USER_KEY);

    if (token && userJson) {
      try {
        const user: User = JSON.parse(userJson);
        this.authStateSubject.next({
          isAuthenticated: true,
          user,
          role: user.rol,
          token
        });
      } catch {
        this.clearStorage();
      }
    }
  }

  /**
   * Inicio de sesión asíncrono con generación de token JWT simulado
   * @param email Correo electrónico
   * @param password Contraseña
   */
  async login(email: string, password: string): Promise<{ success: boolean; message: string; user?: User }> {
    const cleanEmail = email.trim().toLowerCase();
    const found = this.demoUsers.find(u => u.email.toLowerCase() === cleanEmail && u.passwordHash === password);

    if (!found) {
      return { success: false, message: 'Credenciales inválidas. Compruebe el correo y la contraseña.' };
    }

    // Generación de token JWT estructurado con expiración
    const tokenPayload = {
      sub: found.id,
      email: found.email,
      role: found.rol,
      exp: Math.floor(Date.now() / 1000) + (8 * 3600) // 8 horas de validez
    };
    const syntheticJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 
      btoa(JSON.stringify(tokenPayload)) + 
      '.s1gn4tur3_s3cur3';

    const sessionUser: User = {
      id: found.id,
      email: found.email,
      nombre: found.nombre,
      rol: found.rol,
      departamento: found.departamento,
      token: syntheticJwt
    };

    localStorage.setItem(this.TOKEN_KEY, syntheticJwt);
    localStorage.setItem(this.USER_KEY, JSON.stringify(sessionUser));

    this.authStateSubject.next({
      isAuthenticated: true,
      user: sessionUser,
      role: sessionUser.rol,
      token: syntheticJwt
    });

    // Auditoría NoSQL en Firebase Firestore en tiempo real
    await this.firebaseService.logAction({
      accion: 'LOGIN',
      entidad: 'Seguridad',
      usuario: sessionUser.email,
      rol: sessionUser.rol,
      detalles: `Inicio de sesión exitoso con rol ${sessionUser.rol}`
    });

    return { success: true, message: 'Autenticación satisfactoria', user: sessionUser };
  }

  /**
   * Cierre de sesión seguro y limpieza de estado
   */
  async logout(): Promise<void> {
    const currentUser = this.authStateSubject.value.user;
    if (currentUser) {
      await this.firebaseService.logAction({
        accion: 'LOGOUT',
        entidad: 'Seguridad',
        usuario: currentUser.email,
        rol: currentUser.rol,
        detalles: 'Cierre de sesión voluntario'
      });
    }

    this.clearStorage();
    this.authStateSubject.next({
      isAuthenticated: false,
      user: null,
      role: null,
      token: null
    });

    this.router.navigate(['/login']);
  }

  private clearStorage(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Comprobación instantánea de rol
   */
  hasRole(requiredRole: UserRole): boolean {
    return this.authStateSubject.value.role === requiredRole;
  }

  isAdmin(): boolean {
    return this.authStateSubject.value.role === 'Admin';
  }

  getSnapshot(): AuthState {
    return this.authStateSubject.value;
  }

  /**
   * Validador Asíncrono de correo existente para el formulario de registro
   * Cumplimiento RA 2: Validaciones asíncronas contra servicio (ej. verificar si un correo ya existe)
   */
  checkEmailExists(email: string): Observable<boolean> {
    if (!email || email.trim() === '') {
      return of(false);
    }
    const clean = email.trim().toLowerCase();
    const exists = this.demoUsers.some(u => u.email.toLowerCase() === clean);
    return of(exists).pipe(delay(450));
  }
}
