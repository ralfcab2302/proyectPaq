import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ClientesService } from '../../services/clientes.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="login-fondo">
      <div class="login-caja">
        <div class="login-logo">
          <div class="logo-icono">📦</div>
          <div class="logo-texto">Paq<span>Track</span></div>
          <div class="logo-sub">Sistema de gestión de paquetes</div>
        </div>

        @if (conectando) {
          <div class="estado-servidor">
            <div class="spinner"></div>
            <span>{{ mensajeConexion }}</span>
          </div>
        }

        @if (!conectando) {
          <div class="campo">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" placeholder="admin@admin.com" (keyup.enter)="iniciarSesion()" [disabled]="cargando">
          </div>

          <div class="campo">
            <label>Contraseña</label>
            <input type="password" [(ngModel)]="password" placeholder="••••••••" (keyup.enter)="iniciarSesion()" [disabled]="cargando">
          </div>

          <button class="boton-login" (click)="iniciarSesion()" [disabled]="cargando">
            {{ cargando ? 'Entrando...' : 'Entrar' }}
          </button>

          @if (error) {
            <div class="error-msg">{{ error }}</div>
          }
        }

        @if (errorConexion) {
          <div class="error-msg">{{ errorConexion }}</div>
          <button class="boton-login" style="margin-top:0" (click)="reintentar()">Reintentar</button>
        }
      </div>
    </div>
  `,
  styles: [`
    .login-fondo { min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: var(--bg); }
    .login-caja { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 2.5rem 2rem; width: 100%; max-width: 380px; display: flex; flex-direction: column; gap: 1.2rem; }
    .login-logo { text-align: center; margin-bottom: 0.5rem; }
    .logo-icono { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .logo-texto { font-family: 'Space Mono', monospace; font-size: 1.5rem; font-weight: 700; }
    .logo-texto span { color: var(--accent); }
    .logo-sub { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }
    .campo { display: flex; flex-direction: column; gap: 6px; }
    .campo label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
    .campo input { background: var(--bg-input); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; color: var(--text); font-size: 0.9rem; outline: none; }
    .campo input:focus { border-color: var(--accent); }
    .campo input:disabled { opacity: 0.5; }
    .boton-login { background: var(--accent); color: #fff; border: none; border-radius: 8px; padding: 12px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
    .boton-login:hover { opacity: 0.85; }
    .boton-login:disabled { opacity: 0.5; cursor: not-allowed; }
    .error-msg { background: rgba(255,101,132,0.1); border: 1px solid var(--accent2); border-radius: 8px; padding: 10px 14px; font-size: 0.82rem; color: var(--accent2); text-align: center; }
    .estado-servidor { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: var(--bg-input); border-radius: 8px; font-size: 0.82rem; color: var(--text-muted); }
    .spinner { width: 16px; height: 16px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: girar 0.8s linear infinite; flex-shrink: 0; }
    @keyframes girar { to { transform: rotate(360deg); } }
  `]
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  cargando = false;
  error = '';
  conectando = true;
  errorConexion = '';
  mensajeConexion = 'Conectando con el servidor...';

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
    private clientesService: ClientesService
  ) {}

  ngOnInit() {
    if (this.auth.isLoggedIn()) { this.router.navigate(['/dashboard']); return; }
    this.esperarServidor();
  }

  async esperarServidor() {
    const maxIntentos = 20;
    this.conectando = true;
    this.errorConexion = '';

    for (let i = 0; i < maxIntentos; i++) {
      this.mensajeConexion = i === 0
        ? 'Conectando con el servidor...'
        : `Esperando al servidor... (${i}/${maxIntentos})`;

      const ok = await new Promise<boolean>(resolve => {
        this.clientesService.ping().subscribe(resultado => resolve(resultado));
      });

      if (ok) {
        this.conectando = false;
        return;
      }

      await new Promise(r => setTimeout(r, 3000));
    }

    this.conectando = false;
    this.errorConexion = '❌ No se pudo conectar con el servidor.';
  }

  reintentar() {
    this.esperarServidor();
  }

  iniciarSesion() {
    if (!this.email || !this.password) { this.error = 'Rellena todos los campos'; return; }
    this.cargando = true;
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: () => { this.toast.exito('Bienvenido'); this.router.navigate(['/dashboard']); },
      error: () => { this.error = 'Email o contraseña incorrectos'; this.cargando = false; }
    });
  }
}
