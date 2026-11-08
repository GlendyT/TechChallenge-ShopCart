import { useEffect, useMemo, useState } from "react";
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
  const urlSearch = searchParams.get("busqueda") ?? "";
  const urlCategory = searchParams.get("categoria") ?? "";
  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearchInput = useDebouncedValue(searchInput);
  const [search, setSearch] = useState(urlSearch.trim());
  const [categoryState, setCategoryState] = useState(urlCategory);
  const [order, setOrder] = useState<CatalogSortOrder>("RECIENTE");
  const [page, setPage] = useState(1);
  const [inStock, setInStock] = useState(false);
  const [priceRange, setPriceRange] = useState<PriceRange>("all");

  useEffect(() => {
    if (debouncedSearchInput !== searchInput) return;
    setSearch(debouncedSearchInput.trim());
    setPage(1);
  }, [debouncedSearchInput, searchInput]);

  useEffect(() => {
    setSearchInput(urlSearch);
    setSearch(urlSearch.trim());
    setCategoryState(urlCategory);
    setPage(1);
  }, [urlCategory, urlSearch]);

  function setCategory(value: string) {
    setCategoryState(value);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set("categoria", value);
      else next.delete("categoria");
      return next;
    }, { replace: true });
  }

  const filters = useMemo<CatalogFilters>(
    () => ({ search, category: categoryState, order, page, inStock, priceRange }),
    [categoryState, inStock, order, page, priceRange, search],
  );

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setCategoryState("");
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
    setSearchInput,
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
