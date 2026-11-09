export interface AdminCategory {
  IDCategoria: number; IDCategoriaPadre: number | null; CategoriaPadre: string | null; Nombre: string;
  Descripcion: string | null; Activo: boolean; TotalProductosActivos: number;
}
export interface AdminProduct {
  IDProducto: number; CodigoPublico: string; IDCategoria: number; Categoria: string; Nombre: string;
  Descripcion: string; Activo: boolean; PrecioMinimo: number | null; PrecioMaximo: number | null;
  TotalStockDisponible: number; TotalVariantes: number; TotalRegistros?: number;
}
export interface AdminProductsPage { datos: AdminProduct[]; totalPaginas: number; totalRegistros: number; paginaActual: number }
export interface AdminCoupon {
  IDCupon: number; Codigo: string; TipoDescuento: "PORCENTAJE" | "MONTO_FIJO"; ValorDescuento: number;
  MontoMinimoCompra: number; LimiteUsosTotal: number; LimiteUsosPorCliente: number; UsosActuales: number;
  IDCategoria: number | null; CategoriaRestringida: string | null; FechaInicio: string; FechaFin: string;
  Activo: boolean; EstadoVigencia: string;
}
export interface AdminUser {
  IDUsuario: number; IDRol: number; Rol: string; Nombre: string; Apellido: string; Correo: string;
  Telefono: string | null; Activo: boolean; FechaCreacion: string;
}
export interface AuditRecord {
  IDBitacora: number; Entidad: string; IDRegistro: string; Accion: string; ValorAnterior: string | null;
  ValorNuevo: string | null; IDUsuario: number | null; NombreUsuario: string; CorreoUsuario: string | null;
  DireccionIP: string | null; Fecha: string; TotalRegistros: number;
}
