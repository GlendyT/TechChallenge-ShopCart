import { useEffect, useMemo, useState } from "react";
import type { CatalogFilters, CatalogSortOrder, PriceRange } from "../types/catalogTypes";

const SEARCH_DEBOUNCE_MS = 300;

export const priceRanges: Array<{ value: PriceRange; label: string }> = [
  { value: "all", label: "Cualquier precio" },
  { value: "under-200", label: "Menos de Q200" },
  { value: "200-400", label: "Q200 – Q400" },
  { value: "over-400", label: "Más de Q400" },
];

export function useCatalogFilters() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [order, setOrder] = useState<CatalogSortOrder>("RECIENTE");
  const [page, setPage] = useState(1);
  const [inStock, setInStock] = useState(false);
  const [priceRange, setPriceRange] = useState<PriceRange>("all");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const filters = useMemo<CatalogFilters>(
    () => ({ search, category, order, page, inStock, priceRange }),
    [category, inStock, order, page, priceRange, search],
  );

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setCategory("");
    setInStock(false);
    setPriceRange("all");
    setOrder("RECIENTE");
    setPage(1);
  }

  return {
    filters,
    searchInput,
    setSearchInput,
    category,
    setCategory,
    order,
    setOrder,
    page,
    setPage,
    inStock,
    setInStock,
    priceRange,
    setPriceRange,
    clearFilters,
  };
}
