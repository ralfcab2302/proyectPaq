import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-modal-eliminar',
  standalone: true,
  template: `
    <div class="modal-fondo" [class.visible]="visible" (click)="onFondoClick($event)">
      <div class="modal-caja">
        <div class="modal-titulo">
          <span>🗑️ Eliminar paquete</span>
          <button class="boton-icono" (click)="cerrar.emit()">✕</button>
        </div>
        <p class="modal-confirmar-texto">
          ¿Seguro que quieres eliminar el paquete<br>
          <span class="modal-confirmar-codigo">{{ codigoBarras }}</span>?<br><br>
          Esta acción no se puede deshacer.
        </p>
        <div class="modal-botones">
          <button class="boton-gris" (click)="cerrar.emit()">Cancelar</button>
          <button class="boton-rojo" style="width:100%" (click)="confirmar.emit()">Sí, eliminar</button>
        </div>
      </div>
    </div>
  `
})
export class ModalEliminarComponent {
  @Input() visible = false;
  @Input() codigoBarras = '';
  @Output() cerrar = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<void>();

  onFondoClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-fondo')) this.cerrar.emit();
  }
}
