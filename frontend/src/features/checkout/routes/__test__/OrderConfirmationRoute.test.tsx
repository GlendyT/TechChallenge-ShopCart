import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { OrderConfirmationRoute } from "../OrderConfirmationRoute";

vi.mock("../../pages/OrderConfirmationPage", () => ({
  OrderConfirmationPage: ({ codigoPublico }: { codigoPublico: string }) => (
    <p>Order confirmation: {codigoPublico}</p>
  ),
}));

function renderOrderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>Store home</p>} />
        <Route path="/pedido-confirmado" element={<OrderConfirmationRoute />} />
        <Route path="/pedido-confirmado/:codigoPublico" element={<OrderConfirmationRoute />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("OrderConfirmationRoute", () => {
  it("passes the public order code to the confirmation page", () => {
    renderOrderRoute("/pedido-confirmado/order-code");

    expect(screen.getByText("Order confirmation: order-code")).toBeInTheDocument();
  });

  it("redirects to the store if the public order code is missing", () => {
    renderOrderRoute("/pedido-confirmado");

    expect(screen.getByText("Store home")).toBeInTheDocument();
  });
});
