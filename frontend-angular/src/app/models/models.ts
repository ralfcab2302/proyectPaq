export interface Paquete {
  id: number;
  codigoBarras: string;
  fechaSalida: string;
  origen: string;
  salida: number;
  nombreCliente: string;
}

export interface PaquetesResponse {
  datos: Paquete[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface Cliente {
  id: number;
  nombre: string;
}

export interface Estadisticas {
  porSalida: { nombre: string; total: number }[];
  porOrigen: { nombre: string; total: number }[];
  porMes: { nombre: string; origen: string; total: number }[];
  porMesPorOrigen: { mes: string; origen: string; total: number }[];
}

export interface FiltrosPaquetes {
  origen: string;
  salida: string;
  codigoBarras: string;
  pagina: number;
  limite: number;
}

export interface Toast {
  id: number;
  mensaje: string;
  tipo: 'exito' | 'error' | 'info';
}
