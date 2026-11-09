import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OrderFilters } from "../../types/orderTypes";
import { OrdersHeaderFilters } from "../OrdersHeaderFilters";

const draftFilters: OrderFilters = {
  estado: "",
  fechaInicio: "",
  fechaFin: "",
  busqueda: "",
};

describe("OrdersHeaderFilters", () => {
  it("shows date inputs and only offers clear when status or date filters are active", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn(() => true);
    const onClear = vi.fn();
    const props = {
      draftFilters,
      hasAppliedStatusOrDateFilter: false,
      dateError: "",
      onSearchChange: vi.fn(),
      onStatusChange: vi.fn(),
      onDateStartChange: vi.fn(),
      onDateEndChange: vi.fn(),
      onApply,
      onClear,
    };

    const { rerender } = render(<OrdersHeaderFilters {...props} />);
    expect(screen.getByRole("heading", { name: "Pedidos" })).toBeInTheDocument();
    expect(screen.getByText("Gestión de tienda")).toBeInTheDocument();
    expect(
      screen.getByText("Revisa pedidos y avanza su estado según el flujo permitido."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Limpiar/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Abrir filtros por fecha" }));
    expect(screen.getByLabelText("Desde")).toBeInTheDocument();
    expect(screen.getByLabelText("Hasta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aplicar" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aplicar" }));
    expect(onApply).toHaveBeenCalledOnce();
    expect(screen.queryByLabelText("Desde")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Abrir filtros por fecha" }));

    rerender(
      <OrdersHeaderFilters {...props} hasAppliedStatusOrDateFilter={true} />,
    );
    expect(screen.getByRole("button", { name: /Limpiar/ })).toBeInTheDocument();
  });
});
