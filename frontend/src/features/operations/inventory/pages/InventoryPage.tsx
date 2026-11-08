import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, ClipboardList, LoaderCircle, PackageSearch, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Skeleton } from "../../../../components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Textarea } from "../../../../components/ui/textarea";
import { PageState } from "../../../../components/feedback/PageState";
import { formatPrice } from "../../../../lib/format";
import { useInventory, useInventoryCategories, useInventoryMovements } from "../hooks/useInventory";
import { useInventoryAdjustment } from "../hooks/useInventoryAdjustment";
import type { InventoryFilters, InventoryMovement, InventoryVariant } from "../types/inventoryTypes";

const EMPTY_FILTERS: InventoryFilters = { busqueda: "", idCategoria: "", soloBajoStock: false };
const MOVEMENT_LABELS: Record<string, string> = {
  AJUSTE_POSITIVO: "Ajuste positivo", AJUSTE_NEGATIVO: "Ajuste negativo", ENTRADA_COMPRA: "Entrada por compra", SALIDA_VENTA: "Salida por venta",
  DEVOLUCION_REINTEGRO: "Reintegro por devolución", CANCELACION_REINTEGRO: "Reintegro por cancelación",
};
const MOVEMENT_TYPES = Object.keys(MOVEMENT_LABELS);

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function InventoryPage() {
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<InventoryVariant | null>(null);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"POSITIVO" | "NEGATIVO">("POSITIVO");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");
  const [movementPage, setMovementPage] = useState(1);
  const [movementType, setMovementType] = useState("");
  const [movementFrom, setMovementFrom] = useState("");
  const [movementTo, setMovementTo] = useState("");
  const inventory = useInventory(filters, page);
  const categories = useInventoryCategories();
  const movementFilters = { tipoMovimiento: movementType, fechaInicio: movementFrom, fechaFin: movementTo };
  const movements = useInventoryMovements(selectedVariant?.IDVariante ?? null, movementPage, movementFilters);
  const adjustment = useInventoryAdjustment();
  const rows = inventory.data?.datos ?? [];
  const selectedMovements = movements.data?.datos ?? [];

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
    if (adjustmentType === "NEGATIVO" && amount > selectedVariant.ExistenciaFisica) {
      setFormError(`La existencia física actual es ${selectedVariant.ExistenciaFisica}; el ajuste no puede dejarla por debajo de cero.`);
      return;
    }
    setFormError("");
    try {
      await adjustment.mutateAsync({ idVariante: selectedVariant.IDVariante, tipoAjuste: adjustmentType, cantidad: amount, motivo: reason.trim() });
      setAdjustmentOpen(false);
      setSelectedVariant(null);
      setPage(1);
    } catch {
      // Se muestra el error retornado por la API en el diálogo.
    }
  }

  return (
    <section className="mx-auto max-w-7xl" aria-labelledby="inventory-title">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-dn-rojo">Gestión de tienda</p>
      <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 id="inventory-title" className="text-3xl font-semibold tracking-tight text-dn-gris-oscuro sm:text-4xl">Inventario</h1>
          <p className="mt-2 text-sm text-dn-gris">Consulta existencias, revisa el kardex y registra ajustes con su motivo.</p>
        </div>
        {inventory.data && <span className="text-sm text-dn-gris/80">{inventory.data.totalRegistros} variantes</span>}
      </div>

      <form onSubmit={applyFilters} className="mt-6 grid gap-3 rounded-lg border border-dn-gris/20 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.5fr)_minmax(180px,1fr)_auto_auto] lg:items-end">
        <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro">
          <span>Buscar producto o SKU</span>
          <span className="flex h-9 items-center gap-2 rounded-md border border-input px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30"><Search aria-hidden="true" className="size-4 text-dn-gris" /><Input className="h-full border-0 px-0 shadow-none focus-visible:ring-0" value={draftFilters.busqueda} maxLength={100} placeholder="Nombre o SKU" onChange={(event) => setDraftFilters((current) => ({ ...current, busqueda: event.target.value }))} /></span>
        </label>
        <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro"><span>Categoría</span>
          <Select value={draftFilters.idCategoria || "TODAS"} onValueChange={(value) => setDraftFilters((current) => ({ ...current, idCategoria: value === "TODAS" ? "" : value }))}>
            <SelectTrigger className="w-full" aria-label="Filtrar inventario por categoría"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="TODAS">Todas las categorías</SelectItem>{(categories.data ?? []).map((category) => <SelectItem key={category.IDCategoria} value={String(category.IDCategoria)}>{category.Nombre}</SelectItem>)}</SelectContent>
          </Select>
        </label>
        <label className="flex h-9 items-center gap-2 text-sm text-dn-gris-oscuro"><input type="checkbox" className="size-4 accent-dn-azul" checked={draftFilters.soloBajoStock} onChange={(event) => setDraftFilters((current) => ({ ...current, soloBajoStock: event.target.checked }))} />Stock bajo (disponible ≤ 5)</label>
        <div className="flex gap-2"><Button className="flex-1" type="submit">Aplicar</Button><Button className="flex-1" type="button" variant="outline" onClick={clearFilters}><X aria-hidden="true" size={15} /> Limpiar</Button></div>
      </form>

      <div className="mt-5 overflow-hidden rounded-lg border border-dn-gris/20 bg-white">
        {inventory.isPending ? <div className="space-y-3 p-4" role="status" aria-label="Cargando inventario">{Array.from({ length: 5 }, (_, index) => <Skeleton className="h-12 w-full" key={index} aria-hidden="true" />)}</div>
          : inventory.isError ? <PageState icon={RefreshCw} title="No pudimos cargar el inventario" description={inventory.error.message} tone="error" action={<Button variant="outline" onClick={() => void inventory.refetch()}>Intentar de nuevo</Button>} />
          : rows.length === 0 ? <PageState icon={PackageSearch} title="No hay existencias para mostrar" description="Prueba con otros filtros o revisa de nuevo más tarde." action={filters.busqueda || filters.idCategoria || filters.soloBajoStock ? <Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button> : undefined} />
          : <>
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Producto / variante</TableHead><TableHead>SKU</TableHead><TableHead className="text-right">Física</TableHead><TableHead className="text-right">Reservada</TableHead><TableHead className="text-right">Disponible</TableHead><TableHead className="text-right">Precio</TableHead><TableHead><span className="sr-only">Acciones</span></TableHead></TableRow></TableHeader>
              <TableBody>{rows.map((variant) => <TableRow key={variant.IDVariante}>
                <TableCell><strong className="block text-sm text-dn-gris-oscuro">{variant.NombreProducto}</strong><span className="mt-1 block text-xs text-dn-gris/80">{[variant.NombreVariante, variant.Talla, variant.Color].filter(Boolean).join(" · ")}</span></TableCell>
                <TableCell className="whitespace-nowrap text-xs text-dn-gris">{variant.SKU}</TableCell>
                <TableCell className="text-right tabular-nums">{variant.ExistenciaFisica}</TableCell><TableCell className="text-right tabular-nums">{variant.UnidadesReservadas}</TableCell>
                <TableCell className="text-right"><Badge variant="outline" className={variant.ExistenciaDisponible <= 5 ? "border-dn-rojo/25 bg-dn-rojo/5 text-dn-rojo" : "border-dn-azul/25 bg-dn-azul/5 text-dn-azul"}>{variant.ExistenciaDisponible}</Badge></TableCell>
                <TableCell className="whitespace-nowrap text-right text-sm">{formatPrice(variant.Precio)}</TableCell>
                <TableCell><div className="flex justify-end gap-2"><Button size="sm" variant="outline" type="button" onClick={() => openMovements(variant)}><ClipboardList aria-hidden="true" size={14} /> Kardex</Button><Button size="sm" type="button" onClick={() => openAdjustment(variant)}><SlidersHorizontal aria-hidden="true" size={14} /> Ajustar</Button></div></TableCell>
              </TableRow>)}</TableBody>
            </Table></div>
            <div className="flex items-center justify-between gap-3 border-t border-dn-gris/20 px-4 py-3 text-sm text-dn-gris/80"><span>Página {inventory.data?.paginaActual ?? page} de {inventory.data?.totalPaginas ?? 1} · {inventory.data?.totalRegistros ?? 0} variantes</span><div className="flex gap-2"><Button variant="outline" size="icon" type="button" aria-label="Página anterior" disabled={page <= 1 || inventory.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}><ArrowLeft aria-hidden="true" /></Button><Button variant="outline" size="icon" type="button" aria-label="Página siguiente" disabled={page >= (inventory.data?.totalPaginas ?? 1) || inventory.isFetching} onClick={() => setPage((current) => current + 1)}><ArrowRight aria-hidden="true" /></Button></div></div>
          </>}
      </div>

      <Dialog open={Boolean(selectedVariant) && !adjustmentOpen} onOpenChange={(open) => { if (!open) setSelectedVariant(null); }}>
        <DialogContent className="max-w-5xl">
          <DialogHeader><DialogTitle>Kardex de inventario</DialogTitle><DialogDescription>{selectedVariant?.NombreProducto} · {selectedVariant?.SKU}</DialogDescription></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro"><span>Tipo de movimiento</span><Select value={movementType || "TODOS"} onValueChange={(value) => { setMovementType(value === "TODOS" ? "" : value); setMovementPage(1); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos</SelectItem>{MOVEMENT_TYPES.map((type) => <SelectItem key={type} value={type}>{MOVEMENT_LABELS[type]}</SelectItem>)}</SelectContent></Select></label>
            <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro"><span>Desde</span><Input type="date" value={movementFrom} onChange={(event) => setMovementFrom(event.target.value)} /></label>
            <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro"><span>Hasta</span><Input type="date" value={movementTo} onChange={(event) => setMovementTo(event.target.value)} /></label>
          </div>
          {movements.isPending ? <Skeleton className="h-52 w-full" /> : movements.isError ? <p role="alert" className="text-sm text-dn-rojo">{movements.error.message}</p> : selectedMovements.length === 0 ? <PageState icon={PackageSearch} title="Sin movimientos" description="No hay movimientos de inventario para esta variante." /> : <div className="max-h-[55vh] overflow-auto rounded-md border border-dn-gris/20"><Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Movimiento</TableHead><TableHead className="text-right">Cantidad</TableHead><TableHead className="text-right">Anterior</TableHead><TableHead className="text-right">Nueva</TableHead><TableHead>Usuario / motivo</TableHead></TableRow></TableHeader><TableBody>{selectedMovements.map((movement: InventoryMovement) => <TableRow key={movement.IDKardex}><TableCell className="whitespace-nowrap text-xs">{formatDate(movement.Fecha)}</TableCell><TableCell>{MOVEMENT_LABELS[movement.TipoMovimiento] ?? movement.TipoMovimiento}</TableCell><TableCell className="text-right tabular-nums">{movement.Cantidad}</TableCell><TableCell className="text-right tabular-nums">{movement.ExistenciaAnterior}</TableCell><TableCell className="text-right tabular-nums">{movement.ExistenciaNueva}</TableCell><TableCell><span className="block text-xs">{movement.NombreUsuario}</span><span className="mt-1 block max-w-56 text-xs text-dn-gris/80">{movement.Motivo ?? "—"}</span></TableCell></TableRow>)}</TableBody></Table></div>}
          <div className="flex items-center justify-between text-sm text-dn-gris/80"><span>Página {movements.data?.paginaActual ?? movementPage} de {movements.data?.totalPaginas ?? 1} · {movements.data?.totalRegistros ?? 0} movimientos</span><div className="flex gap-2"><Button variant="outline" size="icon" aria-label="Página anterior del kardex" disabled={movementPage <= 1 || movements.isFetching} onClick={() => setMovementPage((current) => Math.max(1, current - 1))}><ArrowLeft /></Button><Button variant="outline" size="icon" aria-label="Página siguiente del kardex" disabled={movementPage >= (movements.data?.totalPaginas ?? 1) || movements.isFetching} onClick={() => setMovementPage((current) => current + 1)}><ArrowRight /></Button></div></div>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustmentOpen} onOpenChange={(open) => { if (!open && !adjustment.isPending) { setAdjustmentOpen(false); setSelectedVariant(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajuste manual</DialogTitle><DialogDescription>{selectedVariant?.NombreProducto} · {selectedVariant?.SKU}. La existencia física actual es {selectedVariant?.ExistenciaFisica}.</DialogDescription></DialogHeader>
          <form onSubmit={(event) => void submitAdjustment(event)} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="adjustment-type">Tipo de ajuste</Label><Select value={adjustmentType} onValueChange={(value) => setAdjustmentType(value as "POSITIVO" | "NEGATIVO")}><SelectTrigger id="adjustment-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="POSITIVO">Positivo · sumar unidades</SelectItem><SelectItem value="NEGATIVO">Negativo · restar unidades</SelectItem></SelectContent></Select></div><div className="space-y-1.5"><Label htmlFor="adjustment-quantity">Cantidad</Label><Input id="adjustment-quantity" type="number" min="1" step="1" max={adjustmentType === "NEGATIVO" ? selectedVariant?.ExistenciaFisica : undefined} value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></div></div>
            <div className="space-y-1.5"><Label htmlFor="adjustment-reason">Motivo</Label><Textarea id="adjustment-reason" value={reason} maxLength={255} onChange={(event) => setReason(event.target.value)} required aria-describedby="adjustment-reason-help" /><p id="adjustment-reason-help" className="text-xs text-dn-gris/80">Entre 5 y 255 caracteres ({reason.trim().length}/255).</p></div>
            {(formError || adjustment.error) && <p role="alert" className="text-sm text-dn-rojo">{formError || adjustment.error?.message}</p>}
            <DialogFooter><Button variant="outline" type="button" disabled={adjustment.isPending} onClick={() => { setAdjustmentOpen(false); setSelectedVariant(null); }}>Volver</Button><Button type="submit" disabled={adjustment.isPending || reason.trim().length < 5 || !quantity}>{adjustment.isPending && <LoaderCircle aria-hidden="true" className="animate-spin" size={15} />}Registrar ajuste</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
