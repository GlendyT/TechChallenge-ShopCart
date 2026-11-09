import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { products } from "../../../../test/fixtures";
import { server } from "../../../../test/server";
import { CategoryProductSection } from "../CategoryProductSection";

const api = "http://localhost:3000/api";
const category = {
  IDCategoria: 1,
  Nombre: "Caballeros",
  Descripcion: "Prendas y moda para hombres.",
};

function renderSection() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <CategoryProductSection category={category} search="camisa" />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("CategoryProductSection", () => {
  it("requests products for its category and renders the product carousel", async () => {
    let requestUrl = "";
    server.use(
      http.get(`${api}/catalogo/productos`, ({ request }) => {
        requestUrl = request.url;
        return HttpResponse.json({
          ok: true,
          datos: products,
          totalRegistros: 1,
          totalPaginas: 1,
          paginaActual: 1,
        });
      }),
    );

    renderSection();

    expect(await screen.findByRole("region", { name: "Productos de Caballeros" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Caballeros" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: `Ver ${products[0]!.Nombre}` })).toBeInTheDocument();
    const params = new URL(requestUrl).searchParams;
    expect(params.get("idCategoria")).toBe("1");
    expect(params.get("busqueda")).toBe("camisa");
    expect(params.get("limite")).toBe("6");
  });

  it("renders an empty category when the API returns no matching products", async () => {
    server.use(
      http.get(`${api}/catalogo/productos`, () =>
        HttpResponse.json({ ok: true, datos: [], totalRegistros: 0 }),
      ),
    );

    renderSection();

    expect(
      await screen.findByText("No encontramos productos en esta categoría."),
    ).toBeInTheDocument();
  });
});
