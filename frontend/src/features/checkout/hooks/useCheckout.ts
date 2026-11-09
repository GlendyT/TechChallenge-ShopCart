import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { cartQueryKey } from "../../cart/api/cartApi";
import { submitCheckout } from "../api/checkoutApi";
import type { ConfirmCheckoutInput } from "../types/checkoutTypes";

export function useCheckout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (input: ConfirmCheckoutInput) => submitCheckout(input),
    onSuccess: async (order) => {
      await queryClient.invalidateQueries({ queryKey: cartQueryKey });
      navigate(`/pedido-confirmado/${order.CodigoPublico}`, { replace: true });
    },
  });
}
