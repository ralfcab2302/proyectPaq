import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paquete, PaquetesResponse, Estadisticas, FiltrosPaquetes } from '../models/models';

@Injectable({ providedIn: 'root' })
export class PaquetesService {

  private apiUrl = 'http://localhost:3000/api/paquetes';

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('token')}` });
  }

  getAll(filtros: Partial<FiltrosPaquetes>): Observable<PaquetesResponse> {
    let params = new HttpParams();
    if (filtros.pagina)       params = params.set('pagina',       filtros.pagina.toString());
    if (filtros.limite)       params = params.set('limite',       filtros.limite.toString());
    if (filtros.origen)       params = params.set('origen',       filtros.origen);
    if (filtros.salida)       params = params.set('salida',       filtros.salida);
    if (filtros.codigoBarras) params = params.set('codigoBarras', filtros.codigoBarras);
    return this.http.get<PaquetesResponse>(this.apiUrl, { headers: this.headers(), params });
  }

  getByCodigo(codigo: string): Observable<Paquete> {
    return this.http.get<Paquete>(`${this.apiUrl}/codigo/${encodeURIComponent(codigo)}`, { headers: this.headers() });
  }

  getEstadisticas(filtros: { origen?: string; salida?: string; codigoBarras?: string }): Observable<Estadisticas> {
    let params = new HttpParams().set('a', '1');
    if (filtros.origen)       params = params.set('origen',       filtros.origen);
    if (filtros.salida)       params = params.set('salida',       filtros.salida);
    if (filtros.codigoBarras) params = params.set('codigoBarras', filtros.codigoBarras);
    return this.http.get<Estadisticas>(`${this.apiUrl}/estadisticas`, { headers: this.headers(), params });
  }

  update(id: number, datos: Partial<Paquete>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, datos, { headers: this.headers() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.headers() });
  }

  getSugerencias(codigoBarras: string): Observable<PaquetesResponse> {
    const params = new HttpParams().set('pagina', '1').set('limite', '8').set('codigoBarras', codigoBarras);
    return this.http.get<PaquetesResponse>(this.apiUrl, { headers: this.headers(), params });
  }
}
