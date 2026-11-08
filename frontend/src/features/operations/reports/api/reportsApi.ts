import { apiRequest } from "../../../../shared/api/httpClient";
import type { AbandonedCartRow, CategorySalesRow, ReportFilters, ReportsData, SalesPeriodRow, TopProductRow } from "../types/reportTypes";

export const reportsQueryKey = ["operations", "reports"] as const;

function periodParams(filters: ReportFilters) {
  return new URLSearchParams({
    fechaInicio: `${filters.fechaInicio}T00:00:00.000`,
    fechaFin: `${filters.fechaFin}T23:59:59.999`,
  });
}

export async function fetchReports(filters: ReportFilters): Promise<ReportsData> {
  const period = periodParams(filters);
  const salesParams = new URLSearchParams(period);
  salesParams.set("agrupacion", filters.agrupacion);
  const cartParams = new URLSearchParams({ minutosInactividad: String(filters.minutosInactividad) });
  const [sales, top, categories, carts] = await Promise.all([
    apiRequest<SalesPeriodRow[]>(`/reportes/ventas-periodo?${salesParams}`),
    apiRequest<TopProductRow[]>(`/reportes/top-productos?${period}`),
    apiRequest<CategorySalesRow[]>(`/reportes/ventas-categoria?${period}`),
    apiRequest<AbandonedCartRow[]>(`/reportes/carritos-abandonados?${cartParams}`),
  ]);
  return { ventasPeriodo: sales.datos, topProductos: top.datos, ventasCategoria: categories.datos, carritosAbandonados: carts.datos };
}
