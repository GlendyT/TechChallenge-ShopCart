import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { OperationsSectionPage } from "../OperationsSectionPage";

describe("OperationsSectionPage", () => {
  it("renders its heading, description and link back to the store", () => {
    render(
      <MemoryRouter>
        <OperationsSectionPage title="Promociones" description="Administra las promociones de la tienda." />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Promociones" })).toBeInTheDocument();
    expect(screen.getByText("Administra las promociones de la tienda.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ir a la tienda/ })).toHaveAttribute("href", "/");
  });
});
