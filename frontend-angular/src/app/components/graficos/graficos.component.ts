import { Component, Input, OnChanges, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Estadisticas, Cliente } from '../../models/models';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const COLORES_EMPRESA: Record<string, { primario: string; secundario: string; fondo: string }> = {
  'GLS':     { primario: '#FFD100', secundario: '#1D3C87', fondo: 'rgba(255,209,0,0.08)' },
  'SEUR':    { primario: '#FFCC00', secundario: '#E30613', fondo: 'rgba(255,204,0,0.08)' },
  'MRW':     { primario: '#E30613', secundario: '#FFD100', fondo: 'rgba(227,6,19,0.08)'  },
  'Correos': { primario: '#FFCC00', secundario: '#004B8D', fondo: 'rgba(255,204,0,0.08)' },
  'DHL':     { primario: '#FFCC00', secundario: '#D40511', fondo: 'rgba(255,204,0,0.08)' },
  'UPS':     { primario: '#351C15', secundario: '#FFB500', fondo: 'rgba(53,28,21,0.08)'  },
  'FedEx':   { primario: '#4D148C', secundario: '#FF6600', fondo: 'rgba(77,20,140,0.08)' },
  'Nacex':   { primario: '#FFDD00', secundario: '#0055A5', fondo: 'rgba(255,221,0,0.08)' }
};

const LISTA_COLORES = ['#6c63ff','#43e97b','#ff6584','#fbbf24','#06b6d4','#f97316','#a855f7','#ec4899','#22c55e','#3b82f6'];

@Component({
  selector: 'app-graficos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="graficos-grid">
      <!-- grafico 1 -->
      <div class="caja grafico-caja">
        <div class="grafico-titulo">{{ tituloG1 }}</div>
        <div class="contenedor-grafico"><canvas #canvas1></canvas></div>
      </div>
      <!-- grafico 2 siempre igual -->
      <div class="caja grafico-caja">
        <div class="grafico-titulo">Cordoba vs Sevilla</div>
        <div class="contenedor-grafico"><canvas #canvas2></canvas></div>
      </div>
      <!-- grafico 3 -->
      <div class="caja grafico-caja">
        <div class="grafico-titulo">{{ tituloG3 }}</div>
        <div class="contenedor-grafico"><canvas #canvas3></canvas></div>
      </div>
    </div>
  `,
  styles: [`
    .graficos-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-bottom: 1rem; }
    .grafico-caja { padding: 1.25rem; }
    .grafico-titulo { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem; }
    .contenedor-grafico { position: relative; height: 200px; }
    @media (max-width: 900px) { .graficos-grid { grid-template-columns: 1fr; } }
  `]
})
export class GraficosComponent implements OnChanges, OnDestroy, AfterViewInit {
  @Input() datosCompletos!: Estadisticas;
  @Input() datosSinOrigen!: Estadisticas;
  @Input() nombreCliente = '';

  @ViewChild('canvas1') canvas1Ref!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvas2') canvas2Ref!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvas3') canvas3Ref!: ElementRef<HTMLCanvasElement>;

  private charts: (Chart | null)[] = [null, null, null];
  private viewReady = false;

  tituloG1 = 'Paquetes por empresa';
  tituloG3 = 'Evolucion por mes';

  ngAfterViewInit() {
    this.viewReady = true;
    if (this.datosCompletos && this.datosSinOrigen) this.dibujar();
  }

  ngOnChanges() {
    if (this.viewReady && this.datosCompletos && this.datosSinOrigen) this.dibujar();
  }

  ngOnDestroy() {
    this.charts.forEach(c => c?.destroy());
  }

  private get colorTexto() { return getComputedStyle(document.body).getPropertyValue('--text-muted').trim() || '#888'; }
  private get colorGrid()  { return document.body.classList.contains('claro') ? 'rgba(200,200,220,0.5)' : 'rgba(42,42,56,0.5)'; }

  private destroy() { this.charts.forEach(c => c?.destroy()); this.charts = [null, null, null]; }

  dibujar() {
    this.destroy();
    const hayCliente = !!this.nombreCliente;
    const colores = hayCliente ? (COLORES_EMPRESA[this.nombreCliente] || { primario: '#6c63ff', secundario: '#ff6584', fondo: 'rgba(108,99,255,0.08)' }) : null;

    this.tituloG1 = hayCliente ? `${this.nombreCliente} — Córdoba vs Sevilla` : 'Paquetes por empresa';
    this.tituloG3 = hayCliente ? `Evolución mensual — ${this.nombreCliente}` : 'Evolucion por mes';

    // ── GRAFICO 1 ───────────────────────────────────────────
    if (!hayCliente) {
      const labels = this.datosCompletos.porSalida.map(x => x.nombre);
      const data   = this.datosCompletos.porSalida.map(x => x.total);
      this.charts[0] = new Chart(this.canvas1Ref.nativeElement, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: LISTA_COLORES, borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%',
          plugins: { legend: { position: 'bottom', labels: { color: this.colorTexto, font: { size: 10 }, boxWidth: 10 } } } }
      });
    } else {
      const cordoba = this.datosSinOrigen.porOrigen.find(x => x.nombre === 'Cordoba')?.total ?? 0;
      const sevilla = this.datosSinOrigen.porOrigen.find(x => x.nombre === 'Sevilla')?.total ?? 0;
      this.charts[0] = new Chart(this.canvas1Ref.nativeElement, {
        type: 'doughnut',
        data: { labels: ['Cordoba', 'Sevilla'], datasets: [{ data: [cordoba, sevilla], backgroundColor: [colores!.primario, colores!.secundario], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%',
          plugins: { legend: { position: 'bottom', labels: { color: this.colorTexto, font: { size: 11 }, boxWidth: 12 } } } }
      });
    }

    // ── GRAFICO 2 siempre igual ──────────────────────────────
    const cordobaBarras = this.datosSinOrigen.porOrigen.find(x => x.nombre === 'Cordoba')?.total ?? 0;
    const sevillaBarras = this.datosSinOrigen.porOrigen.find(x => x.nombre === 'Sevilla')?.total ?? 0;
    this.charts[1] = new Chart(this.canvas2Ref.nativeElement, {
      type: 'bar',
      data: { labels: ['Cordoba', 'Sevilla'], datasets: [{
        data: [cordobaBarras, sevillaBarras],
        backgroundColor: ['rgba(108,99,255,0.8)', 'rgba(67,233,123,0.8)'],
        borderColor: ['#6c63ff', '#43e97b'], borderWidth: 2, borderRadius: 8
      } as any] },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { color: this.colorTexto, font: { size: 12 } }, grid: { display: false } }, y: { ticks: { color: this.colorTexto, font: { size: 9 } }, grid: { color: this.colorGrid } } } }
    });

    // ── GRAFICO 3 ────────────────────────────────────────────
    if (!hayCliente) {
      const mesesSet = new Set(this.datosCompletos.porMesPorOrigen.map(x => x.mes));
      const meses = Array.from(mesesSet).sort();
      const vCor = meses.map(m => this.datosCompletos.porMesPorOrigen.find(x => x.mes === m && x.origen === 'Cordoba')?.total ?? 0);
      const vSev = meses.map(m => this.datosCompletos.porMesPorOrigen.find(x => x.mes === m && x.origen === 'Sevilla')?.total ?? 0);
      this.charts[2] = new Chart(this.canvas3Ref.nativeElement, {
        type: 'line',
        data: { labels: meses, datasets: [
          { label: 'Cordoba', data: vCor, borderColor: '#6c63ff', backgroundColor: 'rgba(108,99,255,0.06)', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 },
          { label: 'Sevilla', data: vSev, borderColor: '#43e97b', backgroundColor: 'rgba(67,233,123,0.06)', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 }
        ] },
        options: { responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: true, labels: { color: this.colorTexto, font: { size: 10 }, boxWidth: 12 } } },
          scales: { x: { ticks: { color: this.colorTexto, font: { size: 9 } }, grid: { color: this.colorGrid } }, y: { ticks: { color: this.colorTexto, font: { size: 9 } }, grid: { color: this.colorGrid } } } }
      });
    } else {
      const totalesPorMes: Record<string, number> = {};
      this.datosCompletos.porMes.forEach(f => { totalesPorMes[f.nombre] = (totalesPorMes[f.nombre] ?? 0) + Number(f.total); });
      const meses = Object.keys(totalesPorMes).sort();
      this.charts[2] = new Chart(this.canvas3Ref.nativeElement, {
        type: 'line',
        data: { labels: meses, datasets: [{
          label: this.nombreCliente, data: meses.map(m => totalesPorMes[m]),
          borderColor: colores!.primario, backgroundColor: colores!.fondo,
          fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: colores!.primario,
          pointBorderColor: colores!.secundario, pointBorderWidth: 2, borderWidth: 2
        } as any] },
        options: { responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: true, labels: { color: this.colorTexto, font: { size: 10 }, boxWidth: 12 } } },
          scales: { x: { ticks: { color: this.colorTexto, font: { size: 9 } }, grid: { color: this.colorGrid } }, y: { ticks: { color: this.colorTexto, font: { size: 9 } }, grid: { color: this.colorGrid } } } }
      });
    }
  }
}
