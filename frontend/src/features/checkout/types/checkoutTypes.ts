export interface CreatedOrder {
  CodigoPublico: string;
  NumeroPedido: string;
  Total: number;
}

export interface ConfirmCheckoutInput {
  idDireccionEntrega: number;
  claveIdempotencia: string;
  metodoPago: "TARJETA_CREDITO";
  codigoCupon: string | null;
  simularResultadoPago: "APROBADO";
}
