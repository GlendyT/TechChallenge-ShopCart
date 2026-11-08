import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { cartQueryKey, updateCartItem } from "../../cart/api/cartApi";

export function useAddToCart() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const mutation = useMutation({
    mutationFn: (variantId: number) => updateCartItem(variantId, 1),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cartQueryKey });
      setNotice("Agregamos esta pieza a tu bolsa.");
    },
  });

  return { ...mutation, notice, clearNotice: () => setNotice("") };
}
