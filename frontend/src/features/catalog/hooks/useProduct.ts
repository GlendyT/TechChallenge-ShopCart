import { useQuery } from "@tanstack/react-query";
import { catalogQueryKeys, fetchProduct } from "../api/catalogApi";

export function useProduct(publicCode: string) {
  return useQuery({
    queryKey: catalogQueryKeys.product(publicCode),
    queryFn: () => fetchProduct(publicCode),
    enabled: Boolean(publicCode),
  });
}
