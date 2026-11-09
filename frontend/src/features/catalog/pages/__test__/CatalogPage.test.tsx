import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Category } from "../../types/catalogTypes";
import { CatalogPage } from "../CatalogPage";

const mocks = vi.hoisted(() => ({
  useCategories: vi.fn(),
  useCatalogFilters: vi.fn(),
}));

vi.mock("../../hooks/useCategories", () => ({
  useCategories: mocks.useCategories,
}));

vi.mock("../../hooks/useCatalogFilters", () => ({
  useCatalogFilters: mocks.useCatalogFilters,
}));

vi.mock("../../components/CategoryCarousel", () => ({
  CategoryCarousel: ({ categories, onSelectCategory }: {
    categories: Category[];
    onSelectCategory: (id: number) => void;
  }) => (
    <div data-testid="test-category-carousel">
      {categories.map((category) => (
        <button
          key={category.IDCategoria}
          type="button"
          onClick={() => onSelectCategory(category.IDCategoria)}
        >
          Select {category.Nombre}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../../components/CategoryProductSection", () => ({
  CategoryProductSection: ({ category }: { category: Category }) => (
    <article data-testid="category-section">{category.Nombre}</article>
  ),
}));

const categories: Category[] = Array.from({ length: 7 }, (_, index) => ({
  IDCategoria: index + 1,
  Nombre: `Categoría ${index + 1}`,
  Descripcion: `Descripción ${index + 1}`,
}));

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.hash}
    </output>
  );
}

function renderCatalog(initialEntry = "/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/categoria/:categoryId" element={<CatalogPage />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe("CatalogPage", () => {
  beforeEach(() => {
    mocks.useCategories.mockReturnValue({
      data: categories,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mocks.useCatalogFilters.mockReturnValue({
      category: "",
      filters: { search: "", category: "", order: "RECIENTE", page: 1, inStock: false, priceRange: "all" },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("renders five category sections initially and loads the next batch on intersection", () => {
    const observers: Array<{ callback: IntersectionObserverCallback }> = [];
    class ControlledIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        observers.push({ callback });
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    }
    vi.stubGlobal(
      "IntersectionObserver",
      ControlledIntersectionObserver as unknown as typeof IntersectionObserver,
    );

    renderCatalog();
    expect(screen.getAllByTestId("category-section")).toHaveLength(5);

    act(() => {
      observers[0]?.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(screen.getAllByTestId("category-section")).toHaveLength(7);
  });

  it("navigates to the selected category URL and shows a breadcrumb back to the store", async () => {
    const user = userEvent.setup();
    renderCatalog();

    await user.click(screen.getByRole("button", { name: "Select Categoría 2" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/categoria/2#colecciones");
    expect(screen.getByRole("navigation", { name: "Ruta de navegación" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tienda" })).toHaveAttribute("href", "/");
    expect(screen.getAllByTestId("category-section")).toHaveLength(1);
    expect(screen.getByTestId("category-section")).toHaveTextContent("Categoría 2");
    expect(screen.queryByTestId("test-category-carousel")).not.toBeInTheDocument();
  });

  it("shows loading and retryable error states for category loading", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    mocks.useCategories.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      error: null,
      refetch,
    });
    const { rerender } = renderCatalog();
    expect(screen.getByRole("status", { name: "Cargando categorías" })).toBeInTheDocument();

    mocks.useCategories.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("No hay conexión."),
      refetch,
    });
    rerender(
      <MemoryRouter initialEntries={["/"]}>
        <Routes><Route path="/" element={<CatalogPage />} /></Routes>
        <LocationProbe />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "No pudimos cargar las categorías" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Intentar de nuevo" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});
