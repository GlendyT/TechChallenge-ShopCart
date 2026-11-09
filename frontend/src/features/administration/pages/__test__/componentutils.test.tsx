import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminSection, AdminStatus, ErrorText } from "../componentutils";

describe("administration page utilities", () => {
  it("shows active and inactive status labels", () => {
    const { rerender } = render(<AdminStatus active />);
    expect(screen.getByText("Activo")).toBeInTheDocument();

    rerender(<AdminStatus active={false} />);
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
  });

  it("renders section content and displays error text only when provided", () => {
    const { rerender } = render(
      <AdminSection title="Categorías" description="Configura el catálogo.">
        <p>Contenido de la sección</p>
      </AdminSection>,
    );

    expect(screen.getByText("Categorías")).toBeInTheDocument();
    expect(screen.getByText("Configura el catálogo.")).toBeInTheDocument();
    expect(screen.getByText("Contenido de la sección")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    rerender(
      <>
        <AdminSection title="Categorías" description="Configura el catálogo.">
          <p>Contenido de la sección</p>
        </AdminSection>
        <ErrorText>La categoría no se pudo guardar.</ErrorText>
      </>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "La categoría no se pudo guardar.",
    );
  });
});
