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
  CodigoPostal?: string | null;
}

export interface AddressInput {
  nombreDestinatario: string;
  telefonoContacto: string;
  direccionLinea1: string;
  direccionLinea2: string | null;
  ciudad: string;
  departamento: string;
  codigoPostal: string | null;
  esPrincipal: boolean;
}

export interface AccountProfile {
  idUsuario: number;
  codigoPublico: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string | null;
  rol: string;
  activo: boolean;
  fechaCreacion: string;
}
