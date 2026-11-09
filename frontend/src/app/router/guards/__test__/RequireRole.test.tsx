import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthContext } from "../../../../shared/auth/AuthContext";
import {
  createAuthContextValue,
  createTestUser,
} from "../../../../test/authContextValue";
import { RequireRole } from "../RequireRole";

function RedirectLocation() {
  const location = useLocation();
  const state = location.state as { from?: string } | null;
  return <output data-testid="redirect-from">{state?.from}</output>;
}

function renderRoleRoute(
  auth: ReturnType<typeof createAuthContextValue>,
  path: string,
  allowedRoles: Array<"Administrador" | "Operador" | "Cliente">,
) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<RequireRole allowedRoles={allowedRoles} />}>
            <Route path="/operaciones/pedidos" element={<p>Pedidos de operaciones</p>} />
            <Route path="/administracion/catalogo" element={<p>Catálogo administrativo</p>} />
          </Route>
          <Route path="/acceso" element={<RedirectLocation />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("RequireRole", () => {
  it("waits for session restoration before evaluating roles", () => {
    renderRoleRoute(createAuthContextValue(null, true), "/operaciones/pedidos", ["Operador"]);

    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("Pedidos de operaciones")).not.toBeInTheDocument();
  });

  it("redirects users without a session to sign in and preserves the destination", () => {
    renderRoleRoute(createAuthContextValue(), "/operaciones/pedidos", ["Operador"]);

    expect(screen.getByTestId("redirect-from")).toHaveTextContent(
      "/operaciones/pedidos",
    );
  });

  it("renders the route when the user has an allowed role", () => {
    renderRoleRoute(
      createAuthContextValue(createTestUser("Operador")),
      "/operaciones/pedidos",
      ["Operador", "Administrador"],
    );

    expect(screen.getByText("Pedidos de operaciones")).toBeInTheDocument();
  });

  it("shows a restricted-access state when the role is not allowed", () => {
    renderRoleRoute(
      createAuthContextValue(createTestUser("Operador")),
      "/administracion/catalogo",
      ["Administrador"],
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Acceso restringido");
    expect(screen.queryByText("Catálogo administrativo")).not.toBeInTheDocument();
  });
});
