import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelOrder, ordersQueryKey, updateOrderStatus } from "../api/ordersApi";

export function useOrderActions() {
  const queryClient = useQueryClient();
  const invalidateOrders = () => queryClient.invalidateQueries({ queryKey: ordersQueryKey });
  const updateStatus = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: invalidateOrders,
  });
  const cancel = useMutation({
    mutationFn: cancelOrder,
    onSuccess: invalidateOrders,
  });

  return { updateStatus, cancel };
}
