import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import { catalogQueryKeys, fetchProducts } from "../api/catalogApi";
import type { CatalogFilters } from "../types/catalogTypes";

const MINIMUM_SEARCH_LENGTH = 2;
const SUGGESTION_STALE_TIME_MS = 30_000;

export function useCatalogSuggestions(search: string) {
  const normalizedSearch = search.trim();
  const debouncedSearch = useDebouncedValue(normalizedSearch);
  const filters: CatalogFilters = {
    search: debouncedSearch,
    category: "",
    order: "RECIENTE",
    page: 1,
    inStock: false,
    priceRange: "all",
  };
  const query = useQuery({
    queryKey: catalogQueryKeys.suggestions(debouncedSearch),
    queryFn: () => fetchProducts(filters),
    enabled: debouncedSearch.length >= MINIMUM_SEARCH_LENGTH,
    staleTime: SUGGESTION_STALE_TIME_MS,
  });

  return {
    ...query,
    isDebouncing: normalizedSearch.length >= MINIMUM_SEARCH_LENGTH &&
      normalizedSearch !== debouncedSearch,
  };
}
