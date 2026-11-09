import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { registerInventoryAdjustment, inventoryQueryKey } from "../api/inventoryApi";

export function useInventoryAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerInventoryAdjustment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryQueryKey });
      toast.success("Ajuste de inventario registrado correctamente.");
    },
  });
}
