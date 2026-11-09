import { fireEvent, render, screen } from "@testing-library/react";
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

describe("AuthProvider portal role validation", () => {
  beforeEach(() => {
    setSession(null);
    localStorage.removeItem("shopcart.guest-token");
  });

  afterEach(() => {
    setSession(null);
    localStorage.removeItem("shopcart.guest-token");
  });

  it("rejects a role mismatch and revokes the returned refresh token", async () => {
    let revokedRefreshToken = "";
    server.use(
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
            accessToken: "operator-access-token",
            refreshToken: "operator-refresh-token",
          },
        }),
      ),
      http.post(`${api}/auth/logout`, async ({ request }) => {
        const body = (await request.json()) as { refreshToken: string };
        revokedRefreshToken = body.refreshToken;
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
    expect(revokedRefreshToken).toBe("operator-refresh-token");
    expect(screen.getByTestId("authenticated-role")).toHaveTextContent(
      "sin sesión",
    );
    expect(getSession()).toBeNull();
  });
});
