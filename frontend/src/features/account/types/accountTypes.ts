export interface OrderSummary {
  CodigoPublico: string;
  NumeroPedido: string;
  Estado: string;
  Total: number;
  FechaCreacion: string;
}

export interface Address {
  IDDireccion: number;
  NombreDestinatario: string;
  TelefonoContacto?: string;
  DireccionLinea1: string;
  DireccionLinea2?: string | null;
  Ciudad: string;
  Departamento: string;
  EsPrincipal: boolean;
}
