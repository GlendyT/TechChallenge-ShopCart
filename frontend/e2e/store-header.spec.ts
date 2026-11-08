import { expect, test } from "@playwright/test";

test("the store header filters the catalog by category and search", async ({ page }) => {
  await page.route("**/api/catalogo/categorias", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, datos: [{ IDCategoria: 1, Nombre: "Caballeros", Descripcion: "Prendas y moda para hombres." }] }),
  }));
  await page.route("**/api/catalogo/productos**", (route) => {
    const url = new URL(route.request().url());
    const hasOxfordSearch = url.searchParams.get("busqueda") === "Oxford";
    const matchingProduct = {
      IDProducto: 1,
      CodigoPublico: "e025b2fb-0987-40ad-b0ce-9010dc8ccf2e",
      IDCategoria: 1,
      Categoria: "Caballeros",
      Nombre: "Camisa Oxford Slim Fit",
      Descripcion: "Camisa de algodón.",
      Activo: true,
      PrecioMinimo: 249,
      PrecioMaximo: 249,
      TotalStockDisponible: 25,
      TotalVariantes: 1,
      ImagenPrincipal: null,
    };
    const products = hasOxfordSearch ? [matchingProduct] : [];
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, datos: products, totalRegistros: products.length, paginaActual: 1, tamanoPagina: 9, totalPaginas: 1 }),
    });
  });
  await page.route("**/api/carrito", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, datos: { IDCarrito: 1, TotalArticulos: 0, Subtotal: 0, items: [] } }),
  }));

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Explora nuestras categorías" })).toBeVisible();
  const categoryCarousel = page.getByRole("region", { name: "Categorías de productos" });
  await expect(categoryCarousel).toContainText("Prendas y moda para hombres.");
  await categoryCarousel.getByRole("button", { name: "Explorar categoría Caballeros" }).click();
  await expect(page).toHaveURL(/categoria=1/);
  await expect(page.getByRole("link", { name: "Don Arturo, ir al inicio" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();
  await expect(page.getByRole("link", { name: /carrito de compra/i })).toBeVisible();

  await page.getByRole("button", { name: "Ver categorías" }).click();
  await page.getByRole("menuitem", { name: "Caballeros" }).click();
  await expect(page).toHaveURL(/categoria=1/);

  await page.getByRole("textbox", { name: "Buscar productos" }).fill("Oxford");
  const suggestions = page.getByRole("region", { name: "Sugerencias de productos" });
  await expect(suggestions).toContainText("1 producto encontrado");
  await expect(suggestions.getByRole("link", { name: "Ver Camisa Oxford Slim Fit" })).toBeVisible();
  await expect(page).not.toHaveURL(/busqueda=Oxford/);
  await expect(page.getByRole("main")).toContainText("No encontramos productos en esta categoría.");

  await page.getByRole("textbox", { name: "Buscar productos" }).fill("xyz-no-existe");
  await expect(suggestions).toContainText("No encontramos productos para “xyz-no-existe”.");
  await expect(page.getByRole("main")).toContainText("No encontramos productos en esta categoría.");

  await page.getByRole("textbox", { name: "Buscar productos" }).fill("Oxford");
  await expect(suggestions.getByRole("link", { name: "Ver Camisa Oxford Slim Fit" })).toBeVisible();
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page).toHaveURL(/busqueda=Oxford/);
  await expect(page).toHaveURL(/categoria=1/);
});
