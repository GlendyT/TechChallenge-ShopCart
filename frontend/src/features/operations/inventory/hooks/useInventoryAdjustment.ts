import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerInventoryAdjustment, inventoryQueryKey } from "../api/inventoryApi";

export function useInventoryAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerInventoryAdjustment,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: inventoryQueryKey }),
  });
}
