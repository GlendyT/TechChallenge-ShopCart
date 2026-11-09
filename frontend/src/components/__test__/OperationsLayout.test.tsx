import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { OperationsLayout } from "../OperationsLayout";
import { AuthContext } from "../../shared/auth/AuthContext";
import { createAuthContextValue, createTestUser } from "../../test/authContextValue";

function renderOperations(
  role: "Administrador" | "Operador" | "Cliente" | null,
  signOut = vi.fn(),
) {
  const authValue = {
    ...createAuthContextValue(role ? createTestUser(role) : null),
    signOut,
  };

  return {
    signOut,
    ...render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={["/operaciones/pedidos"]}>
          <Routes>
            <Route path="/operaciones" element={<OperationsLayout />}>
              <Route path="pedidos" element={<p>Contenido de pedidos</p>} />
            </Route>
            <Route path="/acceso" element={<p>Ruta de acceso</p>} />
            <Route path="/" element={<p>Inicio de la tienda</p>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    ),
  };
}

describe("OperationsLayout", () => {
  it("renders the operator workspace and signs out on request", async () => {
    const user = userEvent.setup();
    const signOut = vi.fn().mockResolvedValue(undefined);
    renderOperations("Operador", signOut);

    expect(screen.getByText("Contenido de pedidos")).toBeInTheDocument();
    expect(screen.getByText("Operador", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pedidos" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(signOut).toHaveBeenCalledOnce();
  });

  it("redirects customers back to the store", () => {
    renderOperations("Cliente");

    expect(screen.getByText("Inicio de la tienda")).toBeInTheDocument();
    expect(screen.queryByText("Contenido de pedidos")).not.toBeInTheDocument();
  });

  it("redirects visitors without a session to sign in", () => {
    renderOperations(null);

    expect(screen.getByText("Ruta de acceso")).toBeInTheDocument();
    expect(screen.queryByText("Contenido de pedidos")).not.toBeInTheDocument();
  });
});
