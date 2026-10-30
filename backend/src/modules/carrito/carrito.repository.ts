import { executeSP, sql } from "../../database/db";

export const carritoRepository = {
  async obtenerOCrear(
    idUsuario?: number | null,
    tokenInvitado?: string | null,
  ) {
    const result = await executeSP("SP_Carrito_ObtenerOCrear", [
      { name: "IDUsuario", type: sql.Int, value: idUsuario ?? null },
      {
        name: "TokenInvitado",
        type: sql.NVarChar(100),
        value: tokenInvitado ?? null,
      },
    ]);

    const recordsets = result.recordsets as unknown as Array<
      Record<string, unknown>[]
    >;
    const cabecera = recordsets[0]?.[0] as
      | {
          IDCarrito: number;
          CodigoPublico: string;
          IDUsuario: number | null;
          TokenInvitado: string | null;
          FechaCreacion: Date;
          FechaUltimaActividad: Date;
          TotalArticulos: number;
          Subtotal: number;
        }
      | undefined;
    const items = recordsets[1] ?? [];

    return {
      ...(cabecera ?? {}),
      items,
    };
  },

  async agregarOActualizarItem(
    idCarrito: number,
    idVariante: number,
    cantidad: number,
  ) {
    const result = await executeSP("SP_Carrito_AgregarOActualizarItem", [
      { name: "IDCarrito", type: sql.Int, value: idCarrito },
      { name: "IDVariante", type: sql.Int, value: idVariante },
      { name: "Cantidad", type: sql.Int, value: cantidad },
    ]);
    return result.recordset?.[0];
  },

  async eliminarItem(idCarrito: number, idVariante: number): Promise<void> {
    await executeSP("SP_Carrito_EliminarItem", [
      { name: "IDCarrito", type: sql.Int, value: idCarrito },
      { name: "IDVariante", type: sql.Int, value: idVariante },
    ]);
  },

  async vaciar(idCarrito: number): Promise<void> {
    await executeSP("SP_Carrito_Vaciar", [
      { name: "IDCarrito", type: sql.Int, value: idCarrito },
    ]);
  },

  async migrarInvitadoAUsuario(
    tokenInvitado: string,
    idUsuario: number,
  ): Promise<void> {
    await executeSP("SP_Carrito_MigrarInvitadoAUsuario", [
      { name: "TokenInvitado", type: sql.NVarChar(100), value: tokenInvitado },
      { name: "IDUsuario", type: sql.Int, value: idUsuario },
    ]);
  },
};
