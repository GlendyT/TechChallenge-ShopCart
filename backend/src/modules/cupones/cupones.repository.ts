import { executeSP, sql } from "../../database/db";

export const cuponesRepository = {
  async listar(soloActivos = false) {
    const result = await executeSP("SP_Cupones_Listar", [
      { name: "SoloActivos", type: sql.Bit, value: soloActivos ? 1 : 0 },
    ]);
    return result.recordset;
  },

  async crear(data: {
    codigo: string;
    tipoDescuento: "PORCENTAJE" | "MONTO_FIJO";
    valorDescuento: number;
    montoMinimoCompra: number;
    limiteUsosTotal: number;
    limiteUsosPorCliente: number;
    idCategoria?: number | null;
    fechaInicio: string;
    fechaFin: string;
  }) {
    const result = await executeSP<{
      IDCupon: number;
      Codigo: string;
      TipoDescuento: string;
      ValorDescuento: number;
      MontoMinimoCompra: number;
      LimiteUsosTotal: number;
      LimiteUsosPorCliente: number;
      Activo: boolean;
      FechaCreacion: Date;
    }>("SP_Cupones_Crear", [
      { name: "Codigo", type: sql.NVarChar(30), value: data.codigo },
      {
        name: "TipoDescuento",
        type: sql.NVarChar(20),
        value: data.tipoDescuento,
      },
      {
        name: "ValorDescuento",
        type: sql.Decimal(12, 2),
        value: data.valorDescuento,
      },
      {
        name: "MontoMinimoCompra",
        type: sql.Decimal(12, 2),
        value: data.montoMinimoCompra,
      },
      { name: "LimiteUsosTotal", type: sql.Int, value: data.limiteUsosTotal },
      {
        name: "LimiteUsosPorCliente",
        type: sql.Int,
        value: data.limiteUsosPorCliente,
      },
      { name: "IDCategoria", type: sql.Int, value: data.idCategoria ?? null },
      {
        name: "FechaInicio",
        type: sql.DateTime2,
        value: new Date(data.fechaInicio),
      },
      { name: "FechaFin", type: sql.DateTime2, value: new Date(data.fechaFin) },
    ]);
    return result.recordset[0];
  },

  async cambiarEstado(idCupon: number, activo: boolean): Promise<void> {
    await executeSP("SP_Cupones_Desactivar", [
      { name: "IDCupon", type: sql.Int, value: idCupon },
      { name: "Activo", type: sql.Bit, value: activo ? 1 : 0 },
    ]);
  },

  async validarYAplicar(codigo: string, idUsuario: number, idCarrito: number) {
    const result = await executeSP("SP_Cupones_ValidarYAplicar", [
      { name: "Codigo", type: sql.NVarChar(30), value: codigo },
      { name: "IDUsuario", type: sql.Int, value: idUsuario },
      { name: "IDCarrito", type: sql.Int, value: idCarrito },
    ]);
    return result.recordset[0];
  },
};
