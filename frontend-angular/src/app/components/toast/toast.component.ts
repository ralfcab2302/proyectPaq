import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (t of toastService.toasts(); track t.id) {
        <div class="toast {{ t.tipo }} show">
          <span class="toast-icono">{{ iconos[t.tipo] }}</span>
          <span class="toast-texto">{{ t.mensaje }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999; display: flex; flex-direction: column; gap: 0.5rem; pointer-events: none; }
    .toast { display: flex; align-items: center; gap: 0.65rem; padding: 0.75rem 1.1rem; border-radius: 10px; font-size: 0.88rem; font-weight: 500; min-width: 220px; max-width: 340px; box-shadow: 0 8px 24px rgba(0,0,0,0.3); border-left: 4px solid transparent; background-color: var(--bg-card); color: var(--text); opacity: 0; transform: translateY(16px); transition: opacity 0.25s ease, transform 0.25s ease; }
    .toast.show { opacity: 1; transform: translateY(0); }
    .toast.exito { border-color: #43e97b; }
    .toast.error { border-color: #ff6584; }
    .toast.info  { border-color: #6c63ff; }
    .toast-icono { font-size: 1.1rem; flex-shrink: 0; }
    .toast-texto { flex: 1; line-height: 1.3; }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
  iconos: Record<string, string> = { exito: '✅', error: '❌', info: 'ℹ️' };
}
