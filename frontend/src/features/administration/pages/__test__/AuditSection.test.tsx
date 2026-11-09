import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AuditRecord } from "../../types/adminTypes";
import AuditSection from "../AuditSection";

const auditRecord: AuditRecord = {
  IDBitacora: 1,
  Entidad: "Productos",
  IDRegistro: "4",
  Accion: "MODIFICAR",
  ValorAnterior: '{"activo":false}',
  ValorNuevo: "valor sin formato JSON",
  IDUsuario: 7,
  NombreUsuario: "Admin",
  CorreoUsuario: "admin@example.com",
  DireccionIP: null,
  Fecha: "2026-11-08T12:00:00.000Z",
  TotalRegistros: 1,
};

describe("AuditSection", () => {
  it("renders audit data, preserves invalid JSON and forwards entity filters", async () => {
    const user = userEvent.setup();
    const onEntityChange = vi.fn();

    render(
      <AuditSection
        rows={[auditRecord]}
        total={1}
        page={1}
        pageSize={10}
        isLoading={false}
        totalPages={1}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        entity=""
        onEntityChange={onEntityChange}
        action=""
        onActionChange={vi.fn()}
        start=""
        onStartChange={vi.fn()}
        end=""
        onEndChange={vi.fn()}
      />,
    );

    const table = screen.getByRole("table", { name: "Bitácora de auditoría" });
    expect(within(table).getByText("Admin")).toBeInTheDocument();
    expect(within(table).getByText("MODIFICAR")).toBeInTheDocument();

    await user.click(screen.getByText("Ver cambios"));
    const changes = screen.getByText(/"anterior"/).closest("pre");
    expect(changes).toHaveTextContent('"activo": false');
    expect(changes).toHaveTextContent("valor sin formato JSON");

    await user.click(screen.getAllByRole("combobox")[0]);
    await user.click(screen.getByRole("option", { name: "Usuarios" }));
    expect(onEntityChange).toHaveBeenCalledWith("Usuarios");
  });
});
