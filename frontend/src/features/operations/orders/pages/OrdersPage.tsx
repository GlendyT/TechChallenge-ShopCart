import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, LoaderCircle, PackageSearch, RefreshCw, RotateCcw, Search, X } from "lucide-react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { Input } from "../../../../components/ui/input";
import { Skeleton } from "../../../../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Textarea } from "../../../../components/ui/textarea";
import { PageState } from "../../../../components/feedback/PageState";
import { formatPrice } from "../../../../lib/format";
import { useOrderActions } from "../hooks/useOrderActions";
import { useOrders } from "../hooks/useOrders";
import { useOrderDetail } from "../hooks/useOrderDetail";
import type { OrderFilters, OrderStatus, OperationsOrder, OrderDetailLine, UpdateOrderStatusInput } from "../types/orderTypes";

const initialFilters: OrderFilters = {
  estado: "",
  fechaInicio: "",
  fechaFin: "",
  busqueda: "",
};

const statusLabels: Record<OrderStatus, string> = {
  PAGADO: "Pagado",
  EN_PREPARACION: "En preparación",
  DESPACHADO: "Despachado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
  DEVUELTO_PARCIAL: "Devolución parcial",
  DEVUELTO_TOTAL: "Devolución total",
};

const statusStyles: Record<OrderStatus, string> = {
  PAGADO: "border-dn-azul/25 bg-dn-azul/5 text-dn-azul",
  EN_PREPARACION: "border-dn-azul/25 bg-dn-azul/5 text-dn-azul",
  DESPACHADO: "border-dn-gris/30 bg-dn-gris/5 text-dn-gris-oscuro",
  ENTREGADO: "border-dn-gris/30 bg-dn-gris/5 text-dn-gris-oscuro",
  CANCELADO: "border-dn-rojo/25 bg-dn-rojo/5 text-dn-rojo",
  DEVUELTO_PARCIAL: "border-dn-rojo/25 bg-dn-rojo/5 text-dn-rojo",
  DEVUELTO_TOTAL: "border-dn-rojo/25 bg-dn-rojo/5 text-dn-rojo",
};

const nextStatus: Partial<Record<OrderStatus, UpdateOrderStatusInput["estadoNuevo"]>> = {
  PAGADO: "EN_PREPARACION",
  EN_PREPARACION: "DESPACHADO",
  DESPACHADO: "ENTREGADO",
};

const nextStatusLabels: Record<UpdateOrderStatusInput["estadoNuevo"], string> = {
  EN_PREPARACION: "Iniciar preparación",
  DESPACHADO: "Marcar despachado",
  ENTREGADO: "Marcar entregado",
};

const orderStatuses: OrderStatus[] = [
  "PAGADO",
  "EN_PREPARACION",
  "DESPACHADO",
  "ENTREGADO",
  "CANCELADO",
  "DEVUELTO_PARCIAL",
  "DEVUELTO_TOTAL",
];

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function OrdersPage() {
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [dateError, setDateError] = useState("");
  const [cancelTarget, setCancelTarget] = useState<OperationsOrder | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [returnTarget, setReturnTarget] = useState<OperationsOrder | null>(null);
  const [returnLineId, setReturnLineId] = useState("");
  const [returnQuantity, setReturnQuantity] = useState("1");
  const [returnReason, setReturnReason] = useState("");
  const [returnFormError, setReturnFormError] = useState("");
  const orders = useOrders(filters, page);
  const orderDetail = useOrderDetail(returnTarget?.CodigoPublico ?? null);
  const actions = useOrderActions();
  const isMutating = actions.updateStatus.isPending || actions.cancel.isPending || actions.returnItem.isPending;

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draftFilters.fechaInicio && draftFilters.fechaFin && draftFilters.fechaInicio > draftFilters.fechaFin) {
      setDateError("La fecha inicial debe ser anterior o igual a la fecha final.");
      return;
    }
    setDateError("");
    setFilters({ ...draftFilters, busqueda: draftFilters.busqueda.trim() });
    setPage(1);
  }

  function clearFilters() {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
    setDateError("");
    setPage(1);
  }

  async function advanceOrder(order: OperationsOrder, estadoNuevo: UpdateOrderStatusInput["estadoNuevo"]) {
    try {
      await actions.updateStatus.mutateAsync({ idPedido: order.IDPedido, estadoNuevo });
      setPage(1);
    } catch {
      // The mutation error is rendered above the results.
    }
  }

  async function confirmCancellation() {
    if (!cancelTarget || cancelReason.trim().length < 5) return;
    try {
      await actions.cancel.mutateAsync({ idPedido: cancelTarget.IDPedido, motivo: cancelReason.trim() });
      setCancelTarget(null);
      setCancelReason("");
      setPage(1);
    } catch {
      // Keep the dialog open so the operator can read the API error.
    }
  }

  async function confirmReturn() {
    const detail = orderDetail.data;
    const line = detail?.detalles.find((item) => item.IDPedidoDetalle === Number(returnLineId));
    const amount = Number(returnQuantity);
    if (!returnTarget || !line || !Number.isInteger(amount) || amount < 1 || amount > line.CantidadEfectiva || returnReason.trim().length < 5 || returnReason.trim().length > 255) {
      setReturnFormError("Selecciona una línea disponible, indica una cantidad válida y escribe un motivo de 5 a 255 caracteres.");
      return;
    }
    setReturnFormError("");
    try {
      await actions.returnItem.mutateAsync({ idPedido: returnTarget.IDPedido, codigoPublico: returnTarget.CodigoPublico, idPedidoDetalle: line.IDPedidoDetalle, cantidadADevolver: amount, motivo: returnReason.trim() });
      setReturnTarget(null); setReturnLineId(""); setReturnQuantity("1"); setReturnReason(""); setPage(1);
    } catch {
      // Conserva el diálogo y muestra el error de la API.
    }
  }

  const result = orders.data;
  const orderRows = result?.datos ?? [];
  const totalPages = result?.totalPaginas ?? 1;
  const mutationError = actions.updateStatus.error ?? actions.cancel.error;

  return (
    <section className="mx-auto max-w-7xl" aria-labelledby="orders-title">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-dn-rojo">Gestión de tienda</p>
      <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 id="orders-title" className="text-3xl font-semibold tracking-tight text-dn-gris-oscuro sm:text-4xl">Pedidos</h1>
          <p className="mt-2 text-sm text-dn-gris">Revisa pedidos y avanza su estado según el flujo permitido.</p>
        </div>
        {result && <span className="text-sm text-dn-gris/80">{result.totalRegistros} pedidos</span>}
      </div>

      <form className="mt-6 grid gap-3 rounded-lg border border-dn-gris/20 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.5fr)_minmax(170px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)_auto] lg:items-end" onSubmit={applyFilters}>
        <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro">
          <span>Buscar pedido o cliente</span>
          <span className="flex h-9 items-center gap-2 rounded-md border border-input px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
            <Search aria-hidden="true" className="size-4 text-dn-gris" />
            <Input className="h-full border-0 px-0 shadow-none focus-visible:ring-0" value={draftFilters.busqueda} onChange={(event) => setDraftFilters((current) => ({ ...current, busqueda: event.target.value }))} placeholder="Número, nombre o correo" />
          </span>
        </label>
        <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro">
          <span>Estado</span>
          <Select value={draftFilters.estado || "TODOS"} onValueChange={(value) => setDraftFilters((current) => ({ ...current, estado: value === "TODOS" ? "" : value as OrderStatus }))}>
            <SelectTrigger className="w-full" aria-label="Filtrar pedidos por estado"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              {orderStatuses.map((status) => <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>)}
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro">
          <span>Desde</span>
          <Input className="h-9" type="date" value={draftFilters.fechaInicio} onChange={(event) => setDraftFilters((current) => ({ ...current, fechaInicio: event.target.value }))} />
        </label>
        <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro">
          <span>Hasta</span>
          <Input className="h-9" type="date" value={draftFilters.fechaFin} onChange={(event) => setDraftFilters((current) => ({ ...current, fechaFin: event.target.value }))} />
        </label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
          <Button className="flex-1" type="submit">Aplicar</Button>
          <Button className="flex-1" type="button" variant="outline" onClick={clearFilters}><X aria-hidden="true" size={15} /> Limpiar</Button>
        </div>
        {dateError && <p className="text-xs text-dn-rojo sm:col-span-2 lg:col-span-5" role="alert">{dateError}</p>}
      </form>

      {mutationError && <p className="mt-4 rounded-md border border-dn-rojo/25 bg-dn-rojo/5 p-3 text-sm text-dn-rojo" role="alert">{mutationError.message}</p>}

      <div className="mt-5 overflow-hidden rounded-lg border border-dn-gris/20 bg-white">
        {orders.isPending ? (
          <div className="space-y-3 p-4" role="status" aria-label="Cargando pedidos">
            {Array.from({ length: 5 }, (_, index) => <Skeleton className="h-12 w-full" key={index} aria-hidden="true" />)}
          </div>
        ) : orders.isError ? (
          <PageState icon={RefreshCw} title="No pudimos cargar los pedidos" description={orders.error.message} tone="error" action={<Button variant="outline" onClick={() => void orders.refetch()}>Intentar de nuevo</Button>} />
        ) : orderRows.length === 0 ? (
          <PageState icon={PackageSearch} title="No hay pedidos para mostrar" description={filters.estado || filters.busqueda || filters.fechaInicio || filters.fechaFin ? "Prueba con otros filtros para encontrar pedidos." : "Cuando se registren pedidos, aparecerán en esta lista."} action={filters.estado || filters.busqueda || filters.fechaInicio || filters.fechaFin ? <Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button> : undefined} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead><span className="sr-only">Acciones</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderRows.map((order) => {
                    const next = nextStatus[order.Estado];
                    const canCancel = order.Estado === "PAGADO" || order.Estado === "EN_PREPARACION";
                    return (
                      <TableRow key={order.IDPedido}>
                        <TableCell>
                          <strong className="block text-sm text-dn-gris-oscuro">{order.NumeroPedido}</strong>
                          <span className="mt-1 block text-xs text-dn-gris/80">{order.MetodoPago.replaceAll("_", " ")}</span>
                        </TableCell>
                        <TableCell>
                          <strong className="block text-sm text-dn-gris-oscuro">{order.NombreCliente}</strong>
                          <span className="mt-1 block text-xs text-dn-gris/80">{order.CorreoCliente}</span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-dn-gris">{formatOrderDate(order.FechaCreacion)}</TableCell>
                        <TableCell><Badge variant="outline" className={statusStyles[order.Estado]}>{statusLabels[order.Estado]}</Badge></TableCell>
                        <TableCell className="whitespace-nowrap text-right text-sm font-semibold text-dn-gris-oscuro">{formatPrice(order.Total)}</TableCell>
                        <TableCell>
                          <div className="flex min-w-44 justify-end gap-2">
                            {next && <Button size="sm" type="button" disabled={isMutating} onClick={() => void advanceOrder(order, next)}>{isMutating && <LoaderCircle aria-hidden="true" className="animate-spin" size={14} />}{nextStatusLabels[next]}</Button>}
                            {canCancel && <Button size="sm" type="button" variant="outline" disabled={isMutating} onClick={() => { setCancelTarget(order); setCancelReason(""); }}>Cancelar</Button>}
                            {(order.Estado === "ENTREGADO" || order.Estado === "DEVUELTO_PARCIAL") && <Button size="sm" type="button" variant="outline" disabled={isMutating} onClick={() => { setReturnTarget(order); setReturnLineId(""); setReturnQuantity("1"); setReturnReason(""); setReturnFormError(""); actions.returnItem.reset(); }}>Devolución</Button>}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-dn-gris/20 px-4 py-3 text-sm text-dn-gris/80">
              <span>Página {result?.paginaActual ?? page} de {totalPages} · {result?.totalRegistros ?? 0} pedidos</span>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" type="button" aria-label="Página anterior" disabled={page <= 1 || orders.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}><ArrowLeft aria-hidden="true" /></Button>
                <Button variant="outline" size="icon" type="button" aria-label="Página siguiente" disabled={page >= totalPages || orders.isFetching} onClick={() => setPage((current) => current + 1)}><ArrowRight aria-hidden="true" /></Button>
              </div>
            </div>
            {orders.isFetching && <p className="sr-only" role="status">Actualizando lista de pedidos</p>}
          </>
        )}
      </div>

      <Dialog open={Boolean(cancelTarget)} onOpenChange={(open) => { if (!open && !actions.cancel.isPending) { setCancelTarget(null); setCancelReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar pedido</DialogTitle>
            <DialogDescription>El pedido {cancelTarget?.NumeroPedido} solo puede cancelarse antes de ser despachado. El inventario se reintegrará automáticamente.</DialogDescription>
          </DialogHeader>
          <label className="space-y-2 text-sm font-medium text-dn-gris-oscuro" htmlFor="cancellation-reason">
            Motivo de cancelación
            <Textarea id="cancellation-reason" value={cancelReason} maxLength={255} aria-invalid={cancelReason.trim().length > 0 && cancelReason.trim().length < 5} aria-describedby="cancellation-reason-help" onChange={(event) => setCancelReason(event.target.value)} />
          </label>
          <p id="cancellation-reason-help" className="text-xs text-dn-gris/80">Escribe al menos 5 caracteres y como máximo 255.</p>
          {actions.cancel.error && <p className="text-sm text-dn-rojo" role="alert">{actions.cancel.error.message}</p>}
          <DialogFooter>
            <Button variant="outline" type="button" disabled={actions.cancel.isPending} onClick={() => { setCancelTarget(null); setCancelReason(""); }}>Volver</Button>
            <Button variant="destructive" type="button" disabled={actions.cancel.isPending || cancelReason.trim().length < 5} onClick={() => void confirmCancellation()}>
              {actions.cancel.isPending && <LoaderCircle aria-hidden="true" className="animate-spin" size={15} />}
              Cancelar pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(returnTarget)} onOpenChange={(open) => { if (!open && !actions.returnItem.isPending) setReturnTarget(null); }}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Registrar devolución</DialogTitle><DialogDescription>Pedido {returnTarget?.NumeroPedido}. Solo se aceptan devoluciones de pedidos entregados o con devolución parcial; la cantidad debe estar dentro del saldo aún no devuelto.</DialogDescription></DialogHeader>
          {orderDetail.isPending ? <div className="space-y-3" role="status" aria-label="Cargando líneas del pedido"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : orderDetail.isError ? <div role="alert" className="text-sm text-dn-rojo">{orderDetail.error.message}<Button className="ml-2" size="sm" variant="outline" onClick={() => void orderDetail.refetch()}>Reintentar</Button></div> : <div className="space-y-4">
            <label className="block space-y-1.5 text-sm font-medium text-dn-gris-oscuro"><span>Producto del pedido</span><Select value={returnLineId} onValueChange={(value) => { setReturnLineId(value); setReturnQuantity("1"); setReturnFormError(""); }}><SelectTrigger className="w-full"><SelectValue placeholder="Selecciona la línea que se devolverá" /></SelectTrigger><SelectContent>{(orderDetail.data?.detalles ?? []).filter((line: OrderDetailLine) => line.CantidadEfectiva > 0).map((line) => <SelectItem key={line.IDPedidoDetalle} value={String(line.IDPedidoDetalle)}>{line.NombreProductoSnapshot} · {line.NombreVarianteSnapshot} · disponibles para devolución: {line.CantidadEfectiva}</SelectItem>)}</SelectContent></Select></label>
            {returnLineId && (() => { const line = orderDetail.data?.detalles.find((item) => item.IDPedidoDetalle === Number(returnLineId)); return line ? <div className="space-y-1.5"><Label htmlFor="return-quantity">Cantidad a devolver (máximo {line.CantidadEfectiva})</Label><Input id="return-quantity" type="number" min="1" max={line.CantidadEfectiva} step="1" value={returnQuantity} onChange={(event) => setReturnQuantity(event.target.value)} /></div> : null; })()}
            <label className="block space-y-1.5 text-sm font-medium text-dn-gris-oscuro" htmlFor="return-reason">Motivo<Textarea id="return-reason" minLength={5} maxLength={255} value={returnReason} aria-describedby="return-reason-help" onChange={(event) => setReturnReason(event.target.value)} /></label><p id="return-reason-help" className="text-xs text-dn-gris/80">Entre 5 y 255 caracteres ({returnReason.trim().length}/255).</p>
            {(returnFormError || actions.returnItem.error) && <p role="alert" className="text-sm text-dn-rojo">{returnFormError || actions.returnItem.error?.message}</p>}
          </div>}
          <DialogFooter><Button variant="outline" type="button" disabled={actions.returnItem.isPending} onClick={() => setReturnTarget(null)}>Cerrar</Button><Button variant="destructive" type="button" disabled={orderDetail.isPending || orderDetail.isError || !returnLineId || Number(returnQuantity) < 1 || returnReason.trim().length < 5 || actions.returnItem.isPending} onClick={() => void confirmReturn()}>{actions.returnItem.isPending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={15} /> : <RotateCcw aria-hidden="true" size={15} />}Confirmar devolución</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
