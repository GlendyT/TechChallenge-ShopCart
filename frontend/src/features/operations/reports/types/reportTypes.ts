export type ReportGrouping = "DIA" | "SEMANA" | "MES";

export interface ReportFilters {
  fechaInicio: string;
  fechaFin: string;
  agrupacion: ReportGrouping;
  minutosInactividad: number;
}

export interface SalesPeriodRow {
  Periodo: string;
  TotalPedidos: number;
  TotalVentasNetas: number;
  TicketPromedio: number;
}

export interface TopProductRow {
  IDProducto: number;
  CodigoPublicoProducto: string;
  NombreProducto: string;
  Categoria: string;
  UnidadesNetasVendidas: number;
  IngresoNetoTotal: number;
  ImagenURL: string | null;
}

export interface CategorySalesRow {
  IDCategoria: number;
  Categoria: string;
  CantidadPedidos: number;
  UnidadesNetasVendidas: number;
  MontoNetoVendido: number;
  PorcentajeParticipacion: number;
}

export interface AbandonedCartRow {
  IDCarrito: number;
  CodigoPublico: string;
  IDUsuario: number | null;
  NombreCliente: string;
  CorreoCliente: string;
  FechaCreacion: string;
  FechaUltimaActividad: string;
  MinutosInactivo: number;
  TotalLineas: number;
  TotalUnidades: number;
  ValorEstimadoCarrito: number;
}

export interface ReportsData {
  ventasPeriodo: SalesPeriodRow[];
  topProductos: TopProductRow[];
  ventasCategoria: CategorySalesRow[];
  carritosAbandonados: AbandonedCartRow[];
}
