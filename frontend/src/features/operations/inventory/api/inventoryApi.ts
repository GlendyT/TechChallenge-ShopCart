import { apiRequest } from "../../../../shared/api/httpClient";
import type { ApiEnvelope } from "../../../../shared/api/apiTypes";
import type { Category } from "../../../catalog/types/catalogTypes";
import type { InventoryAdjustmentInput, InventoryFilters, InventoryMovement, InventoryPageResult, InventoryVariant } from "../types/inventoryTypes";

const PAGE_SIZE = 10;
export const inventoryQueryKey = ["operations", "inventory"] as const;

function pageResult<T>(response: ApiEnvelope<T[]>, page: number): InventoryPageResult<T> {
  return {
    datos: response.datos,
    totalRegistros: response.totalRegistros ?? 0,
    paginaActual: response.paginaActual ?? page,
    totalPaginas: response.totalPaginas ?? 1,
  };
}

export async function fetchInventory(filters: InventoryFilters, page: number) {
  const params = new URLSearchParams({ pagina: String(page), limite: String(PAGE_SIZE) });
  if (filters.busqueda) params.set("busqueda", filters.busqueda);
  if (filters.idCategoria) params.set("idCategoria", filters.idCategoria);
  if (filters.soloBajoStock) params.set("soloBajoStock", "true");
  const response = await apiRequest<InventoryVariant[]>(`/inventario/existencias?${params}`);
  return pageResult(response, page);
}

export interface MovementFilters { tipoMovimiento: string; fechaInicio: string; fechaFin: string }

export async function fetchInventoryMovements(idVariante: number, page: number, filters: MovementFilters) {
  const params = new URLSearchParams({ idVariante: String(idVariante), pagina: String(page), limite: String(PAGE_SIZE) });
  if (filters.tipoMovimiento) params.set("tipoMovimiento", filters.tipoMovimiento);
  if (filters.fechaInicio) params.set("fechaInicio", `${filters.fechaInicio}T00:00:00.000`);
  if (filters.fechaFin) params.set("fechaFin", `${filters.fechaFin}T23:59:59.999`);
  const response = await apiRequest<InventoryMovement[]>(`/inventario/kardex?${params}`);
  return pageResult(response, page);
}

export async function fetchInventoryCategories() {
  const response = await apiRequest<Category[]>("/catalogo/categorias");
  return response.datos;
}

export async function registerInventoryAdjustment(input: InventoryAdjustmentInput) {
  return apiRequest("/inventario/ajuste", { method: "POST", body: JSON.stringify(input) });
}
