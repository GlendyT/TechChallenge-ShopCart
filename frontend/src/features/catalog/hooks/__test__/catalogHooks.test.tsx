import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { catalogQueryKeys } from "../../api/catalogApi";
import { productCode, productDetail, products, filledCart } from "../../../../test/fixtures";
import { useAddToCart } from "../useAddToCart";
import { useCatalogProducts } from "../useCatalogProducts";
import { useCatalogSuggestions } from "../useCatalogSuggestions";
import { useCategories } from "../useCategories";
import { useProduct } from "../useProduct";
import type { CatalogFilters } from "../../types/catalogTypes";

const mocks = vi.hoisted(() => ({
  fetchCategories: vi.fn(),
  fetchProducts: vi.fn(),
  fetchProduct: vi.fn(),
  updateCartItem: vi.fn(),
}));

vi.mock("../../api/catalogApi", () => ({
  catalogQueryKeys: {
    all: ["catalog"],
    categories: ["catalog", "categories"],
    products: (filters: unknown, limit = 9) => ["catalog", "products", filters, limit],
    suggestions: (search: string) => ["catalog", "suggestions", search],
    product: (code: string) => ["catalog", "product", code],
  },
  fetchCategories: mocks.fetchCategories,
  fetchProducts: mocks.fetchProducts,
  fetchProduct: mocks.fetchProduct,
}));

vi.mock("../../../../shared/hooks/useDebouncedValue", () => ({
  useDebouncedValue: <T,>(value: T) => value,
}));

vi.mock("../../../cart/api/cartApi", () => ({
  cartQueryKey: ["cart"],
  updateCartItem: mocks.updateCartItem,
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

const filters: CatalogFilters = {
  search: "camisa",
  category: "1",
  order: "RECIENTE",
  page: 1,
  inStock: false,
  priceRange: "all",
};

describe("catalog data hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchCategories.mockResolvedValue([{ IDCategoria: 1, Nombre: "Caballeros" }]);
    mocks.fetchProducts.mockResolvedValue({
      ok: true,
      datos: products,
      totalRegistros: products.length,
      totalPaginas: 1,
      paginaActual: 1,
    });
    mocks.fetchProduct.mockResolvedValue(productDetail);
    mocks.updateCartItem.mockResolvedValue(filledCart);
  });

  it("loads categories and products with query keys derived from their filters", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const categories = renderHook(() => useCategories(), { wrapper: Wrapper });
    await waitFor(() => expect(categories.result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(catalogQueryKeys.categories)).toEqual([
      { IDCategoria: 1, Nombre: "Caballeros" },
    ]);

    const listing = renderHook(() => useCatalogProducts(filters), { wrapper: Wrapper });
    await waitFor(() => expect(listing.result.current.isSuccess).toBe(true));
    expect(mocks.fetchProducts).toHaveBeenCalledWith(filters);
    expect(queryClient.getQueryData(catalogQueryKeys.products(filters))).toMatchObject({
      datos: products,
    });
  });

  it("keeps product detail disabled without a code and enables suggestions from two characters", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const detail = renderHook(
      ({ code }: { code: string }) => useProduct(code),
      { wrapper: Wrapper, initialProps: { code: "" } },
    );
    expect(detail.result.current.fetchStatus).toBe("idle");
    await detail.rerender({ code: productCode });
    await waitFor(() => expect(detail.result.current.isSuccess).toBe(true));
    expect(mocks.fetchProduct).toHaveBeenCalledWith(productCode);
    expect(queryClient.getQueryData(catalogQueryKeys.product(productCode))).toEqual(
      productDetail,
    );

    const suggestions = renderHook(
      ({ search }: { search: string }) => useCatalogSuggestions(search),
      { wrapper: Wrapper, initialProps: { search: "x" } },
    );
    expect(suggestions.result.current.fetchStatus).toBe("idle");
    expect(mocks.fetchProducts).not.toHaveBeenCalled();
    await suggestions.rerender({ search: "  camisa " });
    await waitFor(() => expect(suggestions.result.current.isSuccess).toBe(true));
    expect(mocks.fetchProducts).toHaveBeenCalledOnce();
    expect(mocks.fetchProducts).toHaveBeenLastCalledWith({
      search: "camisa",
      category: "",
      order: "RECIENTE",
      page: 1,
      inStock: false,
      priceRange: "all",
    });
  });

  it("invalidates the cart query after adding a product and exposes a dismissible notice", async () => {
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(["cart"], filledCart);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAddToCart(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(11);
    });

    expect(mocks.updateCartItem).toHaveBeenCalledWith(11, 1);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["cart"] });
    expect(result.current.notice).toBe("Agregamos esta pieza a tu bolsa.");
    act(() => result.current.clearNotice());
    expect(result.current.notice).toBe("");
  });
});
