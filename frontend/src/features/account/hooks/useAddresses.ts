import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createAddress, deleteAddress, fetchAddresses, updateAddress } from "../api/accountApi";
import type { AddressInput } from "../types/accountTypes";

export const addressesQueryKey = ["account", "addresses"] as const;

export function useAddresses(userId: number | null) {
  return useQuery({ queryKey: [...addressesQueryKey, userId], queryFn: fetchAddresses, enabled: userId !== null, retry: false });
}

export function useAddressMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: addressesQueryKey });
  const create = useMutation({
    mutationFn: (input: AddressInput) => createAddress(input),
    onSuccess: async () => {
      await invalidate();
      toast.success("Dirección agregada correctamente.");
    },
  });
  const update = useMutation({
    mutationFn: (input: { id: number; address: AddressInput }) =>
      updateAddress(input.id, input.address),
    onSuccess: async () => {
      await invalidate();
      toast.success("Dirección actualizada correctamente.");
    },
  });
  const remove = useMutation({
    mutationFn: deleteAddress,
    onSuccess: async () => {
      await invalidate();
      toast.success("Dirección eliminada correctamente.");
    },
  });
  return { create, update, remove };
}
