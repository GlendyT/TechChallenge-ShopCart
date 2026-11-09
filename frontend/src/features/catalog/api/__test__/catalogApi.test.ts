import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { productCode, productDetail, products } from "../../../../test/fixtures";
import { server } from "../../../../test/server";
import {
  buildCatalogSearchParams,
  fetchCategories,
  fetchProduct,
  fetchProducts,
} from "../catalogApi";
import type { CatalogFilters } from "../../types/catalogTypes";

const api = "http://localhost:3000/api";

describe("catalog API", () => {
  it("builds query parameters for search, category, stock, sort, page and price range", () => {
    const filters: CatalogFilters = {
      search: "camisa",
      category: "4",
      order: "PRECIO_ASC",
      page: 3,
      inStock: true,
      priceRange: "200-400",
    };
    const params = buildCatalogSearchParams(filters, 6);

    expect(Object.fromEntries(params)).toEqual({
      pagina: "3",
      limite: "6",
      orden: "PRECIO_ASC",
      busqueda: "camisa",
      idCategoria: "4",
      soloConStock: "true",
      precioMin: "200",
      precioMax: "400",
    });
    expect(
      Object.fromEntries(
        buildCatalogSearchParams({ ...filters, priceRange: "under-200" }),
      ),
    ).toMatchObject({ precioMax: "200" });
    expect(
      Object.fromEntries(
        buildCatalogSearchParams({ ...filters, priceRange: "over-400" }),
      ),
    ).toMatchObject({ precioMin: "400" });
  });

  it("loads categories, product results and product detail from their API routes", async () => {
    const requested: string[] = [];
    server.use(
      http.get(`${api}/catalogo/categorias`, ({ request }) => {
        requested.push(new URL(request.url).pathname);
        return HttpResponse.json({
          ok: true,
          datos: [{ IDCategoria: 1, Nombre: "Caballeros" }],
        });
      }),
      http.get(`${api}/catalogo/productos`, ({ request }) => {
        requested.push(request.url);
        return HttpResponse.json({
          ok: true,
          datos: products,
          totalRegistros: 1,
          totalPaginas: 1,
          paginaActual: 1,
        });
      }),
      http.get(`${api}/catalogo/productos/${productCode}`, ({ request }) => {
        requested.push(new URL(request.url).pathname);
        return HttpResponse.json({ ok: true, datos: productDetail });
      }),
    );
    const filters: CatalogFilters = {
      search: "camisa",
      category: "1",
      order: "RECIENTE",
      page: 1,
      inStock: false,
      priceRange: "all",
    };

    await expect(fetchCategories()).resolves.toEqual([
      { IDCategoria: 1, Nombre: "Caballeros" },
    ]);
    await expect(fetchProducts(filters, 6)).resolves.toMatchObject({
      datos: products,
      totalRegistros: 1,
    });
    await expect(fetchProduct(productCode)).resolves.toEqual(productDetail);

    expect(requested).toHaveLength(3);
    const productsUrl = new URL(requested[1]!);
    expect(productsUrl.searchParams.get("busqueda")).toBe("camisa");
    expect(productsUrl.searchParams.get("idCategoria")).toBe("1");
    expect(productsUrl.searchParams.get("limite")).toBe("6");
    expect(requested[2]).toBe(`/api/catalogo/productos/${productCode}`);
  });
});
