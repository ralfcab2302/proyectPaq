import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PaquetesService } from '../../services/paquetes.service';
import { ClientesService } from '../../services/clientes.service';
import { ToastService } from '../../services/toast.service';
import { Paquete, Cliente } from '../../models/models';
import { ModalEditarComponent } from '../../components/modal-editar/modal-editar.component';
import { ModalEliminarComponent } from '../../components/modal-eliminar/modal-eliminar.component';

@Component({
  selector: 'app-paquete',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalEditarComponent, ModalEliminarComponent],
  template: `
    <!-- CABECERA -->
    <div class="caja cabecera">
      <div class="logo-area">
        <a routerLink="/dashboard" style="text-decoration:none">
          <div class="logo-icono">📦</div>
        </a>
        <div>
          <div class="logo-nombre">Paq<span>Track</span></div>
          <div class="logo-sub">Detalle de paquete</div>
        </div>
      </div>
      <a routerLink="/dashboard">
        <button class="boton-gris" style="width:auto">← Volver</button>
      </a>
    </div>

    @if (cargando) {
      <div class="caja" style="padding:3rem;text-align:center;color:var(--text-muted);">Cargando...</div>
    } @else if (!paquete) {
      <div class="caja" style="padding:3rem;text-align:center;color:var(--accent2);">Paquete no encontrado</div>
    } @else {
      <div style="max-width:600px;margin:0 auto">

        <!-- código grande -->
        <div class="caja" style="padding:2rem;text-align:center;margin-bottom:1rem">
          <div class="label-titulo">Código de barras</div>
          <div class="codigo-grande">{{ paquete.codigoBarras }}</div>
          <button class="boton-gris" style="width:auto;padding:6px 16px;font-size:0.78rem;margin-top:1rem" (click)="copiar()">
            📋 Copiar código
          </button>
        </div>

        <!-- detalles -->
        <div class="caja" style="overflow:hidden;margin-bottom:1rem">
          <div class="tabla-titulo">// detalles</div>
          <table class="detalle-tabla">
            <tr><td class="etiqueta">ID interno</td><td>#{{ paquete.id }}</td></tr>
            <tr><td class="etiqueta">Fecha salida</td><td>{{ paquete.fechaSalida | date:'dd MMMM yyyy':'':'es' }}</td></tr>
            <tr><td class="etiqueta">Origen</td><td><span class="etiqueta-verde">{{ paquete.origen }}</span></td></tr>
            <tr><td class="etiqueta">Empresa</td><td><span class="etiqueta-morada">{{ paquete.nombreCliente }}</span></td></tr>
          </table>
        </div>

        <!-- acciones -->
        <div style="display:flex;gap:0.75rem">
          <button class="boton-azul" (click)="modalEditar = true">✏️ Editar</button>
          <button class="boton-rojo" style="width:100%" (click)="modalEliminar = true">🗑️ Eliminar</button>
        </div>
      </div>
    }

    <app-modal-editar
      [visible]="modalEditar"
      [paquete]="paquete"
      [clientes]="clientes"
      (cerrar)="modalEditar = false"
      (guardar)="guardar($event)">
    </app-modal-editar>

    <app-modal-eliminar
      [visible]="modalEliminar"
      [codigoBarras]="paquete?.codigoBarras || ''"
      (cerrar)="modalEliminar = false"
      (confirmar)="eliminar()">
    </app-modal-eliminar>
  `,
  styles: [`
    .cabecera { padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .logo-area { display: flex; align-items: center; gap: 10px; }
    .logo-icono { width: 38px; height: 38px; background: linear-gradient(135deg,#6c63ff,#ff6584); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
    .logo-nombre { font-family: 'Space Mono', monospace; font-size: 1rem; font-weight: 700; }
    .logo-nombre span { color: var(--accent); }
    .logo-sub { font-size: 0.65rem; color: var(--text-muted); }
    .label-titulo { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 0.5rem; }
    .codigo-grande { font-family: 'Space Mono', monospace; font-size: 1.4rem; color: var(--accent); letter-spacing: 2px; word-break: break-all; }
    .tabla-titulo { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); font-family: 'Space Mono', monospace; font-size: 0.85rem; }
    .detalle-tabla { width: 100%; border-collapse: collapse; }
    .detalle-tabla tr { border-bottom: 1px solid var(--bg-input); }
    .detalle-tabla tr:last-child { border-bottom: none; }
    .detalle-tabla td { padding: 13px 1.25rem; font-size: 0.9rem; }
    .etiqueta { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; width: 140px; white-space: nowrap; }
  `]
})
export class PaqueteComponent implements OnInit {
  paquete: Paquete | null = null;
  clientes: Cliente[] = [];
  cargando = true;
  modalEditar = false;
  modalEliminar = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paquetesService: PaquetesService,
    private clientesService: ClientesService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    const codigo = this.route.snapshot.paramMap.get('codigo') ?? '';
    this.paquetesService.getByCodigo(codigo).subscribe({
      next: p => { this.paquete = p; this.cargando = false; },
      error: () => { this.paquete = null; this.cargando = false; }
    });
    this.clientesService.getAll().subscribe(c => this.clientes = c);
  }

  copiar() {
    navigator.clipboard.writeText(this.paquete?.codigoBarras ?? '').then(() => this.toast.exito('Código copiado'));
  }

  guardar(datos: Partial<Paquete>) {
    if (!this.paquete) return;
    this.paquetesService.update(this.paquete.id, datos).subscribe({
      next: () => {
        this.modalEditar = false;
        this.toast.exito('Paquete actualizado');
        this.paquetesService.getByCodigo(this.paquete!.codigoBarras).subscribe(p => this.paquete = p);
      },
      error: () => this.toast.error('Error al actualizar')
    });
  }

  eliminar() {
    if (!this.paquete) return;
    this.paquetesService.delete(this.paquete.id).subscribe({
      next: () => { this.toast.error('Paquete eliminado'); this.router.navigate(['/dashboard']); },
      error: () => this.toast.error('Error al eliminar')
    });
  }
}
