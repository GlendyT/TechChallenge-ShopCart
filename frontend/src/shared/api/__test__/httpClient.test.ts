import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "../../../test/server";
import { ApiError } from "../apiError";
import {
  apiRequest,
  apiUrl,
  clearGuestToken,
  getGuestToken,
  getSession,
  getSessionEventName,
  getStoredGuestToken,
  setSession,
} from "../httpClient";

const api = "http://localhost:3000/api";

afterEach(() => {
  setSession(null);
  clearGuestToken();
  vi.restoreAllMocks();
});

describe("HTTP client", () => {
  it("includes cookies, JSON headers and guest-cart identity in requests", async () => {
    let credentials: RequestCredentials | undefined;
    const originalFetch = globalThis.fetch;
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      credentials = init?.credentials;
      return originalFetch(input, init);
    });
    let requestInfo: { contentType: string | null; guestToken: string | null; body: unknown } | undefined;
    server.use(http.post(`${api}/carrito/items`, async ({ request }) => {
      requestInfo = {
        contentType: request.headers.get("content-type"),
        guestToken: request.headers.get("x-guest-token"),
        body: await request.json(),
      };
      return HttpResponse.json({ ok: true, datos: { agregado: true } });
    }));

    const result = await apiRequest<{ agregado: boolean }>("/carrito/items", {
      method: "POST", body: JSON.stringify({ idVariante: 7 }), guestToken: "guest-abc",
    });

    expect(result.datos).toEqual({ agregado: true });
    expect(credentials).toBe("include");
    expect(requestInfo).toEqual({
      contentType: "application/json", guestToken: "guest-abc",
      body: { idVariante: 7 },
    });
  });

  it("converts backend validation responses into ApiError", async () => {
    server.use(http.post(`${api}/catalogo/variantes`, () => HttpResponse.json({
      ok: false, mensaje: "Error de validación", errores: [{ campo: "sku", mensaje: "Required" }],
    }, { status: 400 })));

    await expect(apiRequest("/catalogo/variantes", { method: "POST", body: "{}" }))
      .rejects.toMatchObject({ name: "ApiError", status: 400, fields: [{ campo: "sku", mensaje: "Required" }] });
  });

  it("refreshes the cookie session once and retries a protected request", async () => {
    let protectedRequests = 0;
    let refreshRequests = 0;
    server.use(
      http.get(`${api}/cuenta/perfil`, () => {
        protectedRequests += 1;
        return protectedRequests === 1
          ? HttpResponse.json({ ok: false, mensaje: "No autenticado" }, { status: 401 })
          : HttpResponse.json({ ok: true, datos: { correo: "ana@example.com" } });
      }),
      http.post(`${api}/auth/refresh`, () => {
        refreshRequests += 1;
        return HttpResponse.json({ ok: true });
      }),
    );

    await expect(apiRequest<{ correo: string }>("/cuenta/perfil"))
      .resolves.toMatchObject({ datos: { correo: "ana@example.com" } });
    expect(refreshRequests).toBe(1);
    expect(protectedRequests).toBe(2);
  });

  it("does not refresh authentication endpoints and clears session on failed refresh", async () => {
    let refreshRequests = 0;
    server.use(
      http.post(`${api}/auth/login`, () => HttpResponse.json({ ok: false, mensaje: "Credenciales inválidas" }, { status: 401 })),
      http.get(`${api}/cuenta/perfil`, () => HttpResponse.json({ ok: false, mensaje: "No autenticado" }, { status: 401 })),
      http.post(`${api}/auth/refresh`, () => {
        refreshRequests += 1;
        return HttpResponse.json({ ok: false }, { status: 401 });
      }),
    );
    setSession({ usuario: { idUsuario: 4, codigoPublico: "user-4", nombre: "Ana", apellido: "López", correo: "ana@example.com", rol: "Cliente" } });

    await expect(apiRequest("/auth/login", { method: "POST", body: "{}" })).rejects.toBeInstanceOf(ApiError);
    expect(refreshRequests).toBe(0);
    await expect(apiRequest("/cuenta/perfil")).rejects.toBeInstanceOf(ApiError);
    expect(refreshRequests).toBe(1);
    expect(getSession()).toBeNull();
  });

  it("publishes session changes and stores a reusable guest token", () => {
    const listener = vi.fn();
    const eventName = getSessionEventName();
    window.addEventListener(eventName, listener);
    const session = { usuario: { idUsuario: 5, codigoPublico: "user-5", nombre: "Eva", apellido: "Sol", correo: "eva@example.com", rol: "Cliente" as const } };
    setSession(session);
    window.removeEventListener(eventName, listener);

    vi.spyOn(crypto, "randomUUID").mockReturnValue("00000000-0000-4000-8000-000000000123");
    expect(listener).toHaveBeenCalledOnce();
    expect(getSession()).toEqual(session);
    expect(getGuestToken()).toBe("00000000-0000-4000-8000-000000000123");
    expect(getGuestToken()).toBe("00000000-0000-4000-8000-000000000123");
    expect(getStoredGuestToken()).toBe("00000000-0000-4000-8000-000000000123");
    expect(apiUrl("/productos")).toBe(`${api}/productos`);
  });
});
