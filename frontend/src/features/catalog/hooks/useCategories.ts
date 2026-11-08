import { useQuery } from "@tanstack/react-query";
import { catalogQueryKeys, fetchCategories } from "../api/catalogApi";

export function useCategories() {
  return useQuery({
    queryKey: catalogQueryKeys.categories,
    queryFn: fetchCategories,
    staleTime: 5 * 60_000,
  });
}
