export interface Category {
  IDCategoria: number
  Nombre: string
  Descripcion?: string | null
  TotalProductos?: number
}

export interface Product {
  IDProducto: number
  CodigoPublico: string
  IDCategoria: number
  Categoria: string
  Nombre: string
  Descripcion: string
  Activo: boolean
  PrecioMinimo: number | null
  PrecioMaximo: number | null
  TotalStockDisponible: number
  TotalVariantes: number
  ImagenPrincipal?: string | null
  TotalRegistros?: number
}

export interface ProductVariant {
  IDVariante: number
  SKU: string
  Nombre: string
  Talla?: string | null
  Color?: string | null
  Precio: number
  ExistenciaDisponible: number
  Activo: boolean
}

export interface ProductImage {
  IDProductoImagen: number
  ImagenURL: string
  EsPrincipal: boolean
  Orden: number
}

export interface ProductDetail extends Product {
  variantes: ProductVariant[]
  imagenes: ProductImage[]
}

export interface CartItem {
  IDCarritoDetalle: number
  IDVariante: number
  IDProducto: number
  CodigoPublicoProducto: string
  NombreProducto: string
  SKU: string
  NombreVariante: string
  Talla?: string | null
  Color?: string | null
  PrecioUnitario: number
  Cantidad: number
  SubtotalLinea: number
  ExistenciaDisponible: number
  ImagenURL?: string | null
}

export interface Cart {
  IDCarrito: number
  TotalArticulos: number
  Subtotal: number
  items: CartItem[]
}
