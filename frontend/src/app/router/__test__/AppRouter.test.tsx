import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../../../shared/auth/AuthContext";
import { createAuthContextValue, createTestUser } from "../../../test/authContextValue";
import { AppRouter } from "../AppRouter";

vi.mock("../../../components/StoreLayout", async () => {
  const { Outlet } = await import("react-router-dom");
  return { StoreLayout: () => <Outlet /> };
});

vi.mock("../../../components/OperationsLayout", async () => {
  const { Outlet } = await import("react-router-dom");
  return { OperationsLayout: () => <Outlet /> };
});

vi.mock("../../../features/operations/orders/pages/OrdersPage", () => ({
  OrdersPage: () => <p>Orders page route</p>,
}));

vi.mock("../../../features/operations/reports/pages/ReportsPage", () => ({
  ReportsPage: () => <p>Reports page route</p>,
}));

vi.mock("../../../features/operations/inventory/pages/InventoryPage", () => ({
  InventoryPage: () => <p>Inventory page route</p>,
}));

vi.mock("../../../features/administration/pages/AdminCatalogPage", () => ({
  AdminCatalogPage: () => <p>Admin catalog route</p>,
}));

vi.mock("../../../features/administration/pages/AdminUsersPage", () => ({
  AdminUsersPage: () => <p>Admin users route</p>,
}));

function renderRouter(path: string, role: "Administrador" | "Operador" | "Cliente") {
  window.history.replaceState({}, "", path);
  return render(
    <AuthContext.Provider value={createAuthContextValue(createTestUser(role))}>
      <AppRouter />
    </AuthContext.Provider>,
  );
}

describe("AppRouter", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("maps the operations orders URL to its page for an operator", () => {
    renderRouter("/operaciones/pedidos", "Operador");

    expect(screen.getByText("Orders page route")).toBeInTheDocument();
  });

  it("maps the administration catalog URL to its page for an administrator", () => {
    renderRouter("/administracion/catalogo", "Administrador");

    expect(screen.getByText("Admin catalog route")).toBeInTheDocument();
  });

  it("blocks an operator from entering an administration route", () => {
    renderRouter("/administracion/catalogo", "Operador");

    expect(screen.getByRole("alert")).toHaveTextContent("Acceso restringido");
    expect(screen.queryByText("Admin catalog route")).not.toBeInTheDocument();
  });
});
