import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "../../../test/server";
import type { AdminCategory, AdminProduct } from "../types/adminTypes";
import { ProductEditSheet } from "./ProductEditSheet";

const api = "http://localhost:3000/api";

const product: AdminProduct = {
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
};

const categories: AdminCategory[] = [
  {
    IDCategoria: 1,
    IDCategoriaPadre: null,
    CategoriaPadre: null,
    Nombre: "Tecnología",
    Descripcion: "Productos tecnológicos.",
    Activo: true,
    TotalProductosActivos: 1,
  },
];

describe("ProductEditSheet", () => {
  it("edits a product and manages its image URLs", async () => {
    const user = userEvent.setup();
    const initialImage = {
      IDProductoImagen: 8,
      ImagenURL: "https://shop.example/old.jpg",
      EsPrincipal: true,
      Orden: 1,
    };
    let images: Array<{
      IDProductoImagen: number;
      ImagenURL: string;
      EsPrincipal: boolean;
      Orden: number;
    }> = [{ ...initialImage }];
    let productUpdate: Record<string, unknown> | undefined;
    let imageCreate: Record<string, unknown> | undefined;
    let imageUpdate: Record<string, unknown> | undefined;
    let deletedImageId = 0;

    server.use(
      http.get(`${api}/catalogo/productos/product-code`, () =>
        HttpResponse.json({
          ok: true,
          datos: {
            ...product,
            variantes: [
              {
                IDVariante: 51,
                SKU: "P4-GRIS-L-01",
                Nombre: "Gris talla L",
                Talla: "L",
                Color: "Gris",
                Precio: 199,
                ExistenciaDisponible: 8,
                Activo: true,
              },
            ],
            imagenes: images,
          },
        }),
      ),
      http.put(`${api}/catalogo/productos/4`, async ({ request }) => {
        productUpdate = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          ok: true,
          datos: { ...product, ...productUpdate },
        });
      }),
      http.post(`${api}/catalogo/productos/4/imagenes`, async ({ request }) => {
        imageCreate = (await request.json()) as Record<string, unknown>;
        const newImage = {
          IDProductoImagen: 9,
          IDProducto: 4,
          ImagenURL: imageCreate.imagenUrl as string,
          EsPrincipal: imageCreate.esPrincipal === true || images.length === 0,
          Orden: 2,
        };
        if (newImage.EsPrincipal) {
          images = images.map((image) => ({ ...image, EsPrincipal: false }));
        }
        images = [...images, newImage];
        return HttpResponse.json({ ok: true, datos: newImage }, { status: 201 });
      }),
      http.put(`${api}/catalogo/productos/4/imagenes/8`, async ({ request }) => {
        imageUpdate = (await request.json()) as Record<string, unknown>;
        images = images.map((image) => ({
          ...image,
          ...(image.IDProductoImagen === 8
            ? {
                ImagenURL: imageUpdate.imagenUrl as string,
                Orden: imageUpdate.orden as number,
              }
            : {}),
          EsPrincipal:
            image.IDProductoImagen === 8
              ? imageUpdate.esPrincipal === true
              : imageUpdate.esPrincipal === true
                ? false
                : image.EsPrincipal,
        }));
        return HttpResponse.json({ ok: true, datos: images[0] });
      }),
      http.delete(`${api}/catalogo/productos/4/imagenes/9`, () => {
        deletedImageId = 9;
        images = images.filter((image) => image.IDProductoImagen !== 9);
        return HttpResponse.json({ ok: true, mensaje: "Imagen eliminada." });
      }),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const onOpenChange = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <ProductEditSheet
          product={product}
          categories={categories}
          onOpenChange={onOpenChange}
        />
      </QueryClientProvider>,
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Editar producto: Audífonos",
    });
    const nameInput = within(dialog).getByLabelText("Nombre");
    expect(
      within(dialog).getByRole("table", { name: "Variantes de Audífonos" }),
    ).toHaveTextContent("P4-GRIS-L-01");
    await user.clear(nameInput);
    await user.type(nameInput, "Audífonos Bluetooth");
    const descriptionInput = within(dialog).getByLabelText("Descripción");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Audífonos Bluetooth con estuche de carga.");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(productUpdate).toEqual({
        idCategoria: 1,
        nombre: "Audífonos Bluetooth",
        descripcion: "Audífonos Bluetooth con estuche de carga.",
      });
    });
    expect(onOpenChange).toHaveBeenNthCalledWith(1, false);

    await user.type(
      within(dialog).getByLabelText("URL de nueva imagen"),
      "https://shop.example/new.jpg",
    );
    await user.click(within(dialog).getByLabelText("Usar como imagen principal"));
    await user.click(within(dialog).getByRole("button", { name: "Agregar URL" }));

    await waitFor(() => {
      expect(imageCreate).toEqual({
        imagenUrl: "https://shop.example/new.jpg",
        esPrincipal: true,
      });
    });
    expect(onOpenChange).toHaveBeenNthCalledWith(2, false);

    const existingImage = await screen.findByRole("group", { name: "Imagen 1" });
    const imageUrlInput = within(existingImage).getByLabelText("URL de imagen");
    await user.clear(imageUrlInput);
    await user.type(imageUrlInput, "https://shop.example/updated.jpg");
    await user.click(within(existingImage).getByRole("button", { name: "Guardar imagen 1" }));

    await waitFor(() => {
      expect(imageUpdate).toEqual({
        imagenUrl: "https://shop.example/updated.jpg",
        esPrincipal: false,
        orden: 1,
      });
    });
    expect(onOpenChange).toHaveBeenNthCalledWith(3, false);

    await user.click(await screen.findByRole("button", { name: "Eliminar imagen 2" }));
    await waitFor(() => expect(deletedImageId).toBe(9));
    expect(onOpenChange).toHaveBeenNthCalledWith(4, false);
  });
});
