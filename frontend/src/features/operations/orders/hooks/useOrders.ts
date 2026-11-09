import { useQuery } from "@tanstack/react-query";
import { fetchOrders, ordersQueryKey } from "../api/ordersApi";
import type { OrderFilters } from "../types/orderTypes";

export function useOrders(filters: OrderFilters, page: number, pageSize: number) {
  return useQuery({
    queryKey: [...ordersQueryKey, filters, page, pageSize],
    queryFn: () => fetchOrders(filters, page, pageSize),
    placeholderData: (previous) => previous,
  });
}
