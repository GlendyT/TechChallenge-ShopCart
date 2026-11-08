import { useQuery } from "@tanstack/react-query";
import { fetchOrder } from "../api/checkoutApi";

export function useOrder(publicCode: string) {
  return useQuery({
    queryKey: ["checkout", "order", publicCode],
    queryFn: () => fetchOrder(publicCode),
    enabled: Boolean(publicCode),
    retry: false,
  });
}
