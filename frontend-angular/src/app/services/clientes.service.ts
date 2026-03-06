import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Cliente } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ClientesService {

  private apiUrl = 'http://localhost:3000/api/clientes';
  private pingUrl = 'http://localhost:3000/';

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('token')}` });
  }

  getAll(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl, { headers: this.headers() });
  }

  // ping al endpoint publico "/" — no necesita token
  // devuelve true si el servidor responde, false si no
  ping(): Observable<boolean> {
    return this.http.get(this.pingUrl, { responseType: 'text' }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
