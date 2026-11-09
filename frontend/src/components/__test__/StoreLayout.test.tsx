import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../../shared/auth/AuthContext";
import { createAuthContextValue } from "../../test/authContextValue";
import { StoreLayout } from "../StoreLayout";

const hookMocks = vi.hoisted(() => ({
  useCart: vi.fn(),
  useCategories: vi.fn(),
  useCatalogSuggestions: vi.fn(),
}));

vi.mock("../../features/cart/hooks/useCart", () => ({
  useCart: hookMocks.useCart,
}));

vi.mock("../../features/catalog/hooks/useCategories", () => ({
  useCategories: hookMocks.useCategories,
}));

vi.mock("../../features/catalog/hooks/useCatalogSuggestions", () => ({
  useCatalogSuggestions: hookMocks.useCatalogSuggestions,
}));

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="current-location">
      {location.pathname}
      {location.search}
      {location.hash}
    </output>
  );
}

function renderStore(initialPath = "/") {
  return render(
    <AuthContext.Provider value={createAuthContextValue()}>
      <MemoryRouter initialEntries={[initialPath]}>
        <StoreLayout />
        <LocationProbe />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("StoreLayout", () => {
  beforeEach(() => {
    hookMocks.useCart.mockReturnValue({ data: { TotalArticulos: 2 } });
    hookMocks.useCategories.mockReturnValue({
      data: [{ IDCategoria: 7, Nombre: "Tecnología" }],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    hookMocks.useCatalogSuggestions.mockReturnValue({
      data: { datos: [], totalRegistros: 0 },
      isDebouncing: false,
      isPending: false,
      isError: false,
    });
  });

  it("offers separate access destinations when the visitor is signed out", async () => {
    const user = userEvent.setup();
    renderStore();

    expect(screen.getByRole("link", { name: /Carrito de compra, 2 artículos/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Elegir tipo de acceso" }));

    expect(screen.getByText("Ingresar como")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Cliente" })).toHaveAttribute(
      "href",
      "/acceso?portal=cliente",
    );
    expect(screen.getByRole("menuitem", { name: "Operador" })).toHaveAttribute(
      "href",
      "/acceso?portal=operador",
    );
    expect(screen.getByRole("menuitem", { name: "Administrador" })).toHaveAttribute(
      "href",
      "/acceso?portal=administrador",
    );
  });

  it("submits a trimmed search to the catalog URL", async () => {
    const user = userEvent.setup();
    renderStore();

    await user.type(screen.getByRole("textbox", { name: "Buscar productos" }), "  teclado  ");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(screen.getByTestId("current-location")).toHaveTextContent(
      "/?busqueda=teclado#colecciones",
    );
  });
});
