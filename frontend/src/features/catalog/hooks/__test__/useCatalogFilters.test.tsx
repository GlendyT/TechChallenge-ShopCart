import { act, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { useCatalogFilters } from "../useCatalogFilters";

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="search-params">{location.search}</output>;
}

function createRouterWrapper(initialEntry: string) {
  return function RouterWrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationProbe />
        {children}
      </MemoryRouter>
    );
  };
}

describe("useCatalogFilters", () => {
  it("reads category and search from the URL and updates category without dropping other parameters", () => {
    const wrapper = createRouterWrapper("/?categoria=2&busqueda=vestido&origen=promo");
    const { result } = renderHook(() => useCatalogFilters(), { wrapper });

    expect(result.current.category).toBe("2");
    expect(result.current.searchInput).toBe("vestido");
    expect(result.current.filters.search).toBe("vestido");

    act(() => result.current.setCategory("5"));

    const params = new URLSearchParams(screen.getByTestId("search-params").textContent ?? "");
    expect(params.get("categoria")).toBe("5");
    expect(params.get("busqueda")).toBe("vestido");
    expect(params.get("origen")).toBe("promo");
    expect(result.current.filters.page).toBe(1);
  });

  it("clears catalog filters and only removes the catalog URL parameters", () => {
    const wrapper = createRouterWrapper("/?categoria=2&busqueda=vestido&origen=promo");
    const { result } = renderHook(() => useCatalogFilters(), { wrapper });

    act(() => {
      result.current.setSearchInput("zapatos");
      result.current.setOrder("PRECIO_DESC");
      result.current.setPage(4);
      result.current.setInStock(true);
      result.current.setPriceRange("over-400");
    });
    act(() => result.current.clearFilters());

    expect(result.current.searchInput).toBe("");
    expect(result.current.order).toBe("RECIENTE");
    expect(result.current.page).toBe(1);
    expect(result.current.inStock).toBe(false);
    expect(result.current.priceRange).toBe("all");
    const params = new URLSearchParams(screen.getByTestId("search-params").textContent ?? "");
    expect(params.has("categoria")).toBe(false);
    expect(params.has("busqueda")).toBe(false);
    expect(params.get("origen")).toBe("promo");
  });
});
