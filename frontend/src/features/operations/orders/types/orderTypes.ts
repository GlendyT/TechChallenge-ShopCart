export type OrderStatus =
  | "PAGADO"
  | "EN_PREPARACION"
  | "DESPACHADO"
  | "ENTREGADO"
  | "CANCELADO"
  | "DEVUELTO_PARCIAL"
  | "DEVUELTO_TOTAL";

export interface OperationsOrder {
  IDPedido: number;
  CodigoPublico: string;
  NumeroPedido: string;
  IDUsuario: number;
  NombreCliente: string;
  CorreoCliente: string;
  Subtotal: number;
  Descuento: number;
  IVA: number;
  Total: number;
  Estado: OrderStatus;
  MetodoPago: string;
  FechaCreacion: string;
  FechaModificacion: string | null;
  TotalRegistros: number;
}

export interface OrderFilters {
  estado: OrderStatus | "";
  fechaInicio: string;
  fechaFin: string;
  busqueda: string;
}

export interface OrdersPageResult {
  datos: OperationsOrder[];
  totalRegistros: number;
  paginaActual: number;
  tamanoPagina: number;
  totalPaginas: number;
}

export interface UpdateOrderStatusInput {
  idPedido: number;
  estadoNuevo: Extract<OrderStatus, "EN_PREPARACION" | "DESPACHADO" | "ENTREGADO">;
}

export interface CancelOrderInput {
  idPedido: number;
  motivo: string;
}

export interface OrderDetailLine {
  IDPedidoDetalle: number;
  IDVariante: number;
  SKUSnapshot: string;
  NombreProductoSnapshot: string;
  NombreVarianteSnapshot: string;
  Cantidad: number;
  PrecioUnitario: number;
  DescuentoUnitario: number;
  Subtotal: number;
  CantidadDevuelta: number;
  CantidadEfectiva: number;
}

export interface OperationsOrderDetail extends Pick<OperationsOrder, "IDPedido" | "CodigoPublico" | "NumeroPedido" | "Estado" | "Total"> {
  detalles: OrderDetailLine[];
}

export interface ReturnOrderInput {
  idPedido: number;
  codigoPublico: string;
  idPedidoDetalle: number;
  cantidadADevolver: number;
  motivo: string;
}
