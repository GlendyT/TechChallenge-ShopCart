import { useQuery } from "@tanstack/react-query";
import { fetchOrderDetail, orderDetailQueryKey } from "../api/ordersApi";

export function useOrderDetail(publicCode: string | null) {
  return useQuery({ queryKey: orderDetailQueryKey(publicCode ?? ""), queryFn: () => fetchOrderDetail(publicCode!), enabled: Boolean(publicCode) });
}
