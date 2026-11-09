import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StoreBenefits } from "../StoreBenefits";

describe("StoreBenefits", () => {
  it("shows the store's three shopping benefits", () => {
    render(<StoreBenefits />);

    expect(
      screen.getByRole("region", {
        name: "Beneficios de comprar en Don Arturo",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Envío nacional")).toBeInTheDocument();
    expect(screen.getByText("Hasta tu puerta")).toBeInTheDocument();
    expect(screen.getByText("Compra segura")).toBeInTheDocument();
    expect(screen.getByText("Tu información protegida")).toBeInTheDocument();
    expect(screen.getByText("Calidad que se siente")).toBeInTheDocument();
    expect(screen.getByText("Materiales seleccionados")).toBeInTheDocument();
  });
});
