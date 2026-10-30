import { executeSP, sql } from "../../database/db";

export interface FiltroPedidosParams {
  estado?: string;
  idUsuario?: number;
  fechaInicio?: string;
  fechaFin?: string;
  busqueda?: string;
  numeroPagina?: number;
  tamanoPagina?: number;
}

export const pedidosRepository = {
  async iniciarReserva(
    idUsuario: number,
    idCarrito: number,
    claveIdempotencia: string,
  ) {
    const result = await executeSP("SP_Checkout_IniciarReserva", [
      { name: "IDUsuario", type: sql.Int, value: idUsuario },
      { name: "IDCarrito", type: sql.Int, value: idCarrito },
      {
        name: "ClaveIdempotencia",
        type: sql.NVarChar(100),
        value: claveIdempotencia,
      },
    ]);
    return result.recordset[0];
  },

  async confirmarPedido(data: {
    idUsuario: number;
    idDireccionEntrega: number;
    idCarrito: number;
    claveIdempotencia: string;
    metodoPago: string;
    idTransaccionPago: string;
    codigoCupon?: string | null;
  }) {
    const result = await executeSP<{
      IDPedido: number;
      CodigoPublico: string;
      NumeroPedido: string;
      Estado: string;
      Subtotal?: number;
      Descuento?: number;
      IVA?: number;
      Total: number;
      MetodoPago?: string;
      FechaCreacion: Date;
      Mensaje: string;
    }>("SP_Checkout_ConfirmarPedido", [
      { name: "IDUsuario", type: sql.Int, value: data.idUsuario },
      {
        name: "IDDireccionEntrega",
        type: sql.Int,
        value: data.idDireccionEntrega,
      },
      { name: "IDCarrito", type: sql.Int, value: data.idCarrito },
      {
        name: "ClaveIdempotencia",
        type: sql.NVarChar(100),
        value: data.claveIdempotencia,
      },
      { name: "MetodoPago", type: sql.NVarChar(50), value: data.metodoPago },
      {
        name: "IDTransaccionPago",
        type: sql.NVarChar(100),
        value: data.idTransaccionPago,
      },
      {
        name: "CodigoCupon",
        type: sql.NVarChar(30),
        value: data.codigoCupon || null,
      },
    ]);
    return result.recordset[0];
  },

  async listarConFiltros(filtros: FiltroPedidosParams) {
    const result = await executeSP("SP_Pedidos_ListarConFiltros", [
      { name: "Estado", type: sql.NVarChar(30), value: filtros.estado || null },
      { name: "IDUsuario", type: sql.Int, value: filtros.idUsuario ?? null },
      {
        name: "FechaInicio",
        type: sql.DateTime2,
        value: filtros.fechaInicio ? new Date(filtros.fechaInicio) : null,
      },
      {
        name: "FechaFin",
        type: sql.DateTime2,
        value: filtros.fechaFin ? new Date(filtros.fechaFin) : null,
      },
      {
        name: "Busqueda",
        type: sql.NVarChar(100),
        value: filtros.busqueda || null,
      },
      { name: "NumeroPagina", type: sql.Int, value: filtros.numeroPagina ?? 1 },
      {
        name: "TamanoPagina",
        type: sql.Int,
        value: filtros.tamanoPagina ?? 20,
      },
    ]);
    return result.recordset;
  },

  async obtenerPorCodigoPublico(
    codigoPublico: string,
    idUsuarioAutenticado: number,
    esOperadorOAdmin: boolean,
  ) {
    const result = await executeSP("SP_Pedidos_ObtenerPorCodigoPublico", [
      {
        name: "CodigoPublico",
        type: sql.UniqueIdentifier,
        value: codigoPublico,
      },
      {
        name: "IDUsuarioAutenticado",
        type: sql.Int,
        value: idUsuarioAutenticado,
      },
      {
        name: "EsOperadorOAdmin",
        type: sql.Bit,
        value: esOperadorOAdmin ? 1 : 0,
      },
    ]);

    const recordsets = result.recordsets as unknown as Array<
      Record<string, unknown>[]
    >;
    const cabecera = recordsets[0]?.[0];
    const detalles = recordsets[1] ?? [];
    const historialEstados = recordsets[2] ?? [];

    return {
      ...cabecera,
      detalles,
      historialEstados,
    };
  },

  async cambiarEstado(
    idPedido: number,
    estadoNuevo: string,
    idUsuarioOperador: number,
    motivo?: string | null,
  ) {
    const result = await executeSP("SP_Pedidos_CambiarEstado", [
      { name: "IDPedido", type: sql.Int, value: idPedido },
      { name: "EstadoNuevo", type: sql.NVarChar(30), value: estadoNuevo },
      { name: "IDUsuarioOperador", type: sql.Int, value: idUsuarioOperador },
      { name: "Motivo", type: sql.NVarChar(255), value: motivo ?? null },
    ]);
    return result.recordset[0];
  },

  async cancelar(idPedido: number, idUsuario: number, motivo: string) {
    const result = await executeSP("SP_Pedidos_Cancelar", [
      { name: "IDPedido", type: sql.Int, value: idPedido },
      { name: "IDUsuario", type: sql.Int, value: idUsuario },
      { name: "Motivo", type: sql.NVarChar(255), value: motivo },
    ]);
    return result.recordset[0];
  },

  async procesarDevolucion(data: {
    idPedido: number;
    idPedidoDetalle: number;
    cantidadADevolver: number;
    idUsuarioOperador: number;
    motivo: string;
  }) {
    const result = await executeSP("SP_Pedidos_ProcesarDevolucion", [
      { name: "IDPedido", type: sql.Int, value: data.idPedido },
      { name: "IDPedidoDetalle", type: sql.Int, value: data.idPedidoDetalle },
      {
        name: "CantidadADevolver",
        type: sql.Int,
        value: data.cantidadADevolver,
      },
      {
        name: "IDUsuarioOperador",
        type: sql.Int,
        value: data.idUsuarioOperador,
      },
      { name: "Motivo", type: sql.NVarChar(255), value: data.motivo },
    ]);
    return result.recordset[0];
  },
};
