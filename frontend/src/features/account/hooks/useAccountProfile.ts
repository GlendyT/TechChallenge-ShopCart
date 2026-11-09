import { useQuery } from "@tanstack/react-query";
import { fetchAccountProfile } from "../api/accountApi";

export const accountProfileQueryKey = ["account", "profile"] as const;
export function useAccountProfile(userId: number | null) {
  return useQuery({
    queryKey: [...accountProfileQueryKey, userId],
    queryFn: fetchAccountProfile,
    enabled: userId !== null,
    retry: false,
  });
}
