import { useState, type FormEvent } from "react";
import {
  ClipboardList,
  LoaderCircle,
  PackageSearch,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { FormSheet } from "../../../../components/forms/FormSheet";
import { DataTable } from "../../../../components/tables/DataTable";
import type { DataTableColumn } from "../../../../components/tables/DataTable";
import { TablePagination } from "../../../../components/tables/TablePagination";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Skeleton } from "../../../../components/ui/skeleton";
import { Textarea } from "../../../../components/ui/textarea";
import { PageState } from "../../../../components/feedback/PageState";
import { formatPrice } from "../../../../lib/format";
import { useDebouncedValue } from "../../../../shared/hooks/useDebouncedValue";
import { InventoryHeaderFilters } from "../components/InventoryHeaderFilters";
import {
  useInventory,
  useInventoryCategories,
  useInventoryMovements,
} from "../hooks/useInventory";
import { useInventoryAdjustment } from "../hooks/useInventoryAdjustment";
import type {
  InventoryFilters,
  InventoryMovement,
  InventoryVariant,
} from "../types/inventoryTypes";

const EMPTY_FILTERS: InventoryFilters = {
  busqueda: "",
  idCategoria: "",
  soloBajoStock: false,
};
const MOVEMENT_LABELS: Record<string, string> = {
  AJUSTE_POSITIVO: "Ajuste positivo",
  AJUSTE_NEGATIVO: "Ajuste negativo",
  ENTRADA_COMPRA: "Entrada por compra",
  SALIDA_VENTA: "Salida por venta",
  DEVOLUCION_REINTEGRO: "Reintegro por devolución",
  CANCELACION_REINTEGRO: "Reintegro por cancelación",
};
const MOVEMENT_TYPES = Object.keys(MOVEMENT_LABELS);

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function InventoryPage() {
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const debouncedSearch = useDebouncedValue(draftFilters.busqueda.trim());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedVariant, setSelectedVariant] =
    useState<InventoryVariant | null>(null);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"POSITIVO" | "NEGATIVO">(
    "POSITIVO",
  );
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");
  const [movementPage, setMovementPage] = useState(1);
  const [movementPageSize, setMovementPageSize] = useState(10);
  const [movementType, setMovementType] = useState("");
  const [movementFrom, setMovementFrom] = useState("");
  const [movementTo, setMovementTo] = useState("");
  const activeFilters = { ...filters, busqueda: debouncedSearch };
  const inventory = useInventory(activeFilters, page, pageSize);
  const categories = useInventoryCategories();
  const movementFilters = {
    tipoMovimiento: movementType,
    fechaInicio: movementFrom,
    fechaFin: movementTo,
  };
  const movements = useInventoryMovements(
    selectedVariant?.IDVariante ?? null,
    movementPage,
    movementFilters,
    movementPageSize,
  );
  const adjustment = useInventoryAdjustment();
  const rows = inventory.data?.datos ?? [];
  const selectedMovements = movements.data?.datos ?? [];
  const inventoryColumns: DataTableColumn<InventoryVariant>[] = [
    {
      id: "product",
      header: "Producto / variante",
      cell: (variant) => (
        <>
          <strong className="block text-sm text-dn-gris-oscuro">
            {variant.NombreProducto}
          </strong>
          <span className="mt-1 block text-xs text-dn-gris/80">
            {[variant.NombreVariante, variant.Talla, variant.Color]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </>
      ),
    },
    {
      id: "sku",
      header: "SKU",
      cellClassName: "whitespace-nowrap text-xs text-dn-gris",
      cell: (variant) => variant.SKU,
    },
    {
      id: "physical-stock",
      header: "Física",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      cell: (variant) => variant.ExistenciaFisica,
    },
    {
      id: "reserved-stock",
      header: "Reservada",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      cell: (variant) => variant.UnidadesReservadas,
    },
    {
      id: "available-stock",
      header: "Disponible",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (variant) => (
        <Badge
          variant="outline"
          className={
            variant.ExistenciaDisponible <= 5
              ? "border-dn-rojo/25 bg-dn-rojo/5 text-dn-rojo"
              : "border-dn-azul/25 bg-dn-azul/5 text-dn-azul"
          }
        >
          {variant.ExistenciaDisponible}
        </Badge>
      ),
    },
    {
      id: "price",
      header: "Precio",
      headerClassName: "text-right",
      cellClassName: "whitespace-nowrap text-right text-sm",
      cell: (variant) => formatPrice(variant.Precio),
    },
    {
      id: "actions",
      header: <span className="sr-only">Acciones</span>,
      cell: (variant) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => openMovements(variant)}
          >
            <ClipboardList aria-hidden="true" size={14} /> Kardex
          </Button>
          <Button
            size="sm"
            type="button"
            onClick={() => openAdjustment(variant)}
          >
            <SlidersHorizontal aria-hidden="true" size={14} /> Ajustar
          </Button>
        </div>
      ),
    },
  ];
  const movementColumns: DataTableColumn<InventoryMovement>[] = [
    {
      id: "date",
      header: "Fecha",
      cellClassName: "whitespace-nowrap text-xs",
      cell: (movement) => formatDate(movement.Fecha),
    },
    {
      id: "type",
      header: "Movimiento",
      cell: (movement) =>
        MOVEMENT_LABELS[movement.TipoMovimiento] ?? movement.TipoMovimiento,
    },
    {
      id: "quantity",
      header: "Cantidad",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      cell: (movement) => movement.Cantidad,
    },
    {
      id: "previous-stock",
      header: "Anterior",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      cell: (movement) => movement.ExistenciaAnterior,
    },
    {
      id: "new-stock",
      header: "Nueva",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      cell: (movement) => movement.ExistenciaNueva,
    },
    {
      id: "user-reason",
      header: "Usuario / motivo",
      cell: (movement) => (
        <>
          <span className="block text-xs">{movement.NombreUsuario}</span>
          <span className="mt-1 block max-w-56 text-xs text-dn-gris/80">
            {movement.Motivo ?? "—"}
          </span>
        </>
      ),
    },
  ];

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters({ ...draftFilters, busqueda: draftFilters.busqueda.trim() });
    setPage(1);
  }

  function clearFilters() {
    setDraftFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  function changeCategory(categoryId: string) {
    setDraftFilters((current) => ({ ...current, idCategoria: categoryId }));
    setFilters((current) => ({ ...current, idCategoria: categoryId }));
    setPage(1);
  }

  function openMovements(variant: InventoryVariant) {
    setSelectedVariant(variant);
    setMovementPage(1);
    setMovementType("");
    setMovementFrom("");
    setMovementTo("");
  }

  function openAdjustment(variant: InventoryVariant) {
    setSelectedVariant(variant);
    setAdjustmentType("POSITIVO");
    setQuantity("");
    setReason("");
    setFormError("");
    adjustment.reset();
    setAdjustmentOpen(true);
  }

  async function submitAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(quantity);
    if (!selectedVariant || !Number.isInteger(amount) || amount < 1) {
      setFormError("La cantidad debe ser un número entero mayor a cero.");
      return;
    }
    if (reason.trim().length < 5 || reason.trim().length > 255) {
      setFormError("El motivo debe tener entre 5 y 255 caracteres.");
      return;
    }
    if (
      adjustmentType === "NEGATIVO" &&
      amount > selectedVariant.ExistenciaFisica
    ) {
      setFormError(
        `La existencia física actual es ${selectedVariant.ExistenciaFisica}; el ajuste no puede dejarla por debajo de cero.`,
      );
      return;
    }
    setFormError("");
    try {
      await adjustment.mutateAsync({
        idVariante: selectedVariant.IDVariante,
        tipoAjuste: adjustmentType,
        cantidad: amount,
        motivo: reason.trim(),
      });
      setAdjustmentOpen(false);
      setSelectedVariant(null);
      setPage(1);
    } catch {
      // Se muestra el error retornado por la API en el diálogo.
    }
  }

  return (
    <section className="" aria-labelledby="inventory-title">
      <InventoryHeaderFilters
        draftFilters={draftFilters}
        categories={categories.data ?? []}
        hasActiveFilters={Boolean(
          debouncedSearch ||
          activeFilters.idCategoria ||
          activeFilters.soloBajoStock,
        )}
        onSearchChange={(busqueda) => {
          setDraftFilters((current) => ({ ...current, busqueda }));
          setPage(1);
        }}
        onCategoryChange={changeCategory}
        onLowStockChange={(soloBajoStock) =>
          setDraftFilters((current) => ({ ...current, soloBajoStock }))
        }
        onApply={applyFilters}
        onClear={clearFilters}
      />

      <div className="mt-5 flex h-[min(65vh,48rem)] min-h-[20rem] flex-col overflow-hidden rounded-lg border border-dn-gris/20 bg-white">
        {inventory.isPending ? (
          <div
            className="space-y-3 p-4"
            role="status"
            aria-label="Cargando inventario"
          >
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton
                className="h-12 w-full"
                key={index}
                aria-hidden="true"
              />
            ))}
          </div>
        ) : inventory.isError ? (
          <PageState
            icon={RefreshCw}
            title="No pudimos cargar el inventario"
            description={inventory.error.message}
            tone="error"
            action={
              <Button
                variant="outline"
                onClick={() => void inventory.refetch()}
              >
                Intentar de nuevo
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <PageState
            icon={PackageSearch}
            title="No hay existencias para mostrar"
            description="Prueba con otros filtros o revisa de nuevo más tarde."
            action={
              activeFilters.busqueda ||
              activeFilters.idCategoria ||
              activeFilters.soloBajoStock ? (
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <DataTable
              ariaLabel="Existencias de inventario"
              columns={inventoryColumns}
              data={rows}
              getRowId={(variant) => variant.IDVariante}
              containerClassName="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            />
            <TablePagination
              currentPage={inventory.data?.paginaActual ?? page}
              totalPages={inventory.data?.totalPaginas ?? 1}
              totalItems={inventory.data?.totalRegistros ?? 0}
              pageSize={pageSize}
              itemLabel="variantes"
              isLoading={inventory.isFetching}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      <FormSheet
        open={Boolean(selectedVariant) && !adjustmentOpen}
        title="Kardex de inventario"
        description={`${selectedVariant?.NombreProducto ?? ""} · ${selectedVariant?.SKU ?? ""}`}
        className=""
        bodyClassName="space-y-4"
        footer={
          selectedMovements.length > 0 && movements.data ? (
            <TablePagination
              currentPage={movements.data.paginaActual ?? movementPage}
              totalPages={movements.data.totalPaginas ?? 1}
              totalItems={movements.data.totalRegistros ?? 0}
              pageSize={movementPageSize}
              itemLabel="movimientos"
              isLoading={movements.isFetching}
              onPageChange={setMovementPage}
              onPageSizeChange={(size) => {
                setMovementPageSize(size);
                setMovementPage(1);
              }}
              className="mt-0 border-0 bg-transparent p-0"
            />
          ) : undefined
        }
        onOpenChange={(open) => {
          if (!open) setSelectedVariant(null);
        }}
      >
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro">
              <span>Desde</span>
              <Input
                type="date"
                value={movementFrom}
                onChange={(event) => setMovementFrom(event.target.value)}
              />
            </label>
            <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro">
              <span>Hasta</span>
              <Input
                type="date"
                value={movementTo}
                onChange={(event) => setMovementTo(event.target.value)}
              />
            </label>
          </div>
          <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro">
            <span>Tipo de movimiento</span>
            <Select
              value={movementType || "TODOS"}
              onValueChange={(value) => {
                setMovementType(value === "TODOS" ? "" : value);
                setMovementPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                {MOVEMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {MOVEMENT_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
        {movements.isPending ? (
          <Skeleton className="h-52 w-full" />
        ) : movements.isError ? (
          <p role="alert" className="text-sm text-dn-rojo">
            {movements.error.message}
          </p>
        ) : selectedMovements.length === 0 ? (
          <PageState
            icon={PackageSearch}
            title="Sin movimientos"
            description="No hay movimientos de inventario para esta variante."
          />
        ) : (
          <DataTable
            ariaLabel="Movimientos de inventario"
            columns={movementColumns}
            data={selectedMovements}
            getRowId={(movement) => movement.IDKardex}
            containerClassName="max-h-[55vh] overflow-y-auto rounded-md border border-dn-gris/20"
          />
        )}
      </FormSheet>

      <FormSheet
        open={adjustmentOpen}
        title="Ajuste manual"
        description={`${selectedVariant?.NombreProducto ?? ""} · ${selectedVariant?.SKU ?? ""}. La existencia física actual es ${selectedVariant?.ExistenciaFisica ?? ""}.`}
        bodyClassName="space-y-4"
        footer={
          <>
            <Button
              variant="outline"
              type="button"
              disabled={adjustment.isPending}
              onClick={() => {
                setAdjustmentOpen(false);
                setSelectedVariant(null);
              }}
            >
              Volver
            </Button>
            <Button
              type="submit"
              form="inventory-adjustment-form"
              disabled={
                adjustment.isPending || reason.trim().length < 5 || !quantity
              }
            >
              {adjustment.isPending && (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin"
                  size={15}
                />
              )}
              Registrar ajuste
            </Button>
          </>
        }
        onOpenChange={(open) => {
          if (!open && !adjustment.isPending) {
            setAdjustmentOpen(false);
            setSelectedVariant(null);
          }
        }}
      >
        <form
          id="inventory-adjustment-form"
          onSubmit={(event) => void submitAdjustment(event)}
          className="space-y-4"
        >
          <div className="flex flex-col gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="adjustment-type">Tipo de ajuste</Label>
              <Select
                value={adjustmentType}
                onValueChange={(value) =>
                  setAdjustmentType(value as "POSITIVO" | "NEGATIVO")
                }
              >
                <SelectTrigger id="adjustment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POSITIVO">
                    Positivo · sumar unidades
                  </SelectItem>
                  <SelectItem value="NEGATIVO">
                    Negativo · restar unidades
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adjustment-quantity">Cantidad</Label>
              <Input
                id="adjustment-quantity"
                type="number"
                min="1"
                step="1"
                max={
                  adjustmentType === "NEGATIVO"
                    ? selectedVariant?.ExistenciaFisica
                    : undefined
                }
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adjustment-reason">Motivo</Label>
            <Textarea
              id="adjustment-reason"
              value={reason}
              maxLength={255}
              onChange={(event) => setReason(event.target.value)}
              required
              aria-describedby="adjustment-reason-help"
            />
            <p id="adjustment-reason-help" className="text-xs text-dn-gris/80">
              Entre 5 y 255 caracteres ({reason.trim().length}/255).
            </p>
          </div>
          {(formError || adjustment.error) && (
            <p role="alert" className="text-sm text-dn-rojo">
              {formError || adjustment.error?.message}
            </p>
          )}
        </form>
      </FormSheet>
    </section>
  );
}
