import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  template: `
    @if (visible) {
      <div class="pantalla-carga">
        <div class="logo-icono">📦</div>
        <div class="logo-texto">Paq<span>Track</span></div>
        <div class="mensaje">{{ mensaje }}</div>
        <div class="barra-contenedor">
          <div class="barra-progreso"></div>
        </div>
      </div>
    }
  `,
  styles: [`
    .pantalla-carga { position: fixed; inset: 0; background-color: var(--bg); z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; }
    .logo-icono { font-size: 3rem; animation: latido 1.2s ease-in-out infinite; }
    .logo-texto { font-family: 'Space Mono', monospace; font-size: 1.2rem; font-weight: 700; }
    .logo-texto span { color: var(--accent); }
    .mensaje { font-size: 0.82rem; color: var(--text-muted); }
    .barra-contenedor { width: 180px; height: 3px; background: var(--bg-input); border-radius: 99px; overflow: hidden; }
    .barra-progreso { height: 100%; background: linear-gradient(90deg, #6c63ff, #ff6584); border-radius: 99px; animation: barra 1.4s ease-in-out infinite; }
    @keyframes latido { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }
    @keyframes barra { 0% { transform: translateX(-100%); } 50% { transform: translateX(0%); } 100% { transform: translateX(100%); } }
  `]
})
export class LoadingComponent {
  @Input() visible = true;
  @Input() mensaje = 'Conectando con el servidor...';
}
