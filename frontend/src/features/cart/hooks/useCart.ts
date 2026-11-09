import { useQuery } from "@tanstack/react-query";
import { cartQueryKey, fetchCart } from "../api/cartApi";

export function useCart() {
  return useQuery({ queryKey: cartQueryKey, queryFn: fetchCart, retry: false });
}
