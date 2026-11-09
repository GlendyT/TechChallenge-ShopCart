import { apiRequest } from "../../../../shared/api/httpClient";
import type {
  CancelOrderInput,
  OrderFilters,
  OrdersPageResult,
  UpdateOrderStatusInput,
  OperationsOrderDetail,
  ReturnOrderInput,
} from "../types/orderTypes";

export const ordersQueryKey = ["operations", "orders"] as const;
const PAGE_SIZE = 10;

export async function fetchOrders(
  filters: OrderFilters,
  page: number,
  pageSize = PAGE_SIZE,
): Promise<OrdersPageResult> {
  const params = new URLSearchParams({
    pagina: String(page),
    limite: String(pageSize),
  });
  if (filters.estado) params.set("estado", filters.estado);
  if (filters.busqueda) params.set("busqueda", filters.busqueda);
  if (filters.fechaInicio) {
    params.set("fechaInicio", `${filters.fechaInicio}T00:00:00.000`);
  }
  if (filters.fechaFin) {
    params.set("fechaFin", `${filters.fechaFin}T23:59:59.999`);
  }

  const response = await apiRequest<OrdersPageResult["datos"]>(`/pedidos?${params}`);
  return {
    datos: response.datos,
    totalRegistros: response.totalRegistros ?? 0,
    paginaActual: response.paginaActual ?? page,
    tamanoPagina: response.tamanoPagina ?? pageSize,
    totalPaginas: response.totalPaginas ?? 1,
  };
}

export async function updateOrderStatus(input: UpdateOrderStatusInput) {
  return apiRequest(`/pedidos/${input.idPedido}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estadoNuevo: input.estadoNuevo }),
  });
}

export async function cancelOrder(input: CancelOrderInput) {
  return apiRequest(`/pedidos/${input.idPedido}/cancelar`, {
    method: "POST",
    body: JSON.stringify({ motivo: input.motivo }),
  });
}

export async function fetchOrderDetail(publicCode: string) {
  return apiRequest<OperationsOrderDetail>(
    `/pedidos/${encodeURIComponent(publicCode)}`,
  ).then(({ datos }) => datos);
}

export async function returnOrderItem(input: ReturnOrderInput) {
  return apiRequest(`/pedidos/${input.idPedido}/devoluciones`, {
    method: "POST",
    body: JSON.stringify({
      idPedidoDetalle: input.idPedidoDetalle,
      cantidadADevolver: input.cantidadADevolver,
      motivo: input.motivo,
    }),
  });
}

export const orderDetailQueryKey = (code: string) => [...ordersQueryKey, "detail", code] as const;

