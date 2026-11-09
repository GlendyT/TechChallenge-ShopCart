import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { Toaster } from "../../../../components/ui/sonner";
import { server } from "../../../../test/server";
import type { AdminProduct } from "../../types/adminTypes";
import ProductsSection from "../ProductsSection";

const api = "http://localhost:3000/api";
const product: AdminProduct = {
  IDProducto: 4,
  CodigoPublico: "product-code",
  IDCategoria: 1,
  Categoria: "Tecnología",
  Nombre: "Audífonos",
  Descripcion: "Audífonos inalámbricos",
  Activo: true,
  PrecioMinimo: 199,
  PrecioMaximo: 199,
  TotalStockDisponible: 8,
  TotalVariantes: 1,
};

describe("ProductsSection", () => {
  it("creates a variant without sending a SKU so the backend can generate it", async () => {
    const user = userEvent.setup();
    let submittedVariant: Record<string, unknown> | undefined;
    server.use(
      http.post(`${api}/catalogo/variantes`, async ({ request }) => {
        submittedVariant = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          { ok: true, datos: { IDVariante: 51, SKU: "P4-GRIS-L-01" } },
          { status: 201 },
        );
      }),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <>
          <ProductsSection
            categories={[]}
            products={[product]}
            total={1}
            totalPages={1}
            page={1}
            pageSize={10}
            isLoading={false}
            onPageChange={() => undefined}
            onPageSizeChange={() => undefined}
            search=""
            onSearch={() => undefined}
          />
          <Toaster />
        </>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Añadir variante" }));
    const sheet = await screen.findByRole("dialog", { name: "Añadir variante" });
    await user.type(within(sheet).getByRole("textbox", { name: "Nombre de variante" }), "Gris talla L");
    await user.type(within(sheet).getByRole("spinbutton", { name: "Precio" }), "199.99");
    await user.click(within(sheet).getByRole("button", { name: "Crear variante" }));

    await waitFor(() => {
      expect(submittedVariant).toEqual({
        idProducto: 4,
        nombre: "Gris talla L",
        talla: null,
        color: null,
        precio: 199.99,
        existenciaFisicaInicial: 0,
      });
    });
    expect(submittedVariant).not.toHaveProperty("sku");
    expect(
      await screen.findByText("Variante creada correctamente. SKU: P4-GRIS-L-01"),
    ).toBeInTheDocument();
  });
});
