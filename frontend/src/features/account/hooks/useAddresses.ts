import { useQuery } from "@tanstack/react-query";
import { fetchAddresses } from "../api/accountApi";

export const addressesQueryKey = ["account", "addresses"] as const;

export function useAddresses() {
  return useQuery({ queryKey: addressesQueryKey, queryFn: fetchAddresses, retry: false });
}
