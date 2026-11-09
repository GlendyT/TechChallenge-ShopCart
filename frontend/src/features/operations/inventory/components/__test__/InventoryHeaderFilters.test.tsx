import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Category } from "../../../../catalog/types/catalogTypes";
import type { InventoryFilters } from "../../types/inventoryTypes";
import { InventoryHeaderFilters } from "../InventoryHeaderFilters";

const categories: Category[] = [
  { IDCategoria: 3, Nombre: "Tecnología" },
  { IDCategoria: 7, Nombre: "Deportes" },
];

const draftFilters: InventoryFilters = {
  busqueda: "", idCategoria: "", soloBajoStock: false,
};

function renderFilters(overrides: Partial<ComponentProps<typeof InventoryHeaderFilters>> = {}) {
  const props = {
    draftFilters,
    categories,
    hasActiveFilters: false,
    onSearchChange: vi.fn(),
    onCategoryChange: vi.fn(),
    onLowStockChange: vi.fn(),
    onApply: vi.fn(),
    onClear: vi.fn(),
    ...overrides,
  };
  return { ...render(<InventoryHeaderFilters {...props} />), props };
}

describe("InventoryHeaderFilters", () => {
  it("forwards search and category changes", async () => {
    const { props } = renderFilters();

    fireEvent.change(screen.getByRole("textbox", { name: "Buscar producto o SKU" }), {
      target: { value: "camisa" },
    });
    expect(props.onSearchChange).toHaveBeenCalledWith("camisa");

    const user = userEvent.setup();
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Tecnología" }));
    expect(props.onCategoryChange).toHaveBeenCalledWith("3");
  });

  it("applies stock filters and closes the filter panel", async () => {
    const user = userEvent.setup();
    const { props } = renderFilters();

    await user.click(screen.getByRole("button", { name: "Abrir filtros de inventario" }));
    const panel = screen.getByRole("form", { name: "Filtros de inventario" });
    await user.click(screen.getByRole("checkbox", { name: /Stock bajo/ }));
    expect(props.onLowStockChange).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole("button", { name: "Aplicar" }));
    expect(props.onApply).toHaveBeenCalledOnce();
    expect(panel).not.toBeInTheDocument();
  });

  it("shows clear only for active filters and clears before closing the panel", async () => {
    const user = userEvent.setup();
    const { props, rerender } = renderFilters({ hasActiveFilters: true });

    await user.click(screen.getByRole("button", { name: "Abrir filtros de inventario" }));
    await user.click(screen.getByRole("button", { name: /Limpiar/ }));

    expect(props.onClear).toHaveBeenCalledOnce();
    expect(screen.queryByRole("form", { name: "Filtros de inventario" })).not.toBeInTheDocument();

    rerender(<InventoryHeaderFilters {...props} hasActiveFilters={false} />);
    await user.click(screen.getByRole("button", { name: "Abrir filtros de inventario" }));
    expect(screen.queryByRole("button", { name: /Limpiar/ })).not.toBeInTheDocument();
  });
});
