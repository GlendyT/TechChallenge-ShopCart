import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../../../test/server";
import { cancelOrder, fetchOrders, updateOrderStatus } from "../ordersApi";

const api = "http://localhost:3000/api";

describe("orders API", () => {
  it("normalizes order filters, pagination metadata and action payloads", async () => {
    const requests: { method: string; search?: string; body?: unknown }[] = [];
    server.use(
      http.get(`${api}/pedidos`, ({ request }) => {
        requests.push({ method: "GET", search: new URL(request.url).search });
        return HttpResponse.json({ ok: true, datos: [], totalRegistros: 0 });
      }),
      http.patch(`${api}/pedidos/:id/estado`, async ({ request }) => {
        requests.push({ method: "PATCH", body: await request.json() });
        return HttpResponse.json({ ok: true, datos: {} });
      }),
      http.post(`${api}/pedidos/:id/cancelar`, async ({ request }) => {
        requests.push({ method: "POST", body: await request.json() });
        return HttpResponse.json({ ok: true, datos: {} });
      }),
    );

    const result = await fetchOrders({ estado: "PAGADO", busqueda: "SC-1", fechaInicio: "2026-11-01", fechaFin: "2026-11-09" }, 3, 20);
    await updateOrderStatus({ idPedido: 12, estadoNuevo: "EN_PREPARACION" });
    await cancelOrder({ idPedido: 12, motivo: "Solicitud del cliente" });

    expect(result).toMatchObject({ totalRegistros: 0, paginaActual: 3, tamanoPagina: 20, totalPaginas: 1 });
    expect(requests[0]?.search).toContain("fechaInicio=2026-11-01T00%3A00%3A00.000");
    expect(requests[0]?.search).toContain("fechaFin=2026-11-09T23%3A59%3A59.999");
    expect(requests[1]).toEqual({ method: "PATCH", body: { estadoNuevo: "EN_PREPARACION" } });
    expect(requests[2]).toEqual({ method: "POST", body: { motivo: "Solicitud del cliente" } });
  });
});
