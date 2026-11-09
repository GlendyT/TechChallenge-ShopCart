import { useState, type FormEvent } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { PageHeader } from "../../../../components/PageHeader";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import type { Category } from "../../../catalog/types/catalogTypes";
import type { InventoryFilters } from "../types/inventoryTypes";

interface InventoryHeaderFiltersProps {
  draftFilters: InventoryFilters;
  categories: Category[];
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onLowStockChange: (enabled: boolean) => void;
  onApply: (event: FormEvent<HTMLFormElement>) => void;
  onClear: () => void;
}

export function InventoryHeaderFilters({
  draftFilters,
  categories,
  hasActiveFilters,
  onSearchChange,
  onCategoryChange,
  onLowStockChange,
  onApply,
  onClear,
}: InventoryHeaderFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  function handleApply(event: FormEvent<HTMLFormElement>) {
    onApply(event);
    setIsFilterOpen(false);
  }

  function handleClear() {
    onClear();
    setIsFilterOpen(false);
  }

  return (
    <PageHeader
      titleId="inventory-title"
      eyebrow="Gestión de tienda"
      title="Inventario"
      description="Consulta existencias, revisa el kardex y registra ajustes con su motivo."
    >
      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-input px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
        <Search aria-hidden="true" className="size-4 shrink-0 text-dn-gris" />
        <Input
          className="h-9 border-0 px-0 shadow-none focus-visible:ring-0"
          aria-label="Buscar producto o SKU"
          value={draftFilters.busqueda}
          maxLength={100}
          placeholder="Nombre o SKU"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <Select
        value={draftFilters.idCategoria || "TODAS"}
        onValueChange={(value) =>
          onCategoryChange(value === "TODAS" ? "" : value)
        }
      >
        <SelectTrigger
          className="w-full sm:w-56"
          aria-label="Filtrar inventario por categoría"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TODAS">Todas las categorías</SelectItem>
          {categories.map((category) => (
            <SelectItem
              key={category.IDCategoria}
              value={String(category.IDCategoria)}
            >
              {category.Nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative self-end sm:self-auto">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Abrir filtros de inventario"
          aria-haspopup="dialog"
          aria-expanded={isFilterOpen}
          onClick={() => setIsFilterOpen((open) => !open)}
        >
          <SlidersHorizontal aria-hidden="true" />
        </Button>

        {isFilterOpen && (
          <form
            className="absolute right-0 z-20 mt-2 grid w-[min(22rem,calc(100vw-2rem))] gap-4 rounded-lg border border-dn-gris/20 bg-white p-4 shadow-lg"
            aria-label="Filtros de inventario"
            onSubmit={handleApply}
          >
            <label className="flex items-center gap-2 text-sm text-dn-gris-oscuro">
              <input
                type="checkbox"
                className="size-4 accent-dn-azul"
                checked={draftFilters.soloBajoStock}
                onChange={(event) => onLowStockChange(event.target.checked)}
              />
              Stock bajo (disponible ≤ 5)
            </label>
            <div className="flex justify-end gap-2">
              {hasActiveFilters && (
                <Button type="button" variant="outline" onClick={handleClear}>
                  <X aria-hidden="true" size={15} /> Limpiar
                </Button>
              )}
              <Button type="submit">Aplicar</Button>
            </div>
          </form>
        )}
      </div>
    </PageHeader>
  );
}
