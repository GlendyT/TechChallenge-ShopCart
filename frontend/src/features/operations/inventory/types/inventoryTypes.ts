export interface InventoryFilters {
  busqueda: string;
  idCategoria: string;
  soloBajoStock: boolean;
}

export interface InventoryVariant {
  IDVariante: number;
  IDProducto: number;
  CodigoPublicoProducto: string;
  NombreProducto: string;
  Categoria: string;
  SKU: string;
  NombreVariante: string;
  Talla: string | null;
  Color: string | null;
  Precio: number;
  ExistenciaFisica: number;
  UnidadesReservadas: number;
  ExistenciaDisponible: number;
  VarianteActiva: boolean;
  TotalRegistros?: number;
}

export type InventoryMovementType = "ENTRADA_COMPRA" | "SALIDA_VENTA" | "AJUSTE_POSITIVO" | "AJUSTE_NEGATIVO" | "DEVOLUCION_REINTEGRO" | "CANCELACION_REINTEGRO";

export interface InventoryMovement {
  IDKardex: number;
  IDVariante: number;
  SKU: string;
  NombreProducto: string;
  NombreVariante: string;
  IDUsuario: number;
  NombreUsuario: string;
  TipoMovimiento: string;
  Cantidad: number;
  ExistenciaAnterior: number;
  ExistenciaNueva: number;
  Motivo: string | null;
  IDReferencia: number | null;
  Fecha: string;
  TotalRegistros?: number;
}

export interface InventoryPageResult<T> {
  datos: T[];
  totalRegistros: number;
  paginaActual: number;
  totalPaginas: number;
}

export interface InventoryAdjustmentInput {
  idVariante: number;
  tipoAjuste: "POSITIVO" | "NEGATIVO";
  cantidad: number;
  motivo: string;
}
