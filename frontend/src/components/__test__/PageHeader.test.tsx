import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "../PageHeader";

describe("PageHeader", () => {
  it("associates its title with the header and renders adjacent content", () => {
    render(
      <PageHeader
        eyebrow="Operaciones"
        title="Pedidos"
        titleId="orders-heading"
        description="Revisa los pedidos de la tienda."
        titleContent={<nav aria-label="Secciones">Secciones</nav>}
      >
        <input aria-label="Buscar pedidos" />
      </PageHeader>,
    );

    expect(screen.getByRole("banner")).toHaveAttribute(
      "aria-labelledby",
      "orders-heading",
    );
    expect(screen.getByRole("heading", { name: "Pedidos", level: 1 })).toHaveAttribute(
      "id",
      "orders-heading",
    );
    expect(screen.getByText("Operaciones")).toBeInTheDocument();
    expect(screen.getByText("Revisa los pedidos de la tienda.")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Secciones" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Buscar pedidos" })).toBeInTheDocument();
  });
});
