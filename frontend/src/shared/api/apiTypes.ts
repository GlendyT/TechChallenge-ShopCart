export interface ApiFieldError {
  campo: string;
  mensaje: string;
}

export interface ApiEnvelope<T> {
  ok: boolean;
  mensaje?: string;
  datos: T;
  totalRegistros?: number;
  paginaActual?: number;
  tamanoPagina?: number;
  totalPaginas?: number;
  errores?: ApiFieldError[];
}
