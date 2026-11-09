import { CircleAlert } from "lucide-react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageState } from "../PageState";

describe("PageState", () => {
  it("renders an empty or error state with an optional action", () => {
    const { rerender, container } = render(
      <PageState
        icon={CircleAlert}
        title="No se encontraron pedidos"
        description="Prueba con otros filtros."
        action={<button type="button">Limpiar filtros</button>}
        tone="error"
      />,
    );

    expect(screen.getByRole("heading", { name: "No se encontraron pedidos" })).toBeInTheDocument();
    expect(screen.getByText("Prueba con otros filtros.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Limpiar filtros" })).toBeInTheDocument();
    expect(container.querySelector("section")).toHaveAttribute("aria-live", "polite");
    expect(container.querySelector("section > span")).toHaveClass("text-dn-rojo");

    rerender(
      <PageState
        icon={CircleAlert}
        title="Cargando catálogo"
        description="Los productos aparecerán aquí."
      />,
    );

    expect(screen.queryByRole("button", { name: "Limpiar filtros" })).not.toBeInTheDocument();
    expect(container.querySelector("section > span")).toHaveClass("text-dn-azul");
  });
});
