import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { server } from "../../../../test/server";
import { OrdersPage } from "./OrdersPage";

const orderCode = "order-public-code";

describe("OrdersPage return flow", () => {
  it("opens the return sheet with order details and its first returnable line selected", async () => {
    server.use(
      http.get("http://localhost:3000/api/pedidos", () =>
        HttpResponse.json({
          ok: true,
          datos: [
            {
              IDPedido: 41,
              CodigoPublico: orderCode,
              NumeroPedido: "SC-041",
              IDUsuario: 5,
              NombreCliente: "Ana García",
              CorreoCliente: "ana@example.com",
              Subtotal: 250,
              Descuento: 0,
              IVA: 0,
              Total: 250,
              Estado: "ENTREGADO",
              MetodoPago: "TARJETA",
              FechaCreacion: "2026-10-20T12:00:00.000Z",
              FechaModificacion: null,
              TotalRegistros: 1,
            },
          ],
          totalRegistros: 1,
          paginaActual: 1,
          tamanoPagina: 10,
          totalPaginas: 1,
        }),
      ),
      http.get(`http://localhost:3000/api/pedidos/${orderCode}`, () =>
        HttpResponse.json({
          ok: true,
          datos: {
            IDPedido: 41,
            CodigoPublico: orderCode,
            NumeroPedido: "SC-041",
            Estado: "ENTREGADO",
            Total: 250,
            detalles: [
              {
                IDPedidoDetalle: 92,
                IDVariante: 3,
                SKUSnapshot: "CAM-OXF-AZU-M",
                NombreProductoSnapshot: "Camisa Oxford",
                NombreVarianteSnapshot: "Azul / M",
                Cantidad: 2,
                PrecioUnitario: 125,
                DescuentoUnitario: 0,
                Subtotal: 250,
                CantidadDevuelta: 0,
                CantidadEfectiva: 2,
              },
            ],
          },
        }),
      ),
    );
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <OrdersPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const ordersTable = await screen.findByRole("table", { name: "Pedidos" });
    expect(ordersTable.parentElement).toHaveClass(
      "min-h-0",
      "flex-1",
      "overflow-y-auto",
    );
    expect(ordersTable.parentElement?.parentElement).toHaveClass(
      "flex",
      "h-[min(65vh,48rem)]",
      "flex-col",
    );
    expect(
      screen
        .getByRole("navigation", { name: "Paginación de tabla" })
        .closest("footer"),
    ).toHaveClass("mt-auto", "shrink-0");

    await user.click(await screen.findByRole("button", { name: "Devolución" }));

    const sheet = await screen.findByRole("dialog", {
      name: "Registrar devolución",
    });
    expect(within(sheet).getByText("SC-041")).toBeInTheDocument();
    expect(within(sheet).getByText("Ana García")).toBeInTheDocument();
    expect(
      await within(sheet).findByLabelText(/Cantidad a devolver/),
    ).toHaveValue(1);
    await waitFor(() => {
      expect(
        within(sheet).getByRole("combobox", { name: "Producto del pedido" }),
      ).toHaveTextContent("Camisa Oxford");
    });
  });
});
