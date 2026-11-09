import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthContext } from "../../../../shared/auth/AuthContext";
import {
  createAuthContextValue,
  createTestUser,
} from "../../../../test/authContextValue";
import { RequireAuthentication } from "../RequireAuthentication";

function RedirectLocation() {
  const location = useLocation();
  const state = location.state as { from?: string } | null;
  return <output data-testid="redirect-from">{state?.from}</output>;
}

function renderProtectedRoute(
  auth: ReturnType<typeof createAuthContextValue>,
  initialEntry = "/cuenta",
) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<RequireAuthentication />}>
            <Route path="/cuenta" element={<p>Contenido privado</p>} />
          </Route>
          <Route path="/acceso" element={<RedirectLocation />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("RequireAuthentication", () => {
  it("shows a loading state while the cookie session is restored", () => {
    renderProtectedRoute(createAuthContextValue(null, true));

    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Verificando sesión")).toBeInTheDocument();
    expect(screen.queryByText("Contenido privado")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users and preserves the requested URL", () => {
    renderProtectedRoute(
      createAuthContextValue(),
      "/cuenta?tab=pedidos",
    );

    expect(screen.getByTestId("redirect-from")).toHaveTextContent(
      "/cuenta?tab=pedidos",
    );
  });

  it("renders the protected route for an authenticated user", () => {
    renderProtectedRoute(createAuthContextValue(createTestUser("Cliente")));

    expect(screen.getByText("Contenido privado")).toBeInTheDocument();
  });
});
