import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { PaquetesService } from '../../services/paquetes.service';
import { ClientesService } from '../../services/clientes.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Paquete, Cliente, Estadisticas, PaquetesResponse } from '../../models/models';
import { GraficosComponent } from '../../components/graficos/graficos.component';
import { ModalEditarComponent } from '../../components/modal-editar/modal-editar.component';
import { ModalEliminarComponent } from '../../components/modal-eliminar/modal-eliminar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, GraficosComponent, ModalEditarComponent, ModalEliminarComponent],
  template: `
@if (true) {
      <!-- CABECERA -->
      <div class="caja cabecera">
        <div class="logo-area">
          <div class="logo-icono">📦</div>
          <div>
            <div class="logo-nombre">Paq<span>Track</span></div>
            <div class="logo-sub">Angular v17</div>
          </div>
        </div>
        <div class="cabecera-acciones">
          <button class="boton-tema" (click)="cambiarTema()">{{ temaClaro ? '🌙' : '☀️' }}</button>
          <button class="boton-gris" style="width:auto" (click)="auth.logout()">Salir</button>
        </div>
      </div>

      <!-- FILTROS -->
      <div class="caja filtros-caja">
        <div class="filtros-grid">
          <div style="position:relative">
            <input type="text" [(ngModel)]="filtros.codigoBarras" placeholder="Buscar código de barras..."
              (ngModelChange)="onBusquedaChange($event)" (blur)="ocultarSugerencias()" autocomplete="off">
            @if (sugerencias.length > 0) {
              <div class="sugerencias-lista">
                @for (s of sugerencias; track s) {
                  <div class="sugerencia-item" (mousedown)="seleccionarSugerencia(s)">{{ s }}</div>
                }
              </div>
            }
          </div>
          <select [(ngModel)]="filtros.origen" (ngModelChange)="aplicarFiltros()">
            <option value="">Todos los orígenes</option>
            <option value="Cordoba">Córdoba</option>
            <option value="Sevilla">Sevilla</option>
          </select>
          <select [(ngModel)]="filtros.salida" (ngModelChange)="aplicarFiltros()">
            <option value="">Todas las empresas</option>
            @for (c of clientes; track c.id) {
              <option [value]="c.id">{{ c.nombre }}</option>
            }
          </select>
          <select [(ngModel)]="filtros.limite" (ngModelChange)="aplicarFiltros()">
            <option value="25">25 por página</option>
            <option value="50">50 por página</option>
            <option value="100">100 por página</option>
          </select>
          <button class="boton-gris" style="width:auto" (click)="limpiarFiltros()">Limpiar</button>
        </div>
      </div>

      <!-- GRAFICOS -->
      @if (estadisticasCompletas && estadisticasSinOrigen) {
        <app-graficos
          [datosCompletos]="estadisticasCompletas"
          [datosSinOrigen]="estadisticasSinOrigen"
          [nombreCliente]="nombreClienteSeleccionado">
        </app-graficos>
      }

      <!-- TABLA -->
      <div class="caja tabla-caja">
        <div class="tabla-header">
          <span class="info-resultados">{{ infoResultados }}</span>
        </div>
        <div class="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Código de barras</th>
                <th>Fecha</th>
                <th>Origen</th>
                <th>Empresa</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (p of paquetes; track p.id) {
                <tr>
                  <td class="id-col">#{{ p.id }}</td>
                  <td>
                    <a [routerLink]="['/paquete', p.codigoBarras]" class="codigo-link">{{ p.codigoBarras }}</a>
                  </td>
                  <td class="fecha-col">{{ p.fechaSalida | date:'dd/MM/yyyy' }}</td>
                  <td><span class="etiqueta-verde">{{ p.origen }}</span></td>
                  <td><span class="etiqueta-morada">{{ p.nombreCliente }}</span></td>
                  <td class="acciones-col">
                    <button class="boton-icono" (click)="abrirEditar(p)" title="Editar">✏️</button>
                    <button class="boton-icono" (click)="abrirEliminar(p)" title="Eliminar">🗑️</button>
                  </td>
                </tr>
              }
              @if (paquetes.length === 0) {
                <tr><td colspan="6" class="sin-resultados">No hay resultados</td></tr>
              }
            </tbody>
          </table>
        </div>

        <!-- PAGINACION -->
        @if (totalPaginas > 1) {
          <div class="paginacion">
            <button class="boton-pagina" [disabled]="pagina === 1" (click)="irPagina(pagina - 1)">←</button>
            @for (p of paginasVisibles; track p) {
              <button class="boton-pagina" [class.activo]="p === pagina" (click)="irPagina(p)">{{ p }}</button>
            }
            <button class="boton-pagina" [disabled]="pagina === totalPaginas" (click)="irPagina(pagina + 1)">→</button>
          </div>
        }
      </div>
    }

    <!-- MODALES -->
    <app-modal-editar
      [visible]="modalEditar"
      [paquete]="paqueteSeleccionado"
      [clientes]="clientes"
      (cerrar)="modalEditar = false"
      (guardar)="guardarEdicion($event)">
    </app-modal-editar>

    <app-modal-eliminar
      [visible]="modalEliminar"
      [codigoBarras]="paqueteSeleccionado?.codigoBarras || ''"
      (cerrar)="modalEliminar = false"
      (confirmar)="confirmarEliminar()">
    </app-modal-eliminar>
  `,
  styles: [`
    .cabecera { padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem; }
    .logo-area { display: flex; align-items: center; gap: 10px; }
    .logo-icono { width: 38px; height: 38px; background: linear-gradient(135deg,#6c63ff,#ff6584); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
    .logo-nombre { font-family: 'Space Mono', monospace; font-size: 1rem; font-weight: 700; }
    .logo-nombre span { color: var(--accent); }
    .logo-sub { font-size: 0.6rem; color: var(--text-muted); }
    .cabecera-acciones { display: flex; gap: 8px; align-items: center; }
    .filtros-caja { padding: 1rem 1.25rem; margin-bottom: 1rem; }
    .filtros-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 0.75rem; align-items: center; }
    .tabla-caja { padding: 0; overflow: hidden; margin-bottom: 1rem; }
    .tabla-header { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); }
    .info-resultados { font-size: 0.8rem; color: var(--text-muted); }
    .tabla-scroll { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 10px 1.25rem; text-align: left; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--border); white-space: nowrap; }
    td { padding: 12px 1.25rem; border-bottom: 1px solid var(--bg-input); font-size: 0.85rem; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: var(--bg-input); }
    .id-col { color: var(--text-muted); font-family: 'Space Mono', monospace; font-size: 0.75rem; }
    .fecha-col { color: var(--text-muted); }
    .acciones-col { text-align: right; white-space: nowrap; }
    .codigo-link { font-family: 'Space Mono', monospace; color: var(--accent); font-size: 0.78rem; text-decoration: none; border-bottom: 1px dashed var(--accent); }
    .codigo-link:hover { opacity: 0.7; }
    .sin-resultados { text-align: center; padding: 3rem; color: var(--text-muted); }
    .paginacion { display: flex; justify-content: center; gap: 4px; padding: 1rem; flex-wrap: wrap; }
    .boton-pagina { background: var(--bg-input); border: 1px solid var(--border); border-radius: 6px; padding: 6px 12px; font-size: 0.8rem; color: var(--text); cursor: pointer; }
    .boton-pagina.activo { background: var(--accent); border-color: var(--accent); color: #fff; }
    .boton-pagina:disabled { opacity: 0.3; cursor: not-allowed; }
    .sugerencias-lista { position: absolute; top: 100%; left: 0; right: 0; z-index: 500; margin-top: 4px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
    .sugerencia-item { padding: 9px 14px; font-family: 'Space Mono', monospace; font-size: 0.8rem; color: var(--text); cursor: pointer; border-bottom: 1px solid var(--bg-input); }
    .sugerencia-item:hover { background: var(--bg-input); color: var(--accent); }
    @media (max-width: 900px) { .filtros-grid { grid-template-columns: 1fr 1fr; } }
  `]
})
export class DashboardComponent implements OnInit {

  paquetes: Paquete[] = [];
  clientes: Cliente[] = [];
  estadisticasCompletas: Estadisticas | null = null;
  estadisticasSinOrigen: Estadisticas | null = null;
  sugerencias: string[] = [];
  paqueteSeleccionado: Paquete | null = null;
  modalEditar = false;
  modalEliminar = false;
  temaClaro = false;
  infoResultados = '';
  pagina = 1;
  totalPaginas = 1;
  paginasVisibles: number[] = [];
  nombreClienteSeleccionado = '';

  filtros = { codigoBarras: '', origen: '', salida: '', limite: 50 };

  private busquedaSubject = new Subject<string>();

  constructor(
    public auth: AuthService,
    private paquetesService: PaquetesService,
    private clientesService: ClientesService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    const tema = localStorage.getItem('tema');
    if (tema === 'claro') { document.body.classList.add('claro'); this.temaClaro = true; }

    this.busquedaSubject.pipe(debounceTime(250), distinctUntilChanged()).subscribe(val => {
      if (val.length >= 2) {
        this.paquetesService.getSugerencias(val).subscribe(res => {
          this.sugerencias = res.datos.map(p => p.codigoBarras);
        });
      } else {
        this.sugerencias = [];
      }
    });

    this.arrancar();
  }

  arrancar() {
    // el usuario ya pasó por el login y tiene token válido
    // simplemente cargar los datos directamente
    this.clientesService.getAll().subscribe(c => { this.clientes = c; });
    this.cargarTodo();
  }

  cargarTodo() {
    const f = this.filtros;
    forkJoin([
      this.paquetesService.getAll({ pagina: this.pagina, limite: f.limite, origen: f.origen, salida: f.salida, codigoBarras: f.codigoBarras }),
      this.paquetesService.getEstadisticas({ origen: f.origen, salida: f.salida, codigoBarras: f.codigoBarras }),
      this.paquetesService.getEstadisticas({ salida: f.salida, codigoBarras: f.codigoBarras })
    ]).subscribe({
      next: ([paquetes, estadComp, estadSinOrigen]) => {
        this.setPaquetes(paquetes);
        this.estadisticasCompletas  = estadComp;
        this.estadisticasSinOrigen  = estadSinOrigen;
        this.nombreClienteSeleccionado = f.salida ? (this.clientes.find(c => c.id.toString() === f.salida)?.nombre ?? '') : '';
      },
      error: () => {}
    });
  }

  setPaquetes(res: PaquetesResponse) {
    this.paquetes = res.datos;
    this.totalPaginas = res.totalPaginas;
    const desde = (this.pagina - 1) * this.filtros.limite + 1;
    const hasta = Math.min(this.pagina * this.filtros.limite, res.total);
    this.infoResultados = `Mostrando ${desde}–${hasta} de ${res.total} paquetes`;
    this.calcularPaginas();
  }

  calcularPaginas() {
    const pages: number[] = [];
    for (let i = Math.max(1, this.pagina - 2); i <= Math.min(this.totalPaginas, this.pagina + 2); i++) pages.push(i);
    this.paginasVisibles = pages;
  }

  aplicarFiltros() { this.pagina = 1; this.cargarTodo(); }
  limpiarFiltros() { this.filtros = { codigoBarras: '', origen: '', salida: '', limite: 50 }; this.aplicarFiltros(); }
  irPagina(p: number) { this.pagina = p; this.cargarTodo(); }

  onBusquedaChange(val: string) { this.busquedaSubject.next(val); this.aplicarFiltros(); }
  seleccionarSugerencia(s: string) { this.filtros.codigoBarras = s; this.sugerencias = []; this.aplicarFiltros(); }
  ocultarSugerencias() { setTimeout(() => { this.sugerencias = []; }, 150); }

  cambiarTema() {
    this.temaClaro = !this.temaClaro;
    document.body.classList.toggle('claro', this.temaClaro);
    localStorage.setItem('tema', this.temaClaro ? 'claro' : 'oscuro');
  }

  abrirEditar(p: Paquete) { this.paqueteSeleccionado = p; this.modalEditar = true; }
  abrirEliminar(p: Paquete) { this.paqueteSeleccionado = p; this.modalEliminar = true; }

  guardarEdicion(datos: Partial<Paquete>) {
    if (!this.paqueteSeleccionado) return;
    this.paquetesService.update(this.paqueteSeleccionado.id, datos).subscribe({
      next: () => { this.modalEditar = false; this.toast.exito('Paquete actualizado'); this.cargarTodo(); },
      error: () => this.toast.error('Error al actualizar')
    });
  }

  confirmarEliminar() {
    if (!this.paqueteSeleccionado) return;
    this.paquetesService.delete(this.paqueteSeleccionado.id).subscribe({
      next: () => { this.modalEliminar = false; this.toast.error('Paquete eliminado'); this.cargarTodo(); },
      error: () => this.toast.error('Error al eliminar')
    });
  }
}
