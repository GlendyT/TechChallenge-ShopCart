import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useInventory, useInventoryMovements } from "../useInventory";

const api = vi.hoisted(() => ({ fetchInventory: vi.fn(), fetchInventoryMovements: vi.fn() }));
vi.mock("../../api/inventoryApi", () => ({
  fetchInventory: api.fetchInventory,
  fetchInventoryMovements: api.fetchInventoryMovements,
  fetchInventoryCategories: vi.fn(),
  inventoryQueryKey: ["operations", "inventory"],
}));

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("inventory hooks", () => {
  it("loads inventory using the filters, page and selected page size", async () => {
    const filters = { busqueda: "camisa", idCategoria: "2", soloBajoStock: false };
    api.fetchInventory.mockResolvedValue({ datos: [], totalRegistros: 0, paginaActual: 2, totalPaginas: 0 });
    const { result } = renderHook(() => useInventory(filters, 2, 50), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.fetchInventory).toHaveBeenCalledWith(filters, 2, 50);
  });

  it("does not request movement history until a variant is selected", async () => {
    const filters = { tipoMovimiento: "", fechaInicio: "", fechaFin: "" };
    const { rerender } = renderHook(({ variant }) => useInventoryMovements(variant, 1, filters, 10), {
      initialProps: { variant: null as number | null }, wrapper: createWrapper(),
    });
    expect(api.fetchInventoryMovements).not.toHaveBeenCalled();
    api.fetchInventoryMovements.mockResolvedValue({ datos: [], totalRegistros: 0, paginaActual: 1, totalPaginas: 1 });
    rerender({ variant: 11 });
    await waitFor(() => expect(api.fetchInventoryMovements).toHaveBeenCalledWith(11, 1, filters, 10));
  });
});
