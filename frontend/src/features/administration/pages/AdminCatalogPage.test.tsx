import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/server";
import { AdminCatalogPage } from "./AdminCatalogPage";

const api = "http://localhost:3000/api";

describe("AdminCatalogPage reusable components", () => {
  it("uses the shared tables, pagination and form sheets across admin sections", async () => {
    const productLimits: string[] = [];
    const auditLimits: string[] = [];
    server.use(
      http.get(`${api}/catalogo/categorias`, () =>
        HttpResponse.json({
          ok: true,
          datos: [
            {
              IDCategoria: 1,
              IDCategoriaPadre: null,
              CategoriaPadre: null,
              Nombre: "Tecnología",
              Descripcion: "Productos tecnológicos.",
              Activo: true,
              TotalProductosActivos: 2,
            },
          ],
        }),
      ),
      http.get(`${api}/catalogo/productos`, ({ request }) => {
        productLimits.push(
          new URL(request.url).searchParams.get("limite") ?? "",
        );
        return HttpResponse.json({
          ok: true,
          datos: [
            {
              IDProducto: 4,
              CodigoPublico: "product-code",
              IDCategoria: 1,
              Categoria: "Tecnología",
              Nombre: "Audífonos",
              Descripcion: "Audífonos inalámbricos.",
              Activo: true,
              PrecioMinimo: 199,
              PrecioMaximo: 199,
              TotalStockDisponible: 8,
              TotalVariantes: 1,
            },
          ],
          totalRegistros: 1,
          totalPaginas: 1,
          paginaActual: 1,
        });
      }),
      http.get(`${api}/cupones`, () =>
        HttpResponse.json({
          ok: true,
          datos: [
            {
              IDCupon: 2,
              Codigo: "BIENVENIDA",
              TipoDescuento: "PORCENTAJE",
              ValorDescuento: 10,
              MontoMinimoCompra: 0,
              LimiteUsosTotal: 100,
              LimiteUsosPorCliente: 1,
              UsosActuales: 4,
              IDCategoria: null,
              CategoriaRestringida: null,
              FechaInicio: "2026-11-01T00:00:00.000Z",
              FechaFin: "2026-12-01T00:00:00.000Z",
              Activo: true,
              EstadoVigencia: "VIGENTE",
            },
          ],
        }),
      ),
      http.get(`${api}/bitacora`, ({ request }) => {
        auditLimits.push(new URL(request.url).searchParams.get("limite") ?? "");
        return HttpResponse.json({
          ok: true,
          datos: [
            {
              IDBitacora: 9,
              Entidad: "Productos",
              IDRegistro: "4",
              Accion: "CREAR",
              ValorAnterior: null,
              ValorNuevo: '{"nombre":"Audífonos"}',
              IDUsuario: 1,
              NombreUsuario: "Admin",
              CorreoUsuario: "admin@example.com",
              DireccionIP: null,
              Fecha: "2026-11-08T12:00:00.000Z",
            },
          ],
          totalRegistros: 1,
          paginaActual: 1,
        });
      }),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={queryClient}>
        <AdminCatalogPage />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole("table", { name: "Categorías del catálogo" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Nueva categoría" }));
    const categorySheet = await screen.findByRole("dialog", {
      name: "Nueva categoría",
    });
    expect(within(categorySheet).getByLabelText("Nombre")).toBeInTheDocument();
    await user.click(
      within(categorySheet).getByRole("button", { name: "Cerrar" }),
    );
    await user.click(screen.getByRole("tab", { name: "Productos y variantes" }));
    expect(
      await screen.findByRole("table", { name: "Productos de administración" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Nuevo producto" }));
    const productSheet = await screen.findByRole("dialog", { name: "Crear producto" });
    expect(within(productSheet).getByLabelText("Nombre")).toBeInTheDocument();
    await user.click(within(productSheet).getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: "Añadir variante" }));
    const variantSheet = await screen.findByRole("dialog", { name: "Añadir variante" });
    expect(within(variantSheet).getByLabelText("SKU")).toBeInTheDocument();
    await user.click(within(variantSheet).getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("combobox", { name: "Filas por página" }));
    await user.click(screen.getByRole("option", { name: "50" }));
    await waitFor(() => expect(productLimits).toContain("50"));
    await user.click(screen.getByRole("tab", { name: "Cupones" }));
    expect(await screen.findByRole("table", { name: "Cupones" })).toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: /Filas por/ }));
    await user.click(screen.getByRole("option", { name: "50" }));
    await user.click(screen.getByRole("button", { name: "Nuevo cupón" }));
    expect(
      await screen.findByRole("dialog", { name: "Crear cupón" }),
    ).toBeInTheDocument();
    await user.click(
      within(screen.getByRole("dialog", { name: "Crear cupón" })).getByRole(
        "button",
        { name: "Cancelar" },
      ),
    );
    await user.click(screen.getByRole("tab", { name: "Bitácora" }));
    await screen.findByRole("table", { name: "Bitácora de auditoría" });
    await user.click(screen.getByRole("combobox", { name: "Filas por página" }));
    await user.click(screen.getByRole("option", { name: "30" }));
    await waitFor(() => expect(auditLimits).toContain("30"));
  });
});
