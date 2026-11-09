import { LoaderCircle } from "lucide-react";
import { DataTable } from "../../../../components/tables/DataTable";
import type { DataTableColumn } from "../../../../components/tables/DataTable";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { formatPrice } from "../../../../lib/format";
import { orderStatusLabels } from "../constants/orderStatusLabels";
import type {
  OperationsOrder,
  OrderStatus,
  UpdateOrderStatusInput,
} from "../types/orderTypes";

const statusStyles: Record<OrderStatus, string> = {
  PAGADO: "border-dn-azul/25 bg-dn-azul/5 text-dn-azul",
  EN_PREPARACION: "border-dn-azul/25 bg-dn-azul/5 text-dn-azul",
  DESPACHADO: "border-dn-gris/30 bg-dn-gris/5 text-dn-gris-oscuro",
  ENTREGADO: "border-dn-gris/30 bg-dn-gris/5 text-dn-gris-oscuro",
  CANCELADO: "border-dn-rojo/25 bg-dn-rojo/5 text-dn-rojo",
  DEVUELTO_PARCIAL: "border-dn-rojo/25 bg-dn-rojo/5 text-dn-rojo",
  DEVUELTO_TOTAL: "border-dn-rojo/25 bg-dn-rojo/5 text-dn-rojo",
};

const nextStatus: Partial<
  Record<OrderStatus, UpdateOrderStatusInput["estadoNuevo"]>
> = {
  PAGADO: "EN_PREPARACION",
  EN_PREPARACION: "DESPACHADO",
  DESPACHADO: "ENTREGADO",
};

const nextStatusLabels: Record<UpdateOrderStatusInput["estadoNuevo"], string> = {
  EN_PREPARACION: "Iniciar preparación",
  DESPACHADO: "Marcar despachado",
  ENTREGADO: "Marcar entregado",
};

interface OrdersTableProps {
  orders: OperationsOrder[];
  isMutating: boolean;
  onAdvanceOrder: (
    order: OperationsOrder,
    nextStatus: UpdateOrderStatusInput["estadoNuevo"],
  ) => void;
  onCancelOrder: (order: OperationsOrder) => void;
  onReturnOrder: (order: OperationsOrder) => void;
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function OrdersTable({
  orders,
  isMutating,
  onAdvanceOrder,
  onCancelOrder,
  onReturnOrder,
}: OrdersTableProps) {
  const columns: DataTableColumn<OperationsOrder>[] = [
    {
      id: "order",
      header: "Pedido",
      cell: (order) => (
        <>
          <strong className="block text-sm text-dn-gris-oscuro">
            {order.NumeroPedido}
          </strong>
          <span className="mt-1 block text-xs text-dn-gris/80">
            {order.MetodoPago.replaceAll("_", " ")}
          </span>
        </>
      ),
    },
    {
      id: "customer",
      header: "Cliente",
      cell: (order) => (
        <>
          <strong className="block text-sm text-dn-gris-oscuro">
            {order.NombreCliente}
          </strong>
          <span className="mt-1 block text-xs text-dn-gris/80">
            {order.CorreoCliente}
          </span>
        </>
      ),
    },
    {
      id: "date",
      header: "Fecha",
      cellClassName: "whitespace-nowrap text-xs text-dn-gris",
      cell: (order) => formatOrderDate(order.FechaCreacion),
    },
    {
      id: "status",
      header: "Estado",
      cell: (order) => (
        <Badge variant="outline" className={statusStyles[order.Estado]}>
          {orderStatusLabels[order.Estado]}
        </Badge>
      ),
    },
    {
      id: "total",
      header: "Total",
      headerClassName: "text-right",
      cellClassName:
        "whitespace-nowrap text-right text-sm font-semibold text-dn-gris-oscuro",
      cell: (order) => formatPrice(order.Total),
    },
    {
      id: "actions",
      header: <span className="sr-only">Acciones</span>,
      cellClassName: "text-right",
      cell: (order) => {
        const next = nextStatus[order.Estado];
        const canCancel =
          order.Estado === "PAGADO" || order.Estado === "EN_PREPARACION";
        const canReturn =
          order.Estado === "ENTREGADO" || order.Estado === "DEVUELTO_PARCIAL";

        return (
          <div className="flex min-w-44 justify-end gap-2">
            {next && (
              <Button
                size="sm"
                type="button"
                disabled={isMutating}
                onClick={() => onAdvanceOrder(order, next)}
              >
                {isMutating && (
                  <LoaderCircle
                    aria-hidden="true"
                    className="animate-spin"
                    size={14}
                  />
                )}
                {nextStatusLabels[next]}
              </Button>
            )}
            {canCancel && (
              <Button
                size="sm"
                type="button"
                variant="outline"
                disabled={isMutating}
                onClick={() => onCancelOrder(order)}
              >
                Cancelar
              </Button>
            )}
            {canReturn && (
              <Button
                size="sm"
                type="button"
                variant="outline"
                disabled={isMutating}
                onClick={() => onReturnOrder(order)}
              >
                Devolución
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      ariaLabel="Pedidos"
      columns={columns}
      data={orders}
      getRowId={(order) => order.IDPedido}
      containerClassName="min-h-0 flex-1 overflow-y-auto overscroll-contain"
    />
  );
}
