import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrdersTable } from "../OrdersTable";
import type { OperationsOrder } from "../../types/orderTypes";

const baseOrder: OperationsOrder = {
  IDPedido: 1, CodigoPublico: "order-1", NumeroPedido: "SC-001", IDUsuario: 5,
  NombreCliente: "Ana García", CorreoCliente: "ana@example.com", Subtotal: 100,
  Descuento: 0, IVA: 0, Total: 100, Estado: "PAGADO", MetodoPago: "TARJETA",
  FechaCreacion: "2026-11-09T10:00:00.000Z", FechaModificacion: null, TotalRegistros: 1,
};

describe("OrdersTable", () => {
  it("shows only actions valid for the current order state and forwards the selected order", () => {
    const onAdvanceOrder = vi.fn();
    const onCancelOrder = vi.fn();
    const onReturnOrder = vi.fn();
    render(<OrdersTable orders={[baseOrder]} isMutating={false} onAdvanceOrder={onAdvanceOrder} onCancelOrder={onCancelOrder} onReturnOrder={onReturnOrder} />);

    fireEvent.click(screen.getByRole("button", { name: "Iniciar preparación" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onAdvanceOrder).toHaveBeenCalledWith(baseOrder, "EN_PREPARACION");
    expect(onCancelOrder).toHaveBeenCalledWith(baseOrder);
    expect(screen.queryByRole("button", { name: "Devolución" })).not.toBeInTheDocument();
  });

  it("offers return actions for delivered orders", () => {
    const deliveredOrder = { ...baseOrder, Estado: "ENTREGADO" as const };
    const onReturnOrder = vi.fn();
    render(<OrdersTable orders={[deliveredOrder]} isMutating={false} onAdvanceOrder={vi.fn()} onCancelOrder={vi.fn()} onReturnOrder={onReturnOrder} />);

    fireEvent.click(screen.getByRole("button", { name: "Devolución" }));
    expect(onReturnOrder).toHaveBeenCalledWith(deliveredOrder);
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
  });
});
