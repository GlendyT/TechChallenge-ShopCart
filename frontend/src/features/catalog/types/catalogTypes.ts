export interface Category {
  IDCategoria: number;
  Nombre: string;
  Descripcion?: string | null;
  TotalProductos?: number;
}

export interface Product {
  IDProducto: number;
  CodigoPublico: string;
  IDCategoria: number;
  Categoria: string;
  Nombre: string;
  Descripcion: string;
  Activo: boolean;
  PrecioMinimo: number | null;
  PrecioMaximo: number | null;
  TotalStockDisponible: number;
  TotalVariantes: number;
  ImagenPrincipal?: string | null;
  TotalRegistros?: number;
}

export interface ProductVariant {
  IDVariante: number;
  SKU: string;
  Nombre: string;
  Talla?: string | null;
  Color?: string | null;
  Precio: number;
  ExistenciaDisponible: number;
  Activo: boolean;
}

export interface ProductImage {
  IDProductoImagen: number;
  ImagenURL: string;
  EsPrincipal: boolean;
  Orden: number;
}

export interface ProductDetail extends Product {
  variantes: ProductVariant[];
  imagenes: ProductImage[];
}

export type CatalogSortOrder =
  | "RECIENTE"
  | "PRECIO_ASC"
  | "PRECIO_DESC"
  | "NOMBRE_ASC";

export type PriceRange = "all" | "under-200" | "200-400" | "over-400";

export interface CatalogFilters {
  search: string;
  category: string;
  order: CatalogSortOrder;
  page: number;
  inStock: boolean;
  priceRange: PriceRange;
}
