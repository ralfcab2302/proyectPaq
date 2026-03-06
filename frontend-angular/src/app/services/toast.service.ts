import { Injectable, signal } from '@angular/core';
import { Toast } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ToastService {

  toasts = signal<Toast[]>([]);
  private nextId = 0;

  show(mensaje: string, tipo: Toast['tipo'] = 'info') {
    const id = this.nextId++;
    this.toasts.update(t => [...t, { id, mensaje, tipo }]);
    setTimeout(() => this.remove(id), 3000);
  }

  remove(id: number) {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }

  exito(msg: string)  { this.show(msg, 'exito'); }
  error(msg: string)  { this.show(msg, 'error'); }
  info(msg: string)   { this.show(msg, 'info'); }
}
