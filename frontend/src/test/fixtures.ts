import type { Cart, Category, Product, ProductDetail } from '../catalog/types'

export const productCode = 'e025b2fb-0987-40ad-b0ce-9010dc8ccf2e'

export const categories: Category[] = [
  { IDCategoria: 1, Nombre: 'Caballeros', TotalProductos: 1 },
]

export const products: Product[] = [
  {
    IDProducto: 1,
    CodigoPublico: productCode,
    IDCategoria: 1,
    Categoria: 'Caballeros',
    Nombre: 'Camisa Oxford Slim Fit',
    Descripcion: 'Una camisa de algodón para cada ocasión.',
    Activo: true,
    PrecioMinimo: 249,
    PrecioMaximo: 249,
    TotalStockDisponible: 25,
    TotalVariantes: 1,
    ImagenPrincipal: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600',
    TotalRegistros: 1,
  },
]

export const productDetail: ProductDetail = {
  ...products[0]!,
  variantes: [{
    IDVariante: 11,
    SKU: 'CAM-OXF-AZU-M',
    Nombre: 'Azul / Talla M',
    Talla: 'M',
    Color: 'Azul',
    Precio: 249,
    ExistenciaDisponible: 25,
    Activo: true,
  }],
  imagenes: [{
    IDProductoImagen: 1,
    ImagenURL: products[0]!.ImagenPrincipal!,
    EsPrincipal: true,
    Orden: 1,
  }],
}

export const emptyCart: Cart = {
  IDCarrito: 1,
  TotalArticulos: 0,
  Subtotal: 0,
  items: [],
}

export const filledCart: Cart = {
  IDCarrito: 1,
  TotalArticulos: 1,
  Subtotal: 249,
  items: [{
    IDCarritoDetalle: 1,
    IDVariante: 11,
    IDProducto: 1,
    CodigoPublicoProducto: productCode,
    NombreProducto: 'Camisa Oxford Slim Fit',
    SKU: 'CAM-OXF-AZU-M',
    NombreVariante: 'Azul / Talla M',
    Talla: 'M',
    Color: 'Azul',
    PrecioUnitario: 249,
    Cantidad: 1,
    SubtotalLinea: 249,
    ExistenciaDisponible: 25,
    ImagenURL: products[0]!.ImagenPrincipal,
  }],
}
