import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../../../../shared/auth/AuthContext";
import { createAuthContextValue, createTestUser } from "../../../../test/authContextValue";
import { emptyCart, filledCart } from "../../../../test/fixtures";
import { CartPage } from "../CartPage";

const hookMocks = vi.hoisted(() => ({
  useCart: vi.fn(),
  useClearCart: vi.fn(),
  useRemoveCartItem: vi.fn(),
  useUpdateCartItem: vi.fn(),
  clear: vi.fn(),
  remove: vi.fn(),
  update: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("../../hooks/useCart", () => ({ useCart: hookMocks.useCart }));
vi.mock("../../hooks/useClearCart", () => ({ useClearCart: hookMocks.useClearCart }));
vi.mock("../../hooks/useRemoveCartItem", () => ({ useRemoveCartItem: hookMocks.useRemoveCartItem }));
vi.mock("../../hooks/useUpdateCartItem", () => ({ useUpdateCartItem: hookMocks.useUpdateCartItem }));

function renderCart(isAuthenticated = false) {
  const auth = createAuthContextValue(
    isAuthenticated ? createTestUser("Cliente") : null,
  );
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("CartPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookMocks.clear.mockResolvedValue(emptyCart);
    hookMocks.useCart.mockReturnValue({
      data: emptyCart,
      isPending: false,
      isError: false,
      refetch: hookMocks.refetch,
    });
    hookMocks.useClearCart.mockReturnValue({
      error: null,
      isPending: false,
      mutateAsync: hookMocks.clear,
    });
    hookMocks.useRemoveCartItem.mockReturnValue({
      error: null,
      isPending: false,
      mutate: hookMocks.remove,
    });
    hookMocks.useUpdateCartItem.mockReturnValue({
      error: null,
      isPending: false,
      mutate: hookMocks.update,
    });
  });

  it("shows an empty-cart state with a link back to the store", () => {
    renderCart();

    expect(screen.getByRole("heading", { name: "Tu bolsa." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tu próxima pieza te espera." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explorar la tienda" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("shows loading and error states and retries the cart request", async () => {
    const user = userEvent.setup();
    hookMocks.useCart.mockReturnValueOnce({
      data: undefined,
      isPending: true,
      isError: false,
      refetch: hookMocks.refetch,
    });
    const { rerender } = renderCart();
    expect(screen.getByRole("status", { name: "Cargando tu bolsa" })).toBeInTheDocument();

    hookMocks.useCart.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("No hay conexión."),
      refetch: hookMocks.refetch,
    });
    rerender(
      <AuthContext.Provider value={createAuthContextValue()}>
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("No hay conexión.");
    await user.click(screen.getByRole("button", { name: "Intentar de nuevo" }));
    expect(hookMocks.refetch).toHaveBeenCalledOnce();
  });

  it("updates quantities, removes items and routes checkout by authentication state", async () => {
    const user = userEvent.setup();
    hookMocks.useCart.mockReturnValue({
      data: filledCart,
      isPending: false,
      isError: false,
      refetch: hookMocks.refetch,
    });
    renderCart();

    expect(screen.getByRole("link", { name: "Camisa Oxford Slim Fit" })).toHaveAttribute(
      "href",
      "/producto/e025b2fb-0987-40ad-b0ce-9010dc8ccf2e",
    );
    expect(screen.getByRole("link", { name: "Continuar al checkout" })).toHaveAttribute(
      "href",
      "/acceso?next=/checkout",
    );
    await user.click(screen.getByRole("button", { name: "Aumentar cantidad de Camisa Oxford Slim Fit" }));
    expect(hookMocks.update).toHaveBeenCalledWith({ idVariante: 11, cantidad: 2 });
    await user.click(screen.getByRole("button", { name: "Quitar" }));
    expect(hookMocks.remove).toHaveBeenCalledWith(11);
  });

  it("confirms before clearing all items and uses checkout directly for a signed-in customer", async () => {
    const user = userEvent.setup();
    hookMocks.useCart.mockReturnValue({
      data: filledCart,
      isPending: false,
      isError: false,
      refetch: hookMocks.refetch,
    });
    renderCart(true);

    expect(screen.getByRole("link", { name: "Continuar al checkout" })).toHaveAttribute(
      "href",
      "/checkout",
    );
    await user.click(screen.getByRole("button", { name: "Vaciar carrito" }));
    const dialog = screen.getByRole("dialog", { name: "Vaciar carrito" });
    await user.click(within(dialog).getByRole("button", { name: "Vaciar carrito" }));

    expect(hookMocks.clear).toHaveBeenCalledOnce();
    expect(await screen.findByRole("button", { name: "Vaciar carrito" })).toBeInTheDocument();
  });
});
