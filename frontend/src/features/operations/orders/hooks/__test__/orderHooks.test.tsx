import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useOrderDetail } from "../useOrderDetail";
import { useOrders } from "../useOrders";

const api = vi.hoisted(() => ({ fetchOrderDetail: vi.fn(), fetchOrders: vi.fn() }));
vi.mock("../../api/ordersApi", () => ({
  fetchOrderDetail: api.fetchOrderDetail,
  fetchOrders: api.fetchOrders,
  orderDetailQueryKey: (code: string) => ["operations", "orders", "detail", code],
  ordersQueryKey: ["operations", "orders"],
}));

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("order query hooks", () => {
  it("does not fetch details without a public order code", () => {
    const { result } = renderHook(() => useOrderDetail(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(api.fetchOrderDetail).not.toHaveBeenCalled();
  });

  it("loads paginated orders and details with their arguments", async () => {
    const filters = { estado: "PAGADO" as const, fechaInicio: "", fechaFin: "", busqueda: "" };
    api.fetchOrders.mockResolvedValue({ datos: [], totalRegistros: 0, paginaActual: 1, tamanoPagina: 10, totalPaginas: 1 });
    api.fetchOrderDetail.mockResolvedValue({ IDPedido: 3, CodigoPublico: "public-3", NumeroPedido: "SC-003", Estado: "ENTREGADO", Total: 10, detalles: [] });
    const wrapper = createWrapper();
    const orders = renderHook(() => useOrders(filters, 1, 10), { wrapper });
    const detail = renderHook(() => useOrderDetail("public-3"), { wrapper });
    await waitFor(() => expect(orders.result.current.isSuccess && detail.result.current.isSuccess).toBe(true));
    expect(api.fetchOrders).toHaveBeenCalledWith(filters, 1, 10);
    expect(api.fetchOrderDetail).toHaveBeenCalledWith("public-3");
  });
});
