import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../../test/server";
import {
  listAdminProducts,
  listAudit,
  listUsers,
  saveCategory,
  setCategoryActive,
} from "../adminApi";

const api = "http://localhost:3000/api";

describe("administration API", () => {
  it("normalizes product search and maps server pagination metadata", async () => {
    let requestedUrl = "";
    server.use(
      http.get(`${api}/catalogo/productos`, ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({
          ok: true,
          datos: [{ IDProducto: 10, Nombre: "Teclado" }],
          totalPaginas: 4,
          totalRegistros: 36,
          paginaActual: 2,
        });
      }),
    );

    await expect(listAdminProducts("  teclado  ", 2, 10)).resolves.toEqual({
      datos: [{ IDProducto: 10, Nombre: "Teclado" }],
      totalPaginas: 4,
      totalRegistros: 36,
      paginaActual: 2,
    });

    const params = new URL(requestedUrl).searchParams;
    expect(params.get("busqueda")).toBe("teclado");
    expect(params.get("pagina")).toBe("2");
    expect(params.get("limite")).toBe("10");
    expect(params.get("incluirInactivos")).toBe("true");
    expect(params.get("orden")).toBe("NOMBRE_ASC");
  });

  it("trims user search and sends the audit filters supplied by the caller", async () => {
    let userUrl = "";
    let auditUrl = "";
    server.use(
      http.get(`${api}/auth/usuarios`, ({ request }) => {
        userUrl = request.url;
        return HttpResponse.json({ ok: true, datos: [] });
      }),
      http.get(`${api}/bitacora`, ({ request }) => {
        auditUrl = request.url;
        return HttpResponse.json({
          ok: true,
          datos: [],
          totalRegistros: 8,
          paginaActual: 2,
        });
      }),
    );

    await expect(listUsers("  Ana López  ")).resolves.toEqual([]);
    await expect(
      listAudit(new URLSearchParams({ pagina: "2", limite: "30", entidad: "Usuarios" })),
    ).resolves.toEqual({ datos: [], totalRegistros: 8, paginaActual: 2 });

    expect(new URL(userUrl).searchParams.get("busqueda")).toBe("Ana López");
    expect(new URL(auditUrl).searchParams.get("pagina")).toBe("2");
    expect(new URL(auditUrl).searchParams.get("limite")).toBe("30");
    expect(new URL(auditUrl).searchParams.get("entidad")).toBe("Usuarios");
  });

  it("uses POST or PUT for category saves and PATCH for its active state", async () => {
    const requests: { method: string; path: string; body?: unknown }[] = [];
    server.use(
      http.post(`${api}/catalogo/categorias`, async ({ request }) => {
        requests.push({
          method: request.method,
          path: new URL(request.url).pathname,
          body: await request.json(),
        });
        return HttpResponse.json({ ok: true, datos: {} }, { status: 201 });
      }),
      http.put(`${api}/catalogo/categorias/:id`, async ({ request }) => {
        requests.push({
          method: request.method,
          path: new URL(request.url).pathname,
          body: await request.json(),
        });
        return HttpResponse.json({ ok: true, datos: {} });
      }),
      http.patch(`${api}/catalogo/categorias/:id/estado`, async ({ request }) => {
        requests.push({
          method: request.method,
          path: new URL(request.url).pathname,
          body: await request.json(),
        });
        return HttpResponse.json({ ok: true, datos: {} });
      }),
    );
    const category = {
      nombre: "Tecnología",
      descripcion: "Dispositivos y accesorios",
      idCategoriaPadre: null,
    };

    await saveCategory(null, category);
    await saveCategory(7, category);
    await setCategoryActive(7, false);

    expect(requests).toEqual([
      {
        method: "POST",
        path: "/api/catalogo/categorias",
        body: category,
      },
      {
        method: "PUT",
        path: "/api/catalogo/categorias/7",
        body: category,
      },
      {
        method: "PATCH",
        path: "/api/catalogo/categorias/7/estado",
        body: { activo: false },
      },
    ]);
  });
});
