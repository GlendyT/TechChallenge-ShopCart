import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../../../../shared/auth/AuthContext";
import { createAuthContextValue, createTestUser } from "../../../../test/authContextValue";
import { AccountPage } from "../AccountPage";

const hookMocks = vi.hoisted(() => ({
  useAccountProfile: vi.fn(),
  useAddresses: vi.fn(),
  useMyOrders: vi.fn(),
}));

vi.mock("../../hooks/useAccountProfile", () => ({
  useAccountProfile: hookMocks.useAccountProfile,
}));

vi.mock("../../hooks/useAddresses", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../hooks/useAddresses")>();
  return { ...actual, useAddresses: hookMocks.useAddresses };
});

vi.mock("../../hooks/useMyOrders", () => ({
  useMyOrders: hookMocks.useMyOrders,
}));

function renderAccountPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <AuthContext.Provider
      value={createAuthContextValue(createTestUser("Cliente"))}
    >
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AccountPage />
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>,
  );
}

describe("AccountPage", () => {
  beforeEach(() => {
    hookMocks.useAccountProfile.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        idUsuario: 1,
        codigoPublico: "account-test",
        nombre: "Ana María",
        apellido: "López",
        correo: "ana@example.com",
        telefono: "55551234",
        rol: "Cliente",
        activo: true,
        fechaCreacion: "2026-01-01T00:00:00.000Z",
      },
      refetch: vi.fn(),
    });
    hookMocks.useAddresses.mockReturnValue({
      isPending: false,
      isError: false,
      data: [],
      refetch: vi.fn(),
    });
    hookMocks.useMyOrders.mockReturnValue({
      isPending: false,
      isError: false,
      data: [],
      refetch: vi.fn(),
    });
  });

  it("shows the customer's profile and empty-order state", () => {
    renderAccountPage();

    expect(screen.getByRole("heading", { name: "Hola, Ana." })).toBeInTheDocument();
    expect(screen.getByText("Pedidos recientes")).toBeInTheDocument();
    expect(screen.getByText(/Aún no hay pedidos/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explorar tienda" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByText("55551234")).toBeInTheDocument();
    expect(screen.getByText("Direcciones")).toBeInTheDocument();
  });

  it("renders loading and retry states from account queries", () => {
    hookMocks.useAccountProfile.mockReturnValue({
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    });
    hookMocks.useAddresses.mockReturnValue({
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    });
    hookMocks.useMyOrders.mockReturnValue({
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    });

    renderAccountPage();

    expect(screen.getByRole("status", { name: "Cargando pedidos" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Cargando direcciones" })).toBeInTheDocument();
    expect(screen.getByText("Cargando perfil…")).toBeInTheDocument();
  });
});
