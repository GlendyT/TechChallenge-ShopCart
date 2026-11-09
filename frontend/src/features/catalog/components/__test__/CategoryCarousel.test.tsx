import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Category } from "../../types/catalogTypes";
import { CategoryCarousel } from "../CategoryCarousel";

const categories: Category[] = [
  { IDCategoria: 1, Nombre: "Caballeros", Descripcion: "Ropa para caballeros." },
  { IDCategoria: 2, Nombre: "Tecnología", Descripcion: "Dispositivos y accesorios." },
  { IDCategoria: 3, Nombre: "Mascotas", Descripcion: "Productos para mascotas." },
];

describe("CategoryCarousel", () => {
  it("renders one primary carousel and a static side category with selection state", async () => {
    const user = userEvent.setup();
    const onSelectCategory = vi.fn();
    const { container } = render(
      <CategoryCarousel
        categories={categories}
        selectedCategory="2"
        isLoading={false}
        isError={false}
        onSelectCategory={onSelectCategory}
        onRetry={vi.fn()}
      />,
    );

    const primaryCarousel = screen.getByRole("region", { name: "Categorías principales" });
    expect(primaryCarousel).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="carousel"]')).toHaveLength(1);
    expect(within(primaryCarousel).getByRole("button", { name: "Explorar categoría Caballeros" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Explorar categoría Tecnología" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Explorar categoría Tecnología" }).querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("photo-1505740420928"),
    );

    await user.click(screen.getByRole("button", { name: "Explorar categoría Mascotas" }));
    expect(onSelectCategory).toHaveBeenCalledWith(3);
  });

  it("shows loading, empty and error states and retries a failed category request", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(
      <CategoryCarousel
        categories={[]}
        selectedCategory=""
        isLoading
        isError={false}
        onSelectCategory={vi.fn()}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByRole("status", { name: "Cargando categorías" })).toBeInTheDocument();

    rerender(
      <CategoryCarousel
        categories={[]}
        selectedCategory=""
        isLoading={false}
        isError={false}
        onSelectCategory={vi.fn()}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("No hay categorías disponibles");

    rerender(
      <CategoryCarousel
        categories={[]}
        selectedCategory=""
        isLoading={false}
        isError
        onSelectCategory={vi.fn()}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar las categorías");
    await user.click(screen.getByRole("button", { name: "Intentar de nuevo" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("uses its fallback image when a category image fails to load", () => {
    render(
      <CategoryCarousel
        categories={[{ IDCategoria: 8, Nombre: "Caballeros" }]}
        selectedCategory=""
        isLoading={false}
        isError={false}
        onSelectCategory={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    const image = screen.getByRole("button", { name: "Explorar categoría Caballeros" }).querySelector("img");
    expect(image?.getAttribute("src")).toContain("photo-1596755094514");
    fireEvent.error(image!);
    expect(image?.getAttribute("src")).toContain("photo-1441986300917");
  });
});
