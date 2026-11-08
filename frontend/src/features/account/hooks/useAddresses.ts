import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAddress, deleteAddress, fetchAddresses, updateAddress } from "../api/accountApi";
import type { AddressInput } from "../types/accountTypes";

export const addressesQueryKey = ["account", "addresses"] as const;

export function useAddresses(userId: number | null) {
  return useQuery({ queryKey: [...addressesQueryKey, userId], queryFn: fetchAddresses, enabled: userId !== null, retry: false });
}

export function useAddressMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: addressesQueryKey });
  const create = useMutation({ mutationFn: (input: AddressInput) => createAddress(input), onSuccess: invalidate });
  const update = useMutation({ mutationFn: (input: { id: number; address: AddressInput }) => updateAddress(input.id, input.address), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: deleteAddress, onSuccess: invalidate });
  return { create, update, remove };
}
