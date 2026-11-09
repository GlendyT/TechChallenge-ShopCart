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
import type { OrderFilters, OrderStatus } from "../types/orderTypes";
import { orderStatusLabels } from "../constants/orderStatusLabels";

const orderStatuses = Object.keys(orderStatusLabels) as OrderStatus[];

interface OrdersHeaderFiltersProps {
  draftFilters: OrderFilters;
  hasAppliedStatusOrDateFilter: boolean;
  dateError: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: OrderStatus | "") => void;
  onDateStartChange: (value: string) => void;
  onDateEndChange: (value: string) => void;
  onApply: (event: FormEvent<HTMLFormElement>) => boolean;
  onClear: () => void;
}

export function OrdersHeaderFilters({
  draftFilters,
  hasAppliedStatusOrDateFilter,
  dateError,
  onSearchChange,
  onStatusChange,
  onDateStartChange,
  onDateEndChange,
  onApply,
  onClear,
}: OrdersHeaderFiltersProps) {
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

  function handleApply(event: FormEvent<HTMLFormElement>) {
    if (onApply(event)) setIsDateFilterOpen(false);
  }

  function handleClear() {
    onClear();
    setIsDateFilterOpen(false);
  }

  return (
    <PageHeader
      className=""
      eyebrow="Gestión de tienda"
      title="Pedidos"
      titleId="orders-title"
      description="Revisa pedidos y avanza su estado según el flujo permitido."
    >
      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-input px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
        <Search aria-hidden="true" className="size-4 shrink-0 text-dn-gris" />
        <Input
          className="h-9 min-w-0 flex-1 border-0 px-0 shadow-none focus-visible:ring-0"
          aria-label="Buscar pedido o cliente"
          value={draftFilters.busqueda}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Número, nombre o correo"
        />
      </label>

      <Select
        value={draftFilters.estado || "TODOS"}
        onValueChange={(value) =>
          onStatusChange(value === "TODOS" ? "" : (value as OrderStatus))
        }
      >
        <SelectTrigger
          className="w-full md:w-52"
          aria-label="Filtrar pedidos por estado"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TODOS">Todos los estados</SelectItem>
          {orderStatuses.map((status) => (
            <SelectItem key={status} value={status}>
              {orderStatusLabels[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative self-end sm:self-auto">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Abrir filtros por fecha"
          aria-haspopup="dialog"
          aria-expanded={isDateFilterOpen}
          onClick={() => setIsDateFilterOpen((open) => !open)}
        >
          <SlidersHorizontal aria-hidden="true" />
        </Button>

        {isDateFilterOpen && (
          <form
            className="absolute right-0 z-20 mt-2 grid w-[min(22rem,calc(100vw-2rem))] gap-4 rounded-lg border border-dn-gris/20 bg-white p-4 shadow-lg"
            aria-label="Filtros por fecha"
            onSubmit={handleApply}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro">
                <span>Desde</span>
                <Input
                  className="h-9"
                  type="date"
                  value={draftFilters.fechaInicio}
                  onChange={(event) => onDateStartChange(event.target.value)}
                />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro">
                <span>Hasta</span>
                <Input
                  className="h-9"
                  type="date"
                  value={draftFilters.fechaFin}
                  onChange={(event) => onDateEndChange(event.target.value)}
                />
              </label>
            </div>
            {dateError && (
              <p className="text-xs text-dn-rojo" role="alert">
                {dateError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              {hasAppliedStatusOrDateFilter && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                >
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
