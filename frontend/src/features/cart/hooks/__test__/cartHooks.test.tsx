import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cartQueryKey,
  clearCart,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from "../../api/cartApi";
import { emptyCart, filledCart } from "../../../../test/fixtures";
import { useCart } from "../useCart";
import { useClearCart } from "../useClearCart";
import { useRemoveCartItem } from "../useRemoveCartItem";
import { useUpdateCartItem } from "../useUpdateCartItem";

const mocks = vi.hoisted(() => ({
  fetchCart: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  clearCart: vi.fn(),
}));

vi.mock("../../api/cartApi", () => ({
  cartQueryKey: ["cart"],
  fetchCart: mocks.fetchCart,
  updateCartItem: mocks.updateCartItem,
  removeCartItem: mocks.removeCartItem,
  clearCart: mocks.clearCart,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { Wrapper, queryClient };
}

describe("cart hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchCart.mockResolvedValue(filledCart);
    mocks.updateCartItem.mockResolvedValue(filledCart);
    mocks.removeCartItem.mockResolvedValue(emptyCart);
    mocks.clearCart.mockResolvedValue(emptyCart);
  });

  it("loads the cart using the shared cache key", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useCart(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchCart).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(cartQueryKey)).toEqual(filledCart);
  });

  it("updates cached cart data after quantity, removal and clear mutations", async () => {
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(cartQueryKey, filledCart);

    const update = renderHook(() => useUpdateCartItem(), { wrapper: Wrapper });
    await update.result.current.mutateAsync({ idVariante: 11, cantidad: 2 });
    expect(updateCartItem).toHaveBeenCalledWith(11, 2);
    expect(queryClient.getQueryData(cartQueryKey)).toEqual(filledCart);

    const remove = renderHook(() => useRemoveCartItem(), { wrapper: Wrapper });
    await remove.result.current.mutateAsync(11);
    expect(removeCartItem.mock.calls[0]?.[0]).toBe(11);
    expect(queryClient.getQueryData(cartQueryKey)).toEqual(emptyCart);

    const clear = renderHook(() => useClearCart(), { wrapper: Wrapper });
    await clear.result.current.mutateAsync();
    expect(clearCart).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(cartQueryKey)).toEqual(emptyCart);
  });
});
