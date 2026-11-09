import { useQuery } from "@tanstack/react-query";
import { fetchMyOrders } from "../api/accountApi";

export const myOrdersQueryKey = ["account", "orders"] as const;

export function useMyOrders() {
  return useQuery({ queryKey: myOrdersQueryKey, queryFn: fetchMyOrders, retry: false });
}
