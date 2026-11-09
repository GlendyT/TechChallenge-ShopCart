import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
    onSuccess: async () => {
      await invalidateOperations();
      toast.success("Estado del pedido actualizado correctamente.");
    },
  });
  const cancel = useMutation({
    mutationFn: cancelOrder,
    onSuccess: async () => {
      await invalidateOperations();
      toast.success("Pedido cancelado correctamente.");
    },
  });

  const returnItem = useMutation({
    mutationFn: returnOrderItem,
    onSuccess: async (_data, input) => {
      await Promise.all([
        invalidateOperations(),
        queryClient.invalidateQueries({ queryKey: orderDetailQueryKey(input.codigoPublico) }),
      ]);
      toast.success("Devolución registrada correctamente.");
    },
  });

  return { updateStatus, cancel, returnItem };
}
