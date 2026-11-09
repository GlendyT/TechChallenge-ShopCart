import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { formatPrice } from "../../../../lib/format";
import { products } from "../../../../test/fixtures";
import { ProductCard } from "../ProductCard";

describe("ProductCard", () => {
  it("shows product image, availability, price and product links", () => {
    render(
      <MemoryRouter>
        <ProductCard product={products[0]!} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("img", { name: products[0]!.Nombre })).toHaveAttribute(
      "src",
      products[0]!.ImagenPrincipal,
    );
    expect(screen.getByText("Disponible")).toBeInTheDocument();
    expect(screen.getByText(/249\.00/)).toHaveTextContent(
      formatPrice(products[0]!.PrecioMinimo!).replace(/\u00a0/g, " "),
    );
    expect(screen.getByRole("link", { name: `Ver ${products[0]!.Nombre}` })).toHaveAttribute(
      "href",
      `/producto/${products[0]!.CodigoPublico}`,
    );
    expect(screen.getByRole("link", { name: `Descubrir ${products[0]!.Nombre}` })).toHaveAttribute(
      "href",
      `/producto/${products[0]!.CodigoPublico}`,
    );
  });

  it("handles a product without image, price or available stock", () => {
    const product = {
      ...products[0]!,
      ImagenPrincipal: null,
      PrecioMinimo: null,
      PrecioMaximo: null,
      TotalStockDisponible: 0,
    };

    render(
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Agotado")).toBeInTheDocument();
    expect(screen.getByText("Consultar precio")).toBeInTheDocument();
    expect(screen.getByText("DON ARTURO")).toBeInTheDocument();
  });
});
