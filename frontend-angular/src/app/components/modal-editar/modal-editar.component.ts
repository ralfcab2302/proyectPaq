import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Paquete, Cliente } from '../../models/models';

@Component({
  selector: 'app-modal-editar',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="modal-fondo" [class.visible]="visible" (click)="onFondoClick($event)">
      <div class="modal-caja">
        <div class="modal-titulo">
          <span>✏️ Editar paquete</span>
          <button class="boton-icono" (click)="cerrar.emit()">✕</button>
        </div>
        <div class="modal-campo">
          <label>Fecha de salida</label>
          <input type="date" [(ngModel)]="datos.fechaSalida">
        </div>
        <div class="modal-campo">
          <label>Origen</label>
          <select [(ngModel)]="datos.origen">
            <option value="Cordoba">Cordoba</option>
            <option value="Sevilla">Sevilla</option>
          </select>
        </div>
        <div class="modal-campo">
          <label>Salida (empresa)</label>
          <select [(ngModel)]="datos.salida">
            @for (c of clientes; track c.id) {
              <option [value]="c.id">{{ c.nombre }}</option>
            }
          </select>
        </div>
        <div class="modal-botones">
          <button class="boton-gris" (click)="cerrar.emit()">Cancelar</button>
          <button class="boton-azul" (click)="guardar.emit(datos)">Guardar</button>
        </div>
      </div>
    </div>
  `
})
export class ModalEditarComponent implements OnChanges {
  @Input() visible = false;
  @Input() paquete: Paquete | null = null;
  @Input() clientes: Cliente[] = [];
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<Partial<Paquete>>();

  datos: Partial<Paquete> = {};

  ngOnChanges() {
    if (this.paquete) {
      this.datos = {
        fechaSalida: this.paquete.fechaSalida?.split('T')[0],
        origen: this.paquete.origen,
        salida: this.paquete.salida
      };
    }
  }

  onFondoClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-fondo')) this.cerrar.emit();
  }
}
