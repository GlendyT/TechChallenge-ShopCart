import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { fetchOrderDetail, returnOrderItem } from "../ordersApi";
import { server } from "../../../../../test/server";

const api = "http://localhost:3000/api";

describe("order return API", () => {
  it("loads order lines and registers a partial return with the backend contract", async () => {
    const requests: { method: string; path: string; body?: unknown }[] = [];
    server.use(
      http.get(`${api}/pedidos/:codigo`, ({ params }) => {
        requests.push({ method: "GET", path: `/api/pedidos/${params.codigo}` });
        return HttpResponse.json({ ok: true, datos: { IDPedido: 9, CodigoPublico: String(params.codigo), NumeroPedido: "SC-009", Estado: "ENTREGADO", Total: 125, detalles: [{ IDPedidoDetalle: 77, IDVariante: 2, SKUSnapshot: "SKU-2", NombreProductoSnapshot: "Camisa", NombreVarianteSnapshot: "Azul", Cantidad: 2, PrecioUnitario: 62.5, DescuentoUnitario: 0, Subtotal: 125, CantidadDevuelta: 0, CantidadEfectiva: 2 }] } });
      }),
      http.post(`${api}/pedidos/:id/devoluciones`, async ({ request }) => {
        requests.push({ method: "POST", path: new URL(request.url).pathname, body: await request.json() });
        return HttpResponse.json({ ok: true, datos: { IDDevolucion: 4, EstadoPedido: "DEVUELTO_PARCIAL" } }, { status: 201 });
      }),
    );

    const detail = await fetchOrderDetail("public-order-code");
    await returnOrderItem({ idPedido: 9, codigoPublico: "public-order-code", idPedidoDetalle: 77, cantidadADevolver: 1, motivo: "Producto defectuoso" });

    expect(detail.detalles[0]?.CantidadEfectiva).toBe(2);
    expect(requests).toEqual([
      { method: "GET", path: "/api/pedidos/public-order-code" },
      { method: "POST", path: "/api/pedidos/9/devoluciones", body: { idPedidoDetalle: 77, cantidadADevolver: 1, motivo: "Producto defectuoso" } },
    ]);
  });
});
