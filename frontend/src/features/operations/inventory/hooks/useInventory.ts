import { useQuery } from "@tanstack/react-query";
import { fetchInventory, fetchInventoryCategories, fetchInventoryMovements, inventoryQueryKey, type MovementFilters } from "../api/inventoryApi";
import type { InventoryFilters } from "../types/inventoryTypes";

export function useInventory(filters: InventoryFilters, page: number) {
  return useQuery({ queryKey: [...inventoryQueryKey, "stock", filters, page], queryFn: () => fetchInventory(filters, page), placeholderData: (previous) => previous });
}

export function useInventoryCategories() {
  return useQuery({ queryKey: [...inventoryQueryKey, "categories"], queryFn: fetchInventoryCategories, staleTime: 5 * 60 * 1000 });
}

export function useInventoryMovements(idVariante: number | null, page: number, filters: MovementFilters) {
  return useQuery({ queryKey: [...inventoryQueryKey, "kardex", idVariante, page, filters], queryFn: () => fetchInventoryMovements(idVariante!, page, filters), enabled: idVariante !== null, placeholderData: (previous) => previous });
}
