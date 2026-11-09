import { useState, type FormEvent } from "react";
import {
  LoaderCircle,
  PackageSearch,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { FormSheet } from "../../../../components/forms/FormSheet";
import { TablePagination } from "../../../../components/tables/TablePagination";
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
import { Textarea } from "../../../../components/ui/textarea";
import { PageState } from "../../../../components/feedback/PageState";
import { formatPrice } from "../../../../lib/format";
import { useDebouncedValue } from "../../../../shared/hooks/useDebouncedValue";
import { OrdersHeaderFilters } from "../components/OrdersHeaderFilters";
import { OrdersTable } from "../components/OrdersTable";
import { useOrderActions } from "../hooks/useOrderActions";
import { useOrders } from "../hooks/useOrders";
import { useOrderDetail } from "../hooks/useOrderDetail";
import type {
  OrderFilters,
  OrderStatus,
  OperationsOrder,
  OrderDetailLine,
  UpdateOrderStatusInput,
} from "../types/orderTypes";

const initialFilters: OrderFilters = {
  estado: "",
  fechaInicio: "",
  fechaFin: "",
  busqueda: "",
};

export function OrdersPage() {
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const debouncedSearch = useDebouncedValue(draftFilters.busqueda.trim());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateError, setDateError] = useState("");
  const [cancelTarget, setCancelTarget] = useState<OperationsOrder | null>(
    null,
  );
  const [cancelReason, setCancelReason] = useState("");
  const [returnTarget, setReturnTarget] = useState<OperationsOrder | null>(
    null,
  );
  const [returnLineId, setReturnLineId] = useState("");
  const [returnQuantity, setReturnQuantity] = useState("1");
  const [returnReason, setReturnReason] = useState("");
  const [returnFormError, setReturnFormError] = useState("");
  const orders = useOrders(
    { ...filters, busqueda: debouncedSearch },
    page,
    pageSize,
  );
  const orderDetail = useOrderDetail(returnTarget?.CodigoPublico ?? null);
  const actions = useOrderActions();
  const isMutating =
    actions.updateStatus.isPending ||
    actions.cancel.isPending ||
    actions.returnItem.isPending;

  const availableLines =
    orderDetail.data?.detalles.filter((line) => line.CantidadEfectiva > 0) ??
    [];
  const selectedLineStillAvailable = availableLines.some(
    (line) => line.IDPedidoDetalle === Number(returnLineId),
  );
  const effectiveReturnLineId = selectedLineStillAvailable
    ? returnLineId
    : availableLines[0]
      ? String(availableLines[0].IDPedidoDetalle)
      : "";

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      draftFilters.fechaInicio &&
      draftFilters.fechaFin &&
      draftFilters.fechaInicio > draftFilters.fechaFin
    ) {
      setDateError(
        "La fecha inicial debe ser anterior o igual a la fecha final.",
      );
      return false;
    }
    setDateError("");
    setFilters((current) => ({
      ...current,
      fechaInicio: draftFilters.fechaInicio,
      fechaFin: draftFilters.fechaFin,
    }));
    setPage(1);
    return true;
  }

  function clearFilters() {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
    setDateError("");
    setPage(1);
  }

  function changeStatus(status: OrderStatus | "") {
    setDraftFilters((current) => ({ ...current, estado: status }));
    setFilters((current) => ({ ...current, estado: status }));
    setPage(1);
  }

  async function advanceOrder(
    order: OperationsOrder,
    estadoNuevo: UpdateOrderStatusInput["estadoNuevo"],
  ) {
    try {
      await actions.updateStatus.mutateAsync({
        idPedido: order.IDPedido,
        estadoNuevo,
      });
      setPage(1);
    } catch {
      // The mutation error is rendered above the results.
    }
  }

  function openCancellation(order: OperationsOrder) {
    setCancelTarget(order);
    setCancelReason("");
  }

  function openReturn(order: OperationsOrder) {
    setReturnTarget(order);
    setReturnLineId("");
    setReturnQuantity("1");
    setReturnReason("");
    setReturnFormError("");
    actions.returnItem.reset();
  }

  async function confirmCancellation() {
    if (!cancelTarget || cancelReason.trim().length < 5) return;
    try {
      await actions.cancel.mutateAsync({
        idPedido: cancelTarget.IDPedido,
        motivo: cancelReason.trim(),
      });
      setCancelTarget(null);
      setCancelReason("");
      setPage(1);
    } catch {
      // Keep the dialog open so the operator can read the API error.
    }
  }

  async function confirmReturn() {
    const detail = orderDetail.data;
    const line = detail?.detalles.find(
      (item) => item.IDPedidoDetalle === Number(effectiveReturnLineId),
    );
    const amount = Number(returnQuantity);
    if (
      !returnTarget ||
      !line ||
      !Number.isInteger(amount) ||
      amount < 1 ||
      amount > line.CantidadEfectiva ||
      returnReason.trim().length < 5 ||
      returnReason.trim().length > 255
    ) {
      setReturnFormError(
        "Selecciona una línea disponible, indica una cantidad válida y escribe un motivo de 5 a 255 caracteres.",
      );
      return;
    }
    setReturnFormError("");
    try {
      await actions.returnItem.mutateAsync({
        idPedido: returnTarget.IDPedido,
        codigoPublico: returnTarget.CodigoPublico,
        idPedidoDetalle: line.IDPedidoDetalle,
        cantidadADevolver: amount,
        motivo: returnReason.trim(),
      });
      setReturnTarget(null);
      setReturnLineId("");
      setReturnQuantity("1");
      setReturnReason("");
      setPage(1);
    } catch {
      // Conserva el diálogo y muestra el error de la API.
    }
  }

  const result = orders.data;
  const orderRows = result?.datos ?? [];
  const totalPages = result?.totalPaginas ?? 1;
  const mutationError = actions.updateStatus.error ?? actions.cancel.error;

  return (
    <section aria-labelledby="orders-title">
      <OrdersHeaderFilters
        draftFilters={draftFilters}
        hasAppliedStatusOrDateFilter={Boolean(
          filters.estado || filters.fechaInicio || filters.fechaFin,
        )}
        dateError={dateError}
        onSearchChange={(busqueda) => {
          setDraftFilters((current) => ({ ...current, busqueda }));
          setPage(1);
        }}
        onStatusChange={changeStatus}
        onDateStartChange={(fechaInicio) =>
          setDraftFilters((current) => ({ ...current, fechaInicio }))
        }
        onDateEndChange={(fechaFin) =>
          setDraftFilters((current) => ({ ...current, fechaFin }))
        }
        onApply={applyFilters}
        onClear={clearFilters}
      />

      {mutationError && (
        <p
          className="mt-4 rounded-md border border-dn-rojo/25 bg-dn-rojo/5 p-3 text-sm text-dn-rojo"
          role="alert"
        >
          {mutationError.message}
        </p>
      )}

      <div className="mt-5 flex h-[min(65vh,48rem)] min-h-[20rem] flex-col overflow-hidden rounded-lg border border-dn-gris/20 bg-white">
        {orders.isPending ? (
          <div
            className="space-y-3 p-4"
            role="status"
            aria-label="Cargando pedidos"
          >
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton
                className="h-12 w-full"
                key={index}
                aria-hidden="true"
              />
            ))}
          </div>
        ) : orders.isError ? (
          <PageState
            icon={RefreshCw}
            title="No pudimos cargar los pedidos"
            description={orders.error.message}
            tone="error"
            action={
              <Button variant="outline" onClick={() => void orders.refetch()}>
                Intentar de nuevo
              </Button>
            }
          />
        ) : orderRows.length === 0 ? (
          <PageState
            icon={PackageSearch}
            title="No hay pedidos para mostrar"
            description={
              filters.estado ||
              filters.busqueda ||
              filters.fechaInicio ||
              filters.fechaFin
                ? "Prueba con otros filtros para encontrar pedidos."
                : "Cuando se registren pedidos, aparecerán en esta lista."
            }
            action={
              filters.estado ||
              filters.busqueda ||
              filters.fechaInicio ||
              filters.fechaFin ? (
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <OrdersTable
              orders={orderRows}
              isMutating={isMutating}
              onAdvanceOrder={advanceOrder}
              onCancelOrder={openCancellation}
              onReturnOrder={openReturn}
            />
            <TablePagination
              currentPage={result?.paginaActual ?? page}
              totalPages={totalPages}
              totalItems={result?.totalRegistros ?? 0}
              pageSize={pageSize}
              itemLabel="pedidos"
              isLoading={orders.isFetching}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
            {orders.isFetching && (
              <p className="sr-only" role="status">
                Actualizando lista de pedidos
              </p>
            )}
          </>
        )}
      </div>

      <Dialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => {
          if (!open && !actions.cancel.isPending) {
            setCancelTarget(null);
            setCancelReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar pedido</DialogTitle>
            <DialogDescription>
              El pedido {cancelTarget?.NumeroPedido} solo puede cancelarse antes
              de ser despachado. El inventario se reintegrará automáticamente.
            </DialogDescription>
          </DialogHeader>
          <label
            className="space-y-2 text-sm font-medium text-dn-gris-oscuro"
            htmlFor="cancellation-reason"
          >
            Motivo de cancelación
            <Textarea
              id="cancellation-reason"
              value={cancelReason}
              maxLength={255}
              aria-invalid={
                cancelReason.trim().length > 0 && cancelReason.trim().length < 5
              }
              aria-describedby="cancellation-reason-help"
              onChange={(event) => setCancelReason(event.target.value)}
            />
          </label>
          <p id="cancellation-reason-help" className="text-xs text-dn-gris/80">
            Escribe al menos 5 caracteres y como máximo 255.
          </p>
          {actions.cancel.error && (
            <p className="text-sm text-dn-rojo" role="alert">
              {actions.cancel.error.message}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              disabled={actions.cancel.isPending}
              onClick={() => {
                setCancelTarget(null);
                setCancelReason("");
              }}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              type="button"
              disabled={
                actions.cancel.isPending || cancelReason.trim().length < 5
              }
              onClick={() => void confirmCancellation()}
            >
              {actions.cancel.isPending && (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin"
                  size={15}
                />
              )}
              Cancelar pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FormSheet
        open={Boolean(returnTarget)}
        title="Registrar devolución"
        description="Revisa el pedido y selecciona el producto y la cantidad que se devolverán."
        className="sm:max-w-xl"
        bodyClassName="space-y-5"
        onOpenChange={(open) => {
          if (!open && !actions.returnItem.isPending) {
            setReturnTarget(null);
            setReturnFormError("");
          }
        }}
        footer={
          <>
            <Button
              variant="outline"
              type="button"
              disabled={actions.returnItem.isPending}
              onClick={() => setReturnTarget(null)}
            >
              Cerrar
            </Button>
            <Button
              variant="destructive"
              type="button"
              disabled={
                orderDetail.isPending ||
                orderDetail.isError ||
                !effectiveReturnLineId ||
                Number(returnQuantity) < 1 ||
                returnReason.trim().length < 5 ||
                actions.returnItem.isPending
              }
              onClick={() => void confirmReturn()}
            >
              {actions.returnItem.isPending ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin"
                  size={15}
                />
              ) : (
                <RotateCcw aria-hidden="true" size={15} />
              )}
              Confirmar devolución
            </Button>
          </>
        }
      >
        {returnTarget && (
          <dl className="grid gap-3 rounded-lg border border-dn-gris/20 bg-dn-gris/5 p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-dn-gris">Pedido</dt>
              <dd className="mt-1 font-semibold text-dn-gris-oscuro">
                {returnTarget.NumeroPedido}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-dn-gris">Total de la compra</dt>
              <dd className="mt-1 font-semibold text-dn-gris-oscuro">
                {formatPrice(returnTarget.Total)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-dn-gris">Cliente</dt>
              <dd className="mt-1 font-medium text-dn-gris-oscuro">
                {returnTarget.NombreCliente}
              </dd>
              <dd className="text-xs text-dn-gris/80">
                {returnTarget.CorreoCliente}
              </dd>
            </div>
          </dl>
        )}
        {orderDetail.isPending ? (
          <div
            className="space-y-3"
            role="status"
            aria-label="Cargando líneas del pedido"
          >
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : orderDetail.isError ? (
          <div role="alert" className="text-sm text-dn-rojo">
            {orderDetail.error.message}
            <Button
              className="ml-2"
              size="sm"
              variant="outline"
              onClick={() => void orderDetail.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block space-y-1.5 text-sm font-medium text-dn-gris-oscuro">
              <span>Producto del pedido</span>
              <Select
                value={effectiveReturnLineId}
                onValueChange={(value) => {
                  setReturnLineId(value);
                  setReturnQuantity("1");
                  setReturnFormError("");
                }}
              >
                <SelectTrigger
                  className="w-full"
                  aria-label="Producto del pedido"
                >
                  <SelectValue placeholder="Selecciona la línea que se devolverá" />
                </SelectTrigger>
                <SelectContent>
                  {(orderDetail.data?.detalles ?? [])
                    .filter(
                      (line: OrderDetailLine) => line.CantidadEfectiva > 0,
                    )
                    .map((line) => (
                      <SelectItem
                        key={line.IDPedidoDetalle}
                        value={String(line.IDPedidoDetalle)}
                      >
                        {line.NombreProductoSnapshot} ·{" "}
                        {line.NombreVarianteSnapshot} · disponibles para
                        devolución: {line.CantidadEfectiva}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </label>
            {orderDetail.data?.detalles.every(
              (line) => line.CantidadEfectiva <= 0,
            ) && (
              <p className="text-sm text-dn-gris/80" role="status">
                Este pedido no tiene productos pendientes de devolución.
              </p>
            )}
            {effectiveReturnLineId &&
              (() => {
                const line = orderDetail.data?.detalles.find(
                  (item) =>
                    item.IDPedidoDetalle === Number(effectiveReturnLineId),
                );
                return line ? (
                  <label
                    className="block space-y-1.5 text-sm font-medium text-dn-gris-oscuro"
                    htmlFor="return-quantity"
                  >
                    Cantidad a devolver (máximo {line.CantidadEfectiva})
                    <Input
                      id="return-quantity"
                      type="number"
                      min="1"
                      max={line.CantidadEfectiva}
                      step="1"
                      value={returnQuantity}
                      onChange={(event) =>
                        setReturnQuantity(event.target.value)
                      }
                    />
                  </label>
                ) : null;
              })()}
            <label
              className="block space-y-1.5 text-sm font-medium text-dn-gris-oscuro"
              htmlFor="return-reason"
            >
              Motivo
              <Textarea
                id="return-reason"
                minLength={5}
                maxLength={255}
                value={returnReason}
                aria-describedby="return-reason-help"
                onChange={(event) => setReturnReason(event.target.value)}
              />
            </label>
            <p id="return-reason-help" className="text-xs text-dn-gris/80">
              Entre 5 y 255 caracteres ({returnReason.trim().length}/255).
            </p>
            {(returnFormError || actions.returnItem.error) && (
              <p role="alert" className="text-sm text-dn-rojo">
                {returnFormError || actions.returnItem.error?.message}
              </p>
            )}
          </div>
        )}
      </FormSheet>
    </section>
  );
}
