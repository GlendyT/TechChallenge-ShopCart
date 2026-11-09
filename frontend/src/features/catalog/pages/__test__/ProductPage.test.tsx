import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { filledCart, productCode, productDetail } from "../../../../test/fixtures";
import { server } from "../../../../test/server";
import { ProductPage } from "../ProductPage";

describe("ProductPage breadcrumb", () => {
  it("links the product category to its catalog collection URL", async () => {
    server.use(
      http.get(
        `http://localhost:3000/api/catalogo/productos/${productCode}`,
        () => HttpResponse.json({ ok: true, datos: productDetail }),
      ),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <ProductPage codigoPublico={productCode} />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    const categoryLink = await screen.findByRole("link", { name: "Caballeros" });
    expect(categoryLink).toHaveAttribute("href", "/categoria/1#colecciones");
  });

  it("adds the selected variant to the guest cart and announces success", async () => {
    const user = userEvent.setup();
    localStorage.setItem("shopcart.guest-token", "catalog-guest-token");
    let submitted: unknown;
    let guestToken: string | null = null;
    server.use(
      http.get(
        `http://localhost:3000/api/catalogo/productos/${productCode}`,
        () => HttpResponse.json({ ok: true, datos: productDetail }),
      ),
      http.post("http://localhost:3000/api/carrito/items", async ({ request }) => {
        submitted = await request.json();
        guestToken = request.headers.get("x-guest-token");
        return HttpResponse.json({ ok: true, datos: filledCart });
      }),
    );
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <ProductPage codigoPublico={productCode} />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole("button", { name: "Agregar a mi bolsa" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Agregamos esta pieza a tu bolsa.",
    );
    expect(submitted).toEqual({ idVariante: 11, cantidad: 1 });
    expect(guestToken).toBe("catalog-guest-token");
  });

  it("disables adding a product when it has no active variants", async () => {
    const unavailableProduct = {
      ...productDetail,
      variantes: productDetail.variantes.map((variant) => ({
        ...variant,
        Activo: false,
      })),
      imagenes: [],
    };
    server.use(
      http.get(
        `http://localhost:3000/api/catalogo/productos/${productCode}`,
        () => HttpResponse.json({ ok: true, datos: unavailableProduct }),
      ),
    );
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <ProductPage codigoPublico={productCode} />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Este producto no tiene variantes disponibles por el momento."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar a mi bolsa" })).toBeDisabled();
    expect(screen.getByText("Sin variantes disponibles")).toBeInTheDocument();
  });

  it("shows a not-found state when the product request fails", async () => {
    server.use(
      http.get(
        `http://localhost:3000/api/catalogo/productos/${productCode}`,
        () =>
          HttpResponse.json(
            { ok: false, mensaje: "Producto no encontrado." },
            { status: 404 },
          ),
      ),
    );
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <ProductPage codigoPublico={productCode} />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Producto no encontrado.",
    );
    expect(screen.getByRole("link", { name: "Volver a la tienda" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
