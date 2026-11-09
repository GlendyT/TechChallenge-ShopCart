import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { server } from "../../test/server";
import { getSession, setSession } from "../api/httpClient";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./useAuth";

const api = "http://localhost:3000/api";

function RoleLoginHarness() {
  const { signIn, user } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");

  return (
    <>
      <button
        type="button"
        onClick={() => {
          void signIn(
            { correo: "operator@example.com", password: "password" },
            "Administrador",
          ).catch((error: Error) => setErrorMessage(error.message));
        }}
      >
        Ingresar como administrador
      </button>
      <p role="alert">{errorMessage}</p>
      <p data-testid="authenticated-role">{user?.rol ?? "sin sesión"}</p>
    </>
  );
}

function RestoredSessionHarness() {
  const { user, isLoading } = useAuth();

  return (
    <p data-testid="restored-user">
      {isLoading ? "cargando" : user?.correo ?? "sin sesión"}
    </p>
  );
}

describe("AuthProvider portal role validation", () => {
  beforeEach(() => {
    setSession(null);
    sessionStorage.clear();
    localStorage.removeItem("shopcart.guest-token");
  });

  afterEach(() => {
    setSession(null);
    sessionStorage.clear();
    localStorage.removeItem("shopcart.guest-token");
  });

  it("rejects a role mismatch and logs out without sending a refresh token", async () => {
    let logoutBody = "not-called";
    server.use(
      http.get(`${api}/auth/me`, () =>
        HttpResponse.json({
          ok: true,
          datos: {
            idUsuario: 14,
            codigoPublico: "operator-code",
            nombre: "Operador",
            apellido: "Tienda",
            correo: "operator@example.com",
            telefono: null,
            rol: "Operador",
          },
        }),
      ),
      http.post(`${api}/auth/login`, () =>
        HttpResponse.json({
          ok: true,
          datos: {
            usuario: {
              idUsuario: 14,
              codigoPublico: "operator-code",
              nombre: "Operador",
              apellido: "Tienda",
              correo: "operator@example.com",
              telefono: null,
              rol: "Operador",
            },
          },
        }),
      ),
      http.post(`${api}/auth/logout`, async ({ request }) => {
        logoutBody = await request.text();
        return HttpResponse.json({ ok: true });
      }),
    );

    render(
      <AuthProvider>
        <RoleLoginHarness />
      </AuthProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Ingresar como administrador" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Seleccionaste el acceso de Administrador, pero esta cuenta tiene el rol Operador.",
    );
    expect(logoutBody).toBe("");
    expect(screen.getByTestId("authenticated-role")).toHaveTextContent(
      "sin sesión",
    );
    expect(getSession()).toBeNull();
    expect(sessionStorage.getItem("shopcart.session")).toBeNull();
  });

  it("restores the user from the cookie-backed profile without persisting a session", async () => {
    server.use(
      http.get(`${api}/auth/me`, () =>
        HttpResponse.json({
          ok: true,
          datos: {
            idUsuario: 1,
            codigoPublico: "admin-code",
            nombre: "Admin",
            apellido: "ShopCart",
            correo: "admin@example.com",
            telefono: null,
            rol: "Administrador",
          },
        }),
      ),
    );

    render(
      <AuthProvider>
        <RestoredSessionHarness />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("restored-user")).toHaveTextContent(
        "admin@example.com",
      ),
    );
    expect(sessionStorage.getItem("shopcart.session")).toBeNull();
  });
});
