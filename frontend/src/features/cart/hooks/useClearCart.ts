import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartQueryKey, clearCart } from "../api/cartApi";

export function useClearCart() {
  const client = useQueryClient();
  return useMutation({ mutationFn: clearCart, onSuccess: (updatedCart) => client.setQueryData(cartQueryKey, updatedCart) });
}
