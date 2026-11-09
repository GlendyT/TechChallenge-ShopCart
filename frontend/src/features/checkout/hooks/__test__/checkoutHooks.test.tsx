import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitCheckout, validateCoupon, fetchOrder } from "../../api/checkoutApi";
import { filledCart } from "../../../../test/fixtures";
import { useCheckout } from "../useCheckout";
import { useOrder } from "../useOrder";
import { useValidateCoupon } from "../useValidateCoupon";

const mocks = vi.hoisted(() => ({
  submitCheckout: vi.fn(),
  validateCoupon: vi.fn(),
  fetchOrder: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("../../api/checkoutApi", () => ({
  submitCheckout: mocks.submitCheckout,
  validateCoupon: mocks.validateCoupon,
  fetchOrder: mocks.fetchOrder,
}));

vi.mock("../../../cart/api/cartApi", () => ({ cartQueryKey: ["cart"] }));
vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess } }));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="checkout-location">{location.pathname}</output>;
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        <LocationProbe />
      </MemoryRouter>
    );
  }
  return { Wrapper, queryClient };
}

describe("checkout hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.submitCheckout.mockResolvedValue({
      CodigoPublico: "order-code",
      NumeroPedido: "DA-2026-0001",
      Total: 498,
    });
    mocks.validateCoupon.mockResolvedValue({
      ok: true,
      mensaje: "Cupón válido.",
      datos: { MontoDescuento: 50 },
    });
    mocks.fetchOrder.mockResolvedValue({
      CodigoPublico: "order-code",
      NumeroPedido: "DA-2026-0001",
      Total: 498,
    });
  });

  it("validates coupon codes through a mutation", async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useValidateCoupon(), { wrapper: Wrapper });

    await expect(result.current.mutateAsync("VERANO15")).resolves.toMatchObject({
      mensaje: "Cupón válido.",
    });
    expect(validateCoupon.mock.calls[0]?.[0]).toBe("VERANO15");
  });

  it("loads an order only when a public code is provided", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const order = renderHook(
      ({ code }: { code: string }) => useOrder(code),
      { wrapper: Wrapper, initialProps: { code: "" } },
    );
    expect(order.result.current.fetchStatus).toBe("idle");
    expect(fetchOrder).not.toHaveBeenCalled();

    await order.rerender({ code: "order-code" });
    await waitFor(() => expect(order.result.current.isSuccess).toBe(true));
    expect(fetchOrder).toHaveBeenCalledWith("order-code");
    expect(queryClient.getQueryData(["checkout", "order", "order-code"])).toMatchObject({
      NumeroPedido: "DA-2026-0001",
    });
  });

  it("invalidates the cart, displays success and navigates to confirmation after checkout", async () => {
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(["cart"], filledCart);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCheckout(), { wrapper: Wrapper });
    const input = {
      idDireccionEntrega: 17,
      claveIdempotencia: "idempotency-key",
      metodoPago: "TARJETA_CREDITO" as const,
      codigoCupon: null,
      simularResultadoPago: "APROBADO" as const,
    };

    await act(async () => {
      await result.current.mutateAsync(input);
    });

    expect(submitCheckout).toHaveBeenCalledWith(input);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["cart"] });
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "Pedido order-code confirmado correctamente.",
    );
    expect(result.current.isSuccess).toBe(true);
    expect(screen.getByTestId("checkout-location")).toHaveTextContent(
      "/pedido-confirmado/order-code",
    );
  });
});
