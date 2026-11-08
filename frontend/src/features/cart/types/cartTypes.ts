export interface CartItem {
  IDCarritoDetalle: number;
  IDVariante: number;
  IDProducto: number;
  CodigoPublicoProducto: string;
  NombreProducto: string;
  SKU: string;
  NombreVariante: string;
  Talla?: string | null;
  Color?: string | null;
  PrecioUnitario: number;
  Cantidad: number;
  SubtotalLinea: number;
  ExistenciaDisponible: number;
  ImagenURL?: string | null;
}

export interface Cart {
  IDCarrito: number;
  TotalArticulos: number;
  Subtotal: number;
  items: CartItem[];
}
