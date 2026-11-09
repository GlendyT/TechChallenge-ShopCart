import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import type { CatalogFilters, CatalogSortOrder, PriceRange } from "../types/catalogTypes";

export const priceRanges: Array<{ value: PriceRange; label: string }> = [
  { value: "all", label: "Cualquier precio" },
  { value: "under-200", label: "Menos de Q200" },
  { value: "200-400", label: "Q200 – Q400" },
  { value: "over-400", label: "Más de Q400" },
];

export function useCatalogFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get("categoria") ?? "";

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchInput = useDebouncedValue(searchInput);
  const [order, setOrder] = useState<CatalogSortOrder>("RECIENTE");
  const [page, setPage] = useState(1);
  const [inStock, setInStock] = useState(false);
  const [priceRange, setPriceRange] = useState<PriceRange>("all");

  // search is always derived from the debounced input — no separate state needed
  const search = debouncedSearchInput.trim();
  const categoryState = urlCategory;

  function handleSearchInput(value: string) {
    setSearchInput(value);
    setPage(1);
  }

  function setCategory(value: string) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set("categoria", value);
      else next.delete("categoria");
      return next;
    }, { replace: true });
    setPage(1);
  }

  const filters = useMemo<CatalogFilters>(
    () => ({ search, category: categoryState, order, page, inStock, priceRange }),
    [categoryState, inStock, order, page, priceRange, search],
  );

  function clearFilters() {
    setSearchInput("");
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("busqueda");
      next.delete("categoria");
      return next;
    }, { replace: true });
    setInStock(false);
    setPriceRange("all");
    setOrder("RECIENTE");
    setPage(1);
  }

  return {
    filters,
    searchInput,
    setSearchInput: handleSearchInput,
    category: categoryState,
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
