import { executeSP, sql } from "../../database/db";

export const reportesRepository = {
  async ventasPeriodo(
    fechaInicio: string,
    fechaFin: string,
    agrupacion: "DIA" | "SEMANA" | "MES" = "DIA",
  ) {
    const result = await executeSP("SP_Reportes_VentasPeriodo", [
      { name: "FechaInicio", type: sql.Date, value: new Date(fechaInicio) },
      { name: "FechaFin", type: sql.Date, value: new Date(fechaFin) },
      { name: "Agrupacion", type: sql.NVarChar(10), value: agrupacion },
    ]);
    return result.recordset;
  },

  async top10ProductosMasVendidos(fechaInicio?: string, fechaFin?: string) {
    const result = await executeSP("SP_Reportes_Top10ProductosMasVendidos", [
      {
        name: "FechaInicio",
        type: sql.DateTime2,
        value: fechaInicio ? new Date(fechaInicio) : null,
      },
      {
        name: "FechaFin",
        type: sql.DateTime2,
        value: fechaFin ? new Date(fechaFin) : null,
      },
    ]);
    return result.recordset;
  },

  async ventasPorCategoria(fechaInicio?: string, fechaFin?: string) {
    const result = await executeSP("SP_Reportes_VentasPorCategoria", [
      {
        name: "FechaInicio",
        type: sql.DateTime2,
        value: fechaInicio ? new Date(fechaInicio) : null,
      },
      {
        name: "FechaFin",
        type: sql.DateTime2,
        value: fechaFin ? new Date(fechaFin) : null,
      },
    ]);
    return result.recordset;
  },

  async carritosAbandonados(minutosInactividad = 1440) {
    const result = await executeSP("SP_Reportes_CarritosAbandonados", [
      { name: "MinutosInactividad", type: sql.Int, value: minutosInactividad },
    ]);
    return result.recordset;
  },
};
