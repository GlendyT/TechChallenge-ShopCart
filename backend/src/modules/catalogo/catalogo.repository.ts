import { executeSP, sql } from "../../database/db";

export interface FiltroProductosParams {
  busqueda?: string;
  idCategoria?: number;
  precioMin?: number;
  precioMax?: number;
  soloConStock?: boolean;
  soloActivos?: boolean;
  orden?: string;
  numeroPagina?: number;
  tamanoPagina?: number;
}

interface ProductoData {
  idCategoria: number;
  nombre: string;
  descripcion: string;
}

interface ImagenProductoData {
  imagenUrl: string;
  esPrincipal?: boolean;
  orden?: number;
}

type ProductoImagenRecord = Record<string, unknown>;

export const catalogoRepository = {
  async listarCategorias(soloActivas = true) {
    const result = await executeSP("SP_Categorias_Listar", [
      { name: "SoloActivas", type: sql.Bit, value: soloActivas ? 1 : 0 },
    ]);
    return result.recordset;
  },

  async crearCategoria(data: {
    nombre: string;
    descripcion?: string | null;
    idCategoriaPadre?: number | null;
  }) {
    const result = await executeSP("SP_Categorias_Crear", [
      { name: "Nombre", type: sql.NVarChar(100), value: data.nombre },
      {
        name: "Descripcion",
        type: sql.NVarChar(255),
        value: data.descripcion ?? null,
      },
      {
        name: "IDCategoriaPadre",
        type: sql.Int,
        value: data.idCategoriaPadre ?? null,
      },
    ]);
    return result.recordset[0];
  },

  async actualizarCategoria(
    idCategoria: number,
    data: {
      nombre: string;
      descripcion?: string | null;
      idCategoriaPadre?: number | null;
      activo?: boolean;
    },
  ): Promise<void> {
    await executeSP("SP_Categorias_Actualizar", [
      { name: "IDCategoria", type: sql.Int, value: idCategoria },
      { name: "Nombre", type: sql.NVarChar(100), value: data.nombre },
      {
        name: "Descripcion",
        type: sql.NVarChar(255),
        value: data.descripcion ?? null,
      },
      {
        name: "IDCategoriaPadre",
        type: sql.Int,
        value: data.idCategoriaPadre ?? null,
      },
      { name: "Activo", type: sql.Bit, value: data.activo !== false ? 1 : 0 },
    ]);
  },

  async cambiarEstadoCategoria(
    idCategoria: number,
    activo: boolean,
  ): Promise<void> {
    await executeSP("SP_Categorias_Desactivar", [
      { name: "IDCategoria", type: sql.Int, value: idCategoria },
      { name: "Activo", type: sql.Bit, value: activo ? 1 : 0 },
    ]);
  },

  async listarProductosPaginado(filtros: FiltroProductosParams) {
    const result = await executeSP("SP_Productos_ListarPaginado", [
      {
        name: "Busqueda",
        type: sql.NVarChar(150),
        value: filtros.busqueda || null,
      },
      {
        name: "IDCategoria",
        type: sql.Int,
        value: filtros.idCategoria ?? null,
      },
      {
        name: "PrecioMin",
        type: sql.Decimal(12, 2),
        value: filtros.precioMin ?? null,
      },
      {
        name: "PrecioMax",
        type: sql.Decimal(12, 2),
        value: filtros.precioMax ?? null,
      },
      {
        name: "SoloConStock",
        type: sql.Bit,
        value: filtros.soloConStock ? 1 : 0,
      },
      {
        name: "SoloActivos",
        type: sql.Bit,
        value: filtros.soloActivos !== false ? 1 : 0,
      },
      {
        name: "Orden",
        type: sql.NVarChar(20),
        value: filtros.orden || "RECIENTE",
      },
      { name: "NumeroPagina", type: sql.Int, value: filtros.numeroPagina ?? 1 },
      {
        name: "TamanoPagina",
        type: sql.Int,
        value: filtros.tamanoPagina ?? 12,
      },
    ]);
    return result.recordset;
  },

  async obtenerProductoPorCodigoPublico(codigoPublico: string) {
    const result = await executeSP("SP_Productos_ObtenerPorCodigoPublico", [
      {
        name: "CodigoPublico",
        type: sql.UniqueIdentifier,
        value: codigoPublico,
      },
    ]);

    const recordsets = result.recordsets as unknown as Array<
      Record<string, unknown>[]
    >;
    const cabecera = recordsets[0]?.[0];
    const variantes = recordsets[1] ?? [];
    const imagenes = recordsets[2] ?? [];

    return {
      ...cabecera,
      variantes,
      imagenes,
    };
  },

  async crearProducto(data: {
    idCategoria: number;
    nombre: string;
    descripcion: string;
  }) {
    const result = await executeSP<{
      IDProducto: number;
      CodigoPublico: string;
      IDCategoria: number;
      Nombre: string;
      Descripcion: string;
      Activo: boolean;
      FechaCreacion: Date;
    }>("SP_Productos_Crear", [
      { name: "IDCategoria", type: sql.Int, value: data.idCategoria },
      { name: "Nombre", type: sql.NVarChar(150), value: data.nombre },
      {
        name: "Descripcion",
        type: sql.NVarChar(sql.MAX),
        value: data.descripcion,
      },
    ]);
    return result.recordset[0];
  },

  async actualizarProducto(idProducto: number, data: ProductoData) {
    const result = await executeSP("SP_Productos_Actualizar", [
      { name: "IDProducto", type: sql.Int, value: idProducto },
      { name: "IDCategoria", type: sql.Int, value: data.idCategoria },
      { name: "Nombre", type: sql.NVarChar(150), value: data.nombre },
      {
        name: "Descripcion",
        type: sql.NVarChar(sql.MAX),
        value: data.descripcion,
      },
    ]);
    const recordsets = result.recordsets as unknown as ProductoImagenRecord[][];
    return {
      anterior: recordsets[0]?.[0],
      nuevo: recordsets[1]?.[0],
    };
  },

  async agregarImagenProducto(idProducto: number, data: ImagenProductoData) {
    const result = await executeSP("SP_ProductoImagenes_Crear", [
      { name: "IDProducto", type: sql.Int, value: idProducto },
      { name: "ImagenURL", type: sql.NVarChar(500), value: data.imagenUrl },
      {
        name: "EsPrincipal",
        type: sql.Bit,
        value: data.esPrincipal ?? null,
      },
      { name: "Orden", type: sql.Int, value: data.orden ?? null },
    ]);
    return result.recordset[0];
  },

  async actualizarImagenProducto(
    idProducto: number,
    idImagen: number,
    data: ImagenProductoData,
  ) {
    const result = await executeSP("SP_ProductoImagenes_Actualizar", [
      { name: "IDProducto", type: sql.Int, value: idProducto },
      { name: "IDProductoImagen", type: sql.Int, value: idImagen },
      { name: "ImagenURL", type: sql.NVarChar(500), value: data.imagenUrl },
      {
        name: "EsPrincipal",
        type: sql.Bit,
        value: data.esPrincipal ?? null,
      },
      { name: "Orden", type: sql.Int, value: data.orden ?? null },
    ]);
    const recordsets = result.recordsets as unknown as ProductoImagenRecord[][];
    return {
      anterior: recordsets[0]?.[0],
      nuevo: recordsets[1]?.[0],
    };
  },

  async eliminarImagenProducto(idProducto: number, idImagen: number) {
    const result = await executeSP("SP_ProductoImagenes_Eliminar", [
      { name: "IDProducto", type: sql.Int, value: idProducto },
      { name: "IDProductoImagen", type: sql.Int, value: idImagen },
    ]);
    return result.recordset[0];
  },

  async cambiarEstadoProducto(
    idProducto: number,
    activo: boolean,
  ): Promise<void> {
    await executeSP("SP_Productos_Desactivar", [
      { name: "IDProducto", type: sql.Int, value: idProducto },
      { name: "Activo", type: sql.Bit, value: activo ? 1 : 0 },
    ]);
  },

  async crearVariante(data: {
    idProducto: number;
    sku: string;
    nombre: string;
    talla?: string | null;
    color?: string | null;
    precio: number;
    existenciaFisicaInicial: number;
    idUsuarioOperador: number;
  }) {
    const result = await executeSP<{
      IDVariante: number;
      IDProducto: number;
      SKU: string;
      Nombre: string;
      Talla: string | null;
      Color: string | null;
      Precio: number;
      ExistenciaFisica: number;
      Activo: boolean;
      FechaCreacion: Date;
    }>("SP_Variantes_Crear", [
      { name: "IDProducto", type: sql.Int, value: data.idProducto },
      { name: "SKU", type: sql.NVarChar(50), value: data.sku },
      { name: "Nombre", type: sql.NVarChar(100), value: data.nombre },
      { name: "Talla", type: sql.NVarChar(20), value: data.talla ?? null },
      { name: "Color", type: sql.NVarChar(30), value: data.color ?? null },
      { name: "Precio", type: sql.Decimal(12, 2), value: data.precio },
      {
        name: "ExistenciaFisicaInicial",
        type: sql.Int,
        value: data.existenciaFisicaInicial,
      },
      {
        name: "IDUsuarioOperador",
        type: sql.Int,
        value: data.idUsuarioOperador,
      },
    ]);
    return result.recordset[0];
  },
};
