import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../../test/server";
import { AdminUsersPage } from "../AdminUsersPage";

const api = "http://localhost:3000/api";

const users = Array.from({ length: 11 }, (_, index) => ({
  IDUsuario: index + 1,
  IDRol: 2,
  Rol: "Cliente",
  Nombre: `Usuario ${index + 1}`,
  Apellido: "Prueba",
  Correo: `usuario${index + 1}@example.com`,
  Telefono: null,
  Activo: true,
  FechaCreacion: "2026-11-01T00:00:00.000Z",
}));

describe("AdminUsersPage", () => {
  it("paginates the loaded user list using the shared table footer", async () => {
    server.use(
      http.get(`${api}/auth/usuarios`, () =>
        HttpResponse.json({ ok: true, datos: users }),
      ),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={queryClient}>
        <AdminUsersPage />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole("table", { name: "Usuarios de administración" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Usuario 11 Prueba")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /página siguiente/i }));
    expect(await screen.findByText("Usuario 11 Prueba")).toBeInTheDocument();
    expect(screen.getByText(/Página 2 de 2/)).toBeInTheDocument();
  });
});
