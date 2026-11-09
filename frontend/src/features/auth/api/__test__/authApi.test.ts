import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../../test/server";
import {
  getCurrentUserRequest,
  migrateGuestCartRequest,
  signInRequest,
  signOutRequest,
  signUpRequest,
} from "../authApi";

const api = "http://localhost:3000/api";
const testPassword = "pw";
const profile = {
  idUsuario: 7,
  codigoPublico: "user-code",
  nombre: "Ana",
  apellido: "López",
  correo: "ana@example.com",
  telefono: null,
  rol: "Cliente",
};

describe("authentication API", () => {
  it("signs in with credentials and loads the user from the cookie session", async () => {
    const requests: { method: string; path: string; body: string }[] = [];
    server.use(
      http.post(`${api}/auth/login`, async ({ request }) => {
        requests.push({
          method: request.method,
          path: new URL(request.url).pathname,
          body: await request.text(),
        });
        return HttpResponse.json({ ok: true, datos: { usuario: profile } });
      }),
      http.get(`${api}/auth/me`, async ({ request }) => {
        requests.push({
          method: request.method,
          path: new URL(request.url).pathname,
          body: await request.text(),
        });
        return HttpResponse.json({ ok: true, datos: profile });
      }),
    );

    await expect(
      signInRequest({ correo: "ana@example.com", password: testPassword }),
    ).resolves.toEqual({ usuario: profile });

    expect(requests).toEqual([
      {
        method: "POST",
        path: "/api/auth/login",
        body: JSON.stringify({ correo: "ana@example.com", password: testPassword }),
      },
      { method: "GET", path: "/api/auth/me", body: "" },
    ]);
  });

  it("registers a customer and returns the cookie-backed profile", async () => {
    let registrationBody = "";
    server.use(
      http.post(`${api}/auth/register`, async ({ request }) => {
        registrationBody = await request.text();
        return HttpResponse.json({ ok: true, datos: { usuario: profile } }, { status: 201 });
      }),
      http.get(`${api}/auth/me`, () =>
        HttpResponse.json({ ok: true, datos: profile }),
      ),
    );

    const input = {
      nombre: "Ana",
      apellido: "López",
      correo: "ana@example.com",
      password: testPassword,
      telefono: "55551234",
    };
    await expect(signUpRequest(input)).resolves.toEqual({ usuario: profile });
    expect(registrationBody).toBe(JSON.stringify(input));
  });

  it("reads the current user, logs out without a refresh-token body, and migrates the guest cart", async () => {
    let logoutBody = "not-called";
    let migrationBody = "";
    server.use(
      http.get(`${api}/auth/me`, () =>
        HttpResponse.json({ ok: true, datos: profile }),
      ),
      http.post(`${api}/auth/logout`, async ({ request }) => {
        logoutBody = await request.text();
        return HttpResponse.json({ ok: true });
      }),
      http.post(`${api}/carrito/migrar`, async ({ request }) => {
        migrationBody = await request.text();
        return HttpResponse.json({ ok: true });
      }),
    );

    await expect(getCurrentUserRequest()).resolves.toEqual({ usuario: profile });
    await expect(signOutRequest()).resolves.toBeUndefined();
    await expect(migrateGuestCartRequest("guest-token-123")).resolves.toBeUndefined();

    expect(logoutBody).toBe("");
    expect(migrationBody).toBe(JSON.stringify({ tokenInvitado: "guest-token-123" }));
  });
});
