import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { productCode, productDetail } from "../../../test/fixtures";
import { server } from "../../../test/server";
import { ProductPage } from "./ProductPage";

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
});
