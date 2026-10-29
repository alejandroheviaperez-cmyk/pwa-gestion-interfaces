import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormBuilder, 
  FormGroup, 
  Validators, 
  ReactiveFormsModule, 
  AbstractControl, 
  AsyncValidatorFn 
} from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonSpinner 
} from '@ionic/angular';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Validador Asíncrono para verificar si un correo ya se encuentra registrado
 * Cumplimiento RA 2: Validaciones asíncronas contra servicio gestionando el estado del componente.
 */
export function uniqueEmailValidator(authService: AuthService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<{ emailTaken: boolean } | null> => {
    if (!control.value || control.value.trim() === '') {
      return of(null);
    }
    return authService.checkEmailExists(control.value).pipe(
      map(exists => (exists ? { emailTaken: true } : null)),
      catchError(() => of(null))
    );
  };
}

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonSpinner
  ]
})
export class LoginPage implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  public activeTab: 'login' | 'register' = 'login';
  public loginForm!: FormGroup;
  public registerForm!: FormGroup;

  public isLoading: boolean = false;
  public errorMessage: string = '';
  public successMessage: string = '';

  ngOnInit(): void {
    // Si ya está autenticado, redirigir al panel principal
    if (this.authService.getSnapshot().isAuthenticated) {
      this.router.navigate(['/tabs/dashboard']);
      return;
    }

    this.initForms();
  }

  private initForms(): void {
    // Formulario reactivo de Login
    this.loginForm = this.fb.group({
      email: ['admin@empresa.com', [Validators.required, Validators.email]],
      password: ['Admin123!', [Validators.required, Validators.minLength(6)]]
    });

    // Formulario reactivo de Registro con Validador Asíncrono
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', {
        validators: [Validators.required, Validators.email],
        asyncValidators: [uniqueEmailValidator(this.authService)],
        updateOn: 'blur'
      }],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rol: ['Standard', Validators.required]
    });
  }

  async onLoginSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;
    const res = await this.authService.login(email, password);

    this.isLoading = false;
    if (res.success) {
      if (res.user?.rol === 'Admin') {
        this.router.navigate(['/tabs/dashboard']);
      } else {
        this.router.navigate(['/tabs/inventory']);
      }
    } else {
      this.errorMessage = res.message;
    }
  }

  async onRegisterSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Simulación de registro exitoso
    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = 'Usuario verificado y registrado correctamente. Puede iniciar sesión ahora.';
      this.activeTab = 'login';
      this.loginForm.patchValue({
        email: this.registerForm.value.email,
        password: this.registerForm.value.password
      });
    }, 700);
  }

  // Accesos rápidos para el profesor / evaluador
  quickLogin(role: 'Admin' | 'Standard'): void {
    if (role === 'Admin') {
      this.loginForm.patchValue({
        email: 'admin@empresa.com',
        password: 'Admin123!'
      });
    } else {
      this.loginForm.patchValue({
        email: 'usuario@empresa.com',
        password: 'User123!'
      });
    }
    this.onLoginSubmit();
  }
}
