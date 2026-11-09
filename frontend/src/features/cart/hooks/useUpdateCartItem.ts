import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartQueryKey, updateCartItem } from "../api/cartApi";

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idVariante, cantidad }: { idVariante: number; cantidad: number }) =>
      updateCartItem(idVariante, cantidad),
    onSuccess: (updatedCart) => queryClient.setQueryData(cartQueryKey, updatedCart),
  });
}
