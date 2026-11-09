import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { Toaster } from "../../../../components/ui/sonner";
import { server } from "../../../../test/server";
import CouponsSection from "../CouponsSection";

const api = "http://localhost:3000/api";

describe("CouponsSection", () => {
  it("normalizes a coupon code and submits discount and validity data", async () => {
    const user = userEvent.setup();
    let createdCoupon: Record<string, unknown> | undefined;
    server.use(
      http.post(`${api}/cupones`, async ({ request }) => {
        createdCoupon = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ok: true, datos: { IDCupon: 12 } }, { status: 201 });
      }),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <>
          <CouponsSection rows={[]} categories={[]} />
          <Toaster />
        </>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Nuevo cupón" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Código" }), {
      target: { value: "  verano15  " },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Valor" }), {
      target: { value: "15" },
    });
    fireEvent.change(screen.getByLabelText("Inicio"), {
      target: { value: "2026-11-10T09:00" },
    });
    fireEvent.change(screen.getByLabelText("Fin"), {
      target: { value: "2026-11-30T18:00" },
    });
    await user.click(screen.getByRole("button", { name: "Crear cupón" }));

    await waitFor(() => expect(createdCoupon).toBeDefined());
    expect(createdCoupon).toMatchObject({
      codigo: "VERANO15",
      tipoDescuento: "PORCENTAJE",
      valorDescuento: 15,
      montoMinimoCompra: 0,
      limiteUsosTotal: 100,
      limiteUsosPorCliente: 1,
      idCategoria: null,
    });
    expect(createdCoupon?.fechaInicio).toBe(
      new Date("2026-11-10T09:00").toISOString(),
    );
    expect(createdCoupon?.fechaFin).toBe(
      new Date("2026-11-30T18:00").toISOString(),
    );
    expect(await screen.findByText("Cupón creado correctamente.")).toBeInTheDocument();
  });

  it("prevents submission when the end date is not later than the start date", async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <CouponsSection rows={[]} categories={[]} />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Nuevo cupón" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Código" }), {
      target: { value: "VERANO15" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Valor" }), {
      target: { value: "15" },
    });
    fireEvent.change(screen.getByLabelText("Inicio"), {
      target: { value: "2026-11-30T18:00" },
    });
    fireEvent.change(screen.getByLabelText("Fin"), {
      target: { value: "2026-11-10T09:00" },
    });

    expect(
      screen.getByText("La fecha final debe ser posterior a la fecha de inicio."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear cupón" })).toBeDisabled();
  });
});
