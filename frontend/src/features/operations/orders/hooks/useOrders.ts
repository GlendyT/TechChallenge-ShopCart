import { useQuery } from "@tanstack/react-query";
import { fetchOrders, ordersQueryKey } from "../api/ordersApi";
import type { OrderFilters } from "../types/orderTypes";

export function useOrders(filters: OrderFilters, page: number) {
  return useQuery({
    queryKey: [...ordersQueryKey, filters, page],
    queryFn: () => fetchOrders(filters, page),
    placeholderData: (previous) => previous,
  });
}
