import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../../test/server";
import { InventoryPage } from "./InventoryPage";

const api = "http://localhost:3000/api";

describe("InventoryPage reusable table components", () => {
  it("renders the shared page header and requests the selected row count", async () => {
    const requestedLimits: string[] = [];
    const requestedSearches: string[] = [];
    const requestedCategories: string[] = [];
    const requestedLowStock: string[] = [];
    server.use(
      http.get(`${api}/inventario/existencias`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        requestedLimits.push(params.get("limite") ?? "");
        requestedSearches.push(params.get("busqueda") ?? "");
        requestedCategories.push(params.get("idCategoria") ?? "");
        requestedLowStock.push(params.get("soloBajoStock") ?? "");
        return HttpResponse.json({
          ok: true,
          datos: [
            {
              IDVariante: 12,
              IDProducto: 5,
              CodigoPublicoProducto: "product-code",
              NombreProducto: "Teclado mecánico",
              Categoria: "Tecnología",
              SKU: "TEC-001",
              NombreVariante: "Negro",
              Talla: null,
              Color: "Negro",
              Precio: 499,
              ExistenciaFisica: 10,
              UnidadesReservadas: 2,
              ExistenciaDisponible: 8,
              VarianteActiva: true,
            },
          ],
          totalRegistros: 1,
          paginaActual: 1,
          totalPaginas: 1,
        });
      }),
      http.get(`${api}/inventario/kardex`, () =>
        HttpResponse.json({
          ok: true,
          datos: [
            {
              IDKardex: 30,
              IDVariante: 12,
              SKU: "TEC-001",
              NombreProducto: "Teclado mecánico",
              NombreVariante: "Negro",
              IDUsuario: 2,
              NombreUsuario: "Operador",
              TipoMovimiento: "AJUSTE_POSITIVO",
              Cantidad: 2,
              ExistenciaAnterior: 8,
              ExistenciaNueva: 10,
              Motivo: "Reposición de inventario",
              IDReferencia: null,
              Fecha: "2026-11-08T12:00:00.000Z",
            },
          ],
          totalRegistros: 1,
          paginaActual: 1,
          totalPaginas: 1,
        }),
      ),
    );
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <InventoryPage />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Inventario" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Consulta existencias, revisa el kardex y registra ajustes con su motivo.",
      ),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("table", { name: "Existencias de inventario" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("cell", { name: /Teclado mecánico/ }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: "Filas por página" }));
    await user.click(screen.getByRole("option", { name: "20" }));

    await waitFor(() => expect(requestedLimits).toContain("20"));

    await user.type(screen.getByRole("textbox", { name: "Buscar producto o SKU" }), "teclado");
    await waitFor(() => expect(requestedSearches).toContain("teclado"));

    await user.click(
      screen.getByRole("combobox", { name: "Filtrar inventario por categoría" }),
    );
    await user.click(await screen.findByRole("option", { name: "Caballeros" }));
    await waitFor(() => expect(requestedCategories).toContain("1"));

    await user.click(screen.getByRole("button", { name: "Abrir filtros de inventario" }));
    await user.click(screen.getByRole("checkbox", { name: /Stock bajo/ }));
    await user.click(screen.getByRole("button", { name: "Aplicar" }));
    await waitFor(() => expect(requestedLowStock).toContain("true"));

    await user.click(screen.getByRole("button", { name: "Ajustar" }));
    const adjustmentSheet = await screen.findByRole("dialog", {
      name: "Ajuste manual",
    });
    expect(
      within(adjustmentSheet).getByLabelText("Cantidad"),
    ).toBeInTheDocument();
    await user.click(within(adjustmentSheet).getByRole("button", { name: "Volver" }));

    await user.click(screen.getByRole("button", { name: /Kardex/ }));
    const movementsSheet = await screen.findByRole("dialog", {
      name: "Kardex de inventario",
    });
    expect(
      await within(movementsSheet).findByRole("table", {
        name: "Movimientos de inventario",
      }),
    ).toBeInTheDocument();
    expect(
      within(movementsSheet).getByRole("navigation", {
        name: "Paginación de tabla",
      }),
    ).toBeInTheDocument();
  }, 20_000);
});
