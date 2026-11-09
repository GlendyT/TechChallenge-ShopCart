import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FormSheet } from "../FormSheet";

describe("FormSheet", () => {
  it("renders form content and notifies when the sheet is closed", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <FormSheet
        open
        onOpenChange={onOpenChange}
        title="Editar producto"
        description="Actualiza los datos del producto."
        footer={<button type="button">Guardar cambios</button>}
      >
        <label htmlFor="product-name">Nombre</label>
        <input id="product-name" defaultValue="Teclado" />
      </FormSheet>,
    );

    expect(screen.getByRole("dialog", { name: "Editar producto" })).toBeInTheDocument();
    expect(screen.getByText("Actualiza los datos del producto.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveValue("Teclado");
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
