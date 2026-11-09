import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../../test/server";
import {
  fetchOrder,
  submitCheckout,
  validateCoupon,
} from "../checkoutApi";
import type { ConfirmCheckoutInput } from "../../types/checkoutTypes";

const api = "http://localhost:3000/api";
const createdOrder = {
  CodigoPublico: "order-public-code",
  NumeroPedido: "DA-2026-0001",
  Total: 498,
};

describe("checkout API", () => {
  it("validates a coupon by sending its code", async () => {
    let body: unknown;
    server.use(
      http.post(`${api}/cupones/validar`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          ok: true,
          mensaje: "Cupón válido.",
          datos: { MontoDescuento: 50 },
        });
      }),
    );

    await expect(validateCoupon("VERANO15")).resolves.toMatchObject({
      mensaje: "Cupón válido.",
      datos: { MontoDescuento: 50 },
    });
    expect(body).toEqual({ codigo: "VERANO15" });
  });

  it("reserves the checkout before confirming the order with the same idempotency key", async () => {
    const requests: { path: string; body: unknown }[] = [];
    server.use(
      http.post(`${api}/pedidos/checkout/reserva`, async ({ request }) => {
        requests.push({
          path: new URL(request.url).pathname,
          body: await request.json(),
        });
        return HttpResponse.json({ ok: true, datos: {} });
      }),
      http.post(`${api}/pedidos/checkout/confirmar`, async ({ request }) => {
        requests.push({
          path: new URL(request.url).pathname,
          body: await request.json(),
        });
        return HttpResponse.json({ ok: true, datos: createdOrder }, { status: 201 });
      }),
    );
    const input: ConfirmCheckoutInput = {
      idDireccionEntrega: 17,
      claveIdempotencia: "checkout-idempotency-key",
      metodoPago: "TARJETA_CREDITO",
      codigoCupon: "VERANO15",
      simularResultadoPago: "APROBADO",
    };

    await expect(submitCheckout(input)).resolves.toEqual(createdOrder);
    expect(requests).toEqual([
      {
        path: "/api/pedidos/checkout/reserva",
        body: { claveIdempotencia: input.claveIdempotencia },
      },
      { path: "/api/pedidos/checkout/confirmar", body: input },
    ]);
  });

  it("loads a confirmed order by its public code", async () => {
    let requestedPath = "";
    server.use(
      http.get(`${api}/pedidos/:publicCode`, ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ ok: true, datos: createdOrder });
      }),
    );

    await expect(fetchOrder(createdOrder.CodigoPublico)).resolves.toEqual(createdOrder);
    expect(requestedPath).toBe(`/api/pedidos/${createdOrder.CodigoPublico}`);
  });
});
