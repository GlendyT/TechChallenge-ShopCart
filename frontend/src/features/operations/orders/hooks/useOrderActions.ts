import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelOrder, orderDetailQueryKey, ordersQueryKey, returnOrderItem, updateOrderStatus } from "../api/ordersApi";

export function useOrderActions() {
  const queryClient = useQueryClient();
  const invalidateOperations = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
    queryClient.invalidateQueries({ queryKey: ["operations", "inventory"] }),
    queryClient.invalidateQueries({ queryKey: ["operations", "reports"] }),
  ]);
  const updateStatus = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: invalidateOperations,
  });
  const cancel = useMutation({
    mutationFn: cancelOrder,
    onSuccess: invalidateOperations,
  });

  const returnItem = useMutation({
    mutationFn: returnOrderItem,
    onSuccess: (_data, input) => Promise.all([
      invalidateOperations(),
      queryClient.invalidateQueries({ queryKey: orderDetailQueryKey(input.codigoPublico) }),
    ]),
  });

  return { updateStatus, cancel, returnItem };
}
