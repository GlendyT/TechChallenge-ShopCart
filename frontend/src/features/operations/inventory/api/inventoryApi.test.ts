import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../../test/server";
import { fetchInventory, fetchInventoryMovements } from "./inventoryApi";

const api = "http://localhost:3000/api";

describe("inventory pagination API", () => {
  it("sends the selected page size for stock and movement requests", async () => {
    const limits: string[] = [];
    server.use(
      http.get(`${api}/inventario/existencias`, ({ request }) => {
        limits.push(new URL(request.url).searchParams.get("limite") ?? "");
        return HttpResponse.json({ ok: true, datos: [], totalRegistros: 0 });
      }),
      http.get(`${api}/inventario/kardex`, ({ request }) => {
        limits.push(new URL(request.url).searchParams.get("limite") ?? "");
        return HttpResponse.json({ ok: true, datos: [], totalRegistros: 0 });
      }),
    );

    await fetchInventory(
      { busqueda: "", idCategoria: "", soloBajoStock: false },
      2,
      50,
    );
    await fetchInventoryMovements(
      7,
      1,
      { tipoMovimiento: "", fechaInicio: "", fechaFin: "" },
      30,
    );

    expect(limits).toEqual(["50", "30"]);
  });
});
