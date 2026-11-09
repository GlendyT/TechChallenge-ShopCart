import { useQuery } from "@tanstack/react-query";
import type { CatalogFilters } from "../types/catalogTypes";
import { catalogQueryKeys, fetchProducts } from "../api/catalogApi";

export function useCatalogProducts(filters: CatalogFilters) {
  return useQuery({
    queryKey: catalogQueryKeys.products(filters),
    queryFn: () => fetchProducts(filters),
    placeholderData: (previous) => previous,
  });
}
