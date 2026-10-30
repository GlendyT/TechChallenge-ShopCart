import { executeSP, sql } from "../../database/db";

export interface FiltroKardexParams {
  idVariante?: number;
  tipoMovimiento?: string;
  fechaInicio?: string;
  fechaFin?: string;
  numeroPagina?: number;
  tamanoPagina?: number;
}

export interface FiltroExistenciasParams {
  busqueda?: string;
  idCategoria?: number;
  soloBajoStock?: boolean;
  numeroPagina?: number;
  tamanoPagina?: number;
}

export const inventarioRepository = {
  async registrarAjusteManual(data: {
    idVariante: number;
    idUsuario: number;
    tipoAjuste: "POSITIVO" | "NEGATIVO";
    cantidad: number;
    motivo: string;
  }) {
    const result = await executeSP<{
      IDKardex: number;
      IDVariante: number;
      TipoMovimiento: string;
      Cantidad: number;
      ExistenciaAnterior: number;
      ExistenciaNueva: number;
      Motivo: string;
      Fecha: Date;
    }>("SP_Inventario_RegistrarAjusteManual", [
      { name: "IDVariante", type: sql.Int, value: data.idVariante },
      { name: "IDUsuario", type: sql.Int, value: data.idUsuario },
      { name: "TipoAjuste", type: sql.NVarChar(20), value: data.tipoAjuste },
      { name: "Cantidad", type: sql.Int, value: data.cantidad },
      { name: "Motivo", type: sql.NVarChar(255), value: data.motivo },
    ]);
    return result.recordset[0];
  },

  async consultarKardex(filtros: FiltroKardexParams) {
    const result = await executeSP("SP_Inventario_ConsultarKardex", [
      { name: "IDVariante", type: sql.Int, value: filtros.idVariante ?? null },
      {
        name: "TipoMovimiento",
        type: sql.NVarChar(30),
        value: filtros.tipoMovimiento || null,
      },
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
      { name: "NumeroPagina", type: sql.Int, value: filtros.numeroPagina ?? 1 },
      {
        name: "TamanoPagina",
        type: sql.Int,
        value: filtros.tamanoPagina ?? 20,
      },
    ]);
    return result.recordset;
  },

  async listarExistencias(filtros: FiltroExistenciasParams) {
    const result = await executeSP("SP_Inventario_ListarExistencias", [
      {
        name: "Busqueda",
        type: sql.NVarChar(100),
        value: filtros.busqueda || null,
      },
      {
        name: "IDCategoria",
        type: sql.Int,
        value: filtros.idCategoria ?? null,
      },
      {
        name: "SoloBajoStock",
        type: sql.Bit,
        value: filtros.soloBajoStock ? 1 : 0,
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
};
