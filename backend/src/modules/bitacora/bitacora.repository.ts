import { executeSP, sql } from "../../database/db";

export type EntidadBitacora =
  | "Productos"
  | "Variantes"
  | "Cupones"
  | "Pedidos"
  | "Inventario"
  | "Usuarios";

export type AccionBitacora =
  | "CREAR"
  | "MODIFICAR"
  | "DESACTIVAR"
  | "CAMBIO_ESTADO";

export interface RegistrarBitacoraParams {
  entidad: EntidadBitacora;
  idRegistro: string | number;
  accion: AccionBitacora;
  valorAnterior?: unknown;
  valorNuevo?: unknown;
  idUsuario?: number | null;
  direccionIP?: string | null;
}

export interface FiltroBitacoraParams {
  entidad?: string;
  accion?: string;
  idUsuario?: number;
  fechaInicio?: string;
  fechaFin?: string;
  numeroPagina?: number;
  tamanoPagina?: number;
}

export const bitacoraRepository = {
  async registrar(params: RegistrarBitacoraParams): Promise<void> {
    await executeSP("SP_Bitacora_Registrar", [
      { name: "Entidad", type: sql.NVarChar(50), value: params.entidad },
      {
        name: "IDRegistro",
        type: sql.NVarChar(100),
        value: String(params.idRegistro),
      },
      { name: "Accion", type: sql.NVarChar(20), value: params.accion },
      {
        name: "ValorAnterior",
        type: sql.NVarChar(sql.MAX),
        value:
          params.valorAnterior !== undefined
            ? JSON.stringify(params.valorAnterior)
            : null,
      },
      {
        name: "ValorNuevo",
        type: sql.NVarChar(sql.MAX),
        value:
          params.valorNuevo !== undefined
            ? JSON.stringify(params.valorNuevo)
            : null,
      },
      { name: "IDUsuario", type: sql.Int, value: params.idUsuario ?? null },
      {
        name: "DireccionIP",
        type: sql.NVarChar(50),
        value: params.direccionIP ?? null,
      },
    ]);
  },

  async consultar(filtros: FiltroBitacoraParams) {
    const result = await executeSP("SP_Bitacora_Consultar", [
      {
        name: "Entidad",
        type: sql.NVarChar(50),
        value: filtros.entidad || null,
      },
      { name: "Accion", type: sql.NVarChar(20), value: filtros.accion || null },
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
      { name: "NumeroPagina", type: sql.Int, value: filtros.numeroPagina ?? 1 },
      {
        name: "TamanoPagina",
        type: sql.Int,
        value: filtros.tamanoPagina ?? 25,
      },
    ]);

    return result.recordset;
  },
};
