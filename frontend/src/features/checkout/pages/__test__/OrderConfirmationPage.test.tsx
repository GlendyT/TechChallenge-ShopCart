import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatPrice } from "../../../../lib/format";
import { OrderConfirmationPage } from "../OrderConfirmationPage";

const mocks = vi.hoisted(() => ({ useOrder: vi.fn() }));
vi.mock("../../hooks/useOrder", () => ({ useOrder: mocks.useOrder }));

function renderConfirmation() {
  return render(
    <MemoryRouter>
      <OrderConfirmationPage codigoPublico="order-code" />
    </MemoryRouter>,
  );
}

describe("OrderConfirmationPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows a loading state while fetching the created order", () => {
    mocks.useOrder.mockReturnValue({ isPending: true, isError: false });
    renderConfirmation();

    expect(screen.getByRole("status", { name: "Cargando el resumen de tu pedido" })).toBeInTheDocument();
  });

  it("shows a fallback when the order summary cannot be loaded", () => {
    mocks.useOrder.mockReturnValue({ isPending: false, isError: true });
    renderConfirmation();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Tu pedido fue creado. Puedes consultarlo desde tu cuenta.",
    );
    expect(screen.getByRole("link", { name: "Ver mi cuenta" })).toHaveAttribute(
      "href",
      "/cuenta",
    );
  });

  it("shows the order number and total after confirmation", () => {
    mocks.useOrder.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        CodigoPublico: "order-code",
        NumeroPedido: "DA-2026-0001",
        Total: 498,
      },
    });
    renderConfirmation();

    expect(screen.getByText("DA-2026-0001")).toBeInTheDocument();
    expect(screen.getByText(/498\.00/)).toHaveTextContent(
      formatPrice(498).replace(/\u00a0/g, " "),
    );
    expect(screen.getByRole("heading", { name: "Gracias por elegirnos." })).toBeInTheDocument();
  });
});
