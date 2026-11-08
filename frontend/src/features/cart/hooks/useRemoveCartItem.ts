import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartQueryKey, removeCartItem } from "../api/cartApi";

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeCartItem,
    onSuccess: (updatedCart) => queryClient.setQueryData(cartQueryKey, updatedCart),
  });
}
