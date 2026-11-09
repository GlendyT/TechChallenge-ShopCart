import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useReports } from "../useReports";

const fetchReports = vi.hoisted(() => vi.fn());
vi.mock("../../api/reportsApi", () => ({ fetchReports, reportsQueryKey: ["operations", "reports"] }));

describe("useReports", () => {
  it("loads report datasets for the selected filters", async () => {
    const filters = { fechaInicio: "2026-11-01", fechaFin: "2026-11-09", agrupacion: "DIA" as const, minutosInactividad: 1440 };
    const payload = { ventasPeriodo: [], topProductos: [], ventasCategoria: [], carritosAbandonados: [] };
    fetchReports.mockResolvedValue(payload);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useReports(filters), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchReports).toHaveBeenCalledWith(filters);
    expect(result.current.data).toEqual(payload);
  });
});
