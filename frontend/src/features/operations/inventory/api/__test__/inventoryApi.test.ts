import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../../../test/server";
import { fetchInventory, fetchInventoryMovements, fetchInventoryCategories, registerInventoryAdjustment } from "../inventoryApi";

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

  it("sends inventory filters and the adjustment payload", async () => {
    const requests: { path: string; body?: unknown }[] = [];
    server.use(
      http.get(`${api}/inventario/existencias`, ({ request }) => {
        requests.push({ path: new URL(request.url).search });
        return HttpResponse.json({ ok: true, datos: [], totalRegistros: 0 });
      }),
      http.get(`${api}/catalogo/categorias`, () => HttpResponse.json({ ok: true, datos: [{ IDCategoria: 3, Nombre: "Tecnología" }] })),
      http.post(`${api}/inventario/ajuste`, async ({ request }) => {
        requests.push({ path: "/api/inventario/ajuste", body: await request.json() });
        return HttpResponse.json({ ok: true, datos: {} }, { status: 201 });
      }),
    );
    const filters = { busqueda: "teclado", idCategoria: "3", soloBajoStock: true };
    await fetchInventory(filters, 2);
    const categories = await fetchInventoryCategories();
    const adjustment = { idVariante: 8, tipoAjuste: "POSITIVO" as const, cantidad: 4, motivo: "Conteo" };
    await registerInventoryAdjustment(adjustment);

    expect(requests[0]?.path).toContain("busqueda=teclado");
    expect(requests[0]?.path).toContain("soloBajoStock=true");
    expect(categories).toHaveLength(1);
    expect(requests[1]).toEqual({ path: "/api/inventario/ajuste", body: adjustment });
  });
});
