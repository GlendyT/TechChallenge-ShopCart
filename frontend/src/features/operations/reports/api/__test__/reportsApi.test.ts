import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../../../test/server";
import { fetchReports } from "../reportsApi";

const api = "http://localhost:3000/api";

describe("reports API", () => {
  it("requests the four report datasets with the selected date and inactivity filters", async () => {
    const searches: string[] = [];
    server.use(
      http.get(`${api}/reportes/*`, ({ request }) => {
        searches.push(`${new URL(request.url).pathname}${new URL(request.url).search}`);
        return HttpResponse.json({ ok: true, datos: [] });
      }),
    );

    const reports = await fetchReports({ fechaInicio: "2026-11-01", fechaFin: "2026-11-09", agrupacion: "SEMANA", minutosInactividad: 360 });

    expect(reports).toEqual({ ventasPeriodo: [], topProductos: [], ventasCategoria: [], carritosAbandonados: [] });
    expect(searches).toHaveLength(4);
    expect(searches.find((path) => path.includes("ventas-periodo"))).toContain("agrupacion=SEMANA");
    expect(searches.find((path) => path.includes("carritos-abandonados"))).toContain("minutosInactividad=360");
    expect(searches.filter((path) => !path.includes("carritos-abandonados")).every((path) => path.includes("fechaInicio=2026-11-01T00%3A00%3A00.000"))).toBe(true);
  });
});
