import type { OrderStatus } from "../types/orderTypes";

export const orderStatusLabels: Record<OrderStatus, string> = {
  PAGADO: "Pagado",
  EN_PREPARACION: "En preparación",
  DESPACHADO: "Despachado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
  DEVUELTO_PARCIAL: "Devolución parcial",
  DEVUELTO_TOTAL: "Devolución total",
};
