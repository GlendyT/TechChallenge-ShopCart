import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
  createAddress,
  deleteAddress,
  fetchAccountProfile,
  fetchAddresses,
  fetchMyOrders,
  updateAddress,
} from "../accountApi";
import { server } from "../../../../test/server";
import type { AddressInput } from "../../types/accountTypes";

const api = "http://localhost:3000/api";
const addressInput: AddressInput = {
  nombreDestinatario: "Ana López",
  telefonoContacto: "55551234",
  direccionLinea1: "Avenida Central 10",
  direccionLinea2: null,
  ciudad: "Guatemala",
  departamento: "Guatemala",
  codigoPostal: null,
  esPrincipal: true,
};

describe("account API", () => {
  it("loads the authenticated profile and saved addresses", async () => {
    server.use(
      http.get(`${api}/auth/me`, () =>
        HttpResponse.json({
          ok: true,
          datos: { idUsuario: 7, nombre: "Ana", apellido: "López" },
        }),
      ),
      http.get(`${api}/auth/direcciones`, () =>
        HttpResponse.json({ ok: true, datos: [] }),
      ),
    );

    await expect(fetchAccountProfile()).resolves.toMatchObject({
      idUsuario: 7,
      nombre: "Ana",
    });
    await expect(fetchAddresses()).resolves.toEqual([]);
  });

  it("loads the five most recent orders for the account page", async () => {
    let requestedUrl = "";
    server.use(
      http.get(`${api}/pedidos/mis-pedidos`, ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({ ok: true, datos: [] });
      }),
    );

    await expect(fetchMyOrders()).resolves.toEqual([]);
    expect(new URL(requestedUrl).searchParams.get("pagina")).toBe("1");
    expect(new URL(requestedUrl).searchParams.get("limite")).toBe("5");
  });

  it("creates, updates and deletes addresses using the authenticated address routes", async () => {
    const requests: { method: string; path: string; body?: unknown }[] = [];
    server.use(
      http.post(`${api}/auth/direcciones`, async ({ request }) => {
        requests.push({
          method: request.method,
          path: new URL(request.url).pathname,
          body: await request.json(),
        });
        return HttpResponse.json({ ok: true, datos: {} }, { status: 201 });
      }),
      http.put(`${api}/auth/direcciones/:id`, async ({ request }) => {
        requests.push({
          method: request.method,
          path: new URL(request.url).pathname,
          body: await request.json(),
        });
        return HttpResponse.json({ ok: true });
      }),
      http.delete(`${api}/auth/direcciones/:id`, ({ request }) => {
        requests.push({
          method: request.method,
          path: new URL(request.url).pathname,
        });
        return HttpResponse.json({ ok: true });
      }),
    );

    await createAddress(addressInput);
    await updateAddress(23, addressInput);
    await deleteAddress(23);

    expect(requests).toEqual([
      { method: "POST", path: "/api/auth/direcciones", body: addressInput },
      { method: "PUT", path: "/api/auth/direcciones/23", body: addressInput },
      { method: "DELETE", path: "/api/auth/direcciones/23" },
    ]);
  });
});
