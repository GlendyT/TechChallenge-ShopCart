import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { Toaster } from "../../../../components/ui/sonner";
import { server } from "../../../../test/server";
import CategoriesSection from "../CategoriesSection";

const api = "http://localhost:3000/api";

describe("CategoriesSection", () => {
  it("creates a category with trimmed values", async () => {
    const user = userEvent.setup();
    let createdCategory: Record<string, unknown> | undefined;
    server.use(
      http.post(`${api}/catalogo/categorias`, async ({ request }) => {
        createdCategory = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ok: true, datos: { IDCategoria: 8 } }, { status: 201 });
      }),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <>
          <CategoriesSection rows={[]} />
          <Toaster />
        </>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Nueva categoría" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Nombre" }), {
      target: { value: "  Tecnología  " },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Descripción" }), {
      target: { value: "  Dispositivos y accesorios  " },
    });
    await user.click(screen.getByRole("button", { name: "Guardar categoría" }));

    await waitFor(() => {
      expect(createdCategory).toEqual({
        nombre: "Tecnología",
        descripcion: "Dispositivos y accesorios",
        idCategoriaPadre: null,
      });
    });
    expect(await screen.findByText("Categoría creada correctamente.")).toBeInTheDocument();
  });
});
