import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../../../../shared/auth/AuthContext";
import { createAuthContextValue, createTestUser } from "../../../../test/authContextValue";
import { emptyCart, filledCart } from "../../../../test/fixtures";
import { CheckoutPage } from "../CheckoutPage";

const mocks = vi.hoisted(() => ({
  useCart: vi.fn(),
  useAddresses: vi.fn(),
  useValidateCoupon: vi.fn(),
  useCheckout: vi.fn(),
  validateCoupon: vi.fn(),
  placeOrder: vi.fn(),
  refetchCart: vi.fn(),
  refetchAddresses: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("../../../cart/hooks/useCart", () => ({ useCart: mocks.useCart }));
vi.mock("../../../account/hooks/useAddresses", () => ({ useAddresses: mocks.useAddresses }));
vi.mock("../../hooks/useValidateCoupon", () => ({ useValidateCoupon: mocks.useValidateCoupon }));
vi.mock("../../hooks/useCheckout", () => ({ useCheckout: mocks.useCheckout }));
vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess } }));

const address = {
  IDDireccion: 17,
  NombreDestinatario: "Ana López",
  TelefonoContacto: "55551234",
  DireccionLinea1: "Avenida Central 10",
  DireccionLinea2: null,
  Ciudad: "Guatemala",
  Departamento: "Guatemala",
  CodigoPostal: null,
  EsPrincipal: true,
};

function renderCheckout() {
  return render(
    <AuthContext.Provider
      value={createAuthContextValue(createTestUser("Cliente"))}
    >
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("CheckoutPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useCart.mockReturnValue({
      data: filledCart,
      isPending: false,
      isError: false,
      error: null,
      refetch: mocks.refetchCart,
    });
    mocks.useAddresses.mockReturnValue({
      data: [address],
      isPending: false,
      isError: false,
      error: null,
      refetch: mocks.refetchAddresses,
    });
    mocks.validateCoupon.mockResolvedValue({ ok: true, mensaje: "Cupón válido." });
    mocks.useValidateCoupon.mockReturnValue({
      mutateAsync: mocks.validateCoupon,
      isPending: false,
      isError: false,
      error: null,
    });
    mocks.useCheckout.mockReturnValue({
      mutate: mocks.placeOrder,
      isPending: false,
      error: null,
    });
  });

  it("shows a loading state while the cart or addresses are loading", () => {
    mocks.useCart.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      error: null,
      refetch: mocks.refetchCart,
    });

    renderCheckout();

    expect(screen.getByRole("status", { name: "Cargando el checkout" })).toBeInTheDocument();
  });

  it("retries failed cart and address requests", async () => {
    const user = userEvent.setup();
    mocks.useCart.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("Carrito no disponible."),
      refetch: mocks.refetchCart,
    });
    mocks.useAddresses.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("Direcciones no disponibles."),
      refetch: mocks.refetchAddresses,
    });

    renderCheckout();
    expect(screen.getByRole("alert")).toHaveTextContent("Carrito no disponible.");
    await user.click(screen.getByRole("button", { name: "Intentar de nuevo" }));
    expect(mocks.refetchCart).toHaveBeenCalledOnce();
    expect(mocks.refetchAddresses).toHaveBeenCalledOnce();
  });

  it("offers a way back to the store when the cart is empty", () => {
    mocks.useCart.mockReturnValue({
      data: emptyCart,
      isPending: false,
      isError: false,
      error: null,
      refetch: mocks.refetchCart,
    });

    renderCheckout();

    expect(screen.getByRole("heading", { name: "Tu bolsa está vacía." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a la tienda" })).toHaveAttribute("href", "/");
  });

  it("applies a coupon, selects delivery and submits an idempotent checkout", async () => {
    const user = userEvent.setup();
    renderCheckout();

    const placeOrder = screen.getByRole("button", { name: "Confirmar pedido" });
    expect(placeOrder).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: /Ana López/ }));
    expect(placeOrder).toBeEnabled();

    await user.type(screen.getByRole("textbox", { name: "Código de cupón" }), "verano15");
    await user.click(screen.getByRole("button", { name: "Aplicar" }));
    expect(mocks.validateCoupon).toHaveBeenCalledWith("VERANO15");
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Cupón válido.");

    await user.click(placeOrder);
    expect(mocks.placeOrder).toHaveBeenCalledWith({
      idDireccionEntrega: 17,
      claveIdempotencia: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
      metodoPago: "TARJETA_CREDITO",
      codigoCupon: "VERANO15",
      simularResultadoPago: "APROBADO",
    });
  });

  it("shows coupon validation errors and prompts for an address when none is saved", async () => {
    const user = userEvent.setup();
    mocks.useAddresses.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      error: null,
      refetch: mocks.refetchAddresses,
    });
    mocks.validateCoupon.mockRejectedValue(new Error("Cupón vencido."));
    mocks.useValidateCoupon.mockReturnValue({
      mutateAsync: mocks.validateCoupon,
      isPending: false,
      isError: true,
      error: new Error("Cupón vencido."),
    });
    renderCheckout();

    expect(screen.getByText(/Necesitas guardar una dirección/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a mi cuenta" })).toHaveAttribute("href", "/cuenta");
    expect(screen.getByRole("button", { name: "Confirmar pedido" })).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: "Código de cupón" }), "VENCIDO");
    await user.click(screen.getByRole("button", { name: "Aplicar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Cupón vencido.");
  });
});
