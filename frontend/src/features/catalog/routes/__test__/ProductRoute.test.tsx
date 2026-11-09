import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProductRoute } from "../ProductRoute";

vi.mock("../../pages/ProductPage", () => ({
  ProductPage: ({ codigoPublico }: { codigoPublico: string }) => (
    <p>Product detail: {codigoPublico}</p>
  ),
}));

function renderProductRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>Store home</p>} />
        <Route path="/producto" element={<ProductRoute />} />
        <Route path="/producto/:codigoPublico" element={<ProductRoute />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProductRoute", () => {
  it("renders the product page with its public code", () => {
    renderProductRoute("/producto/product-code");

    expect(screen.getByText("Product detail: product-code")).toBeInTheDocument();
  });

  it("redirects to the store when the public code is missing", () => {
    renderProductRoute("/producto");

    expect(screen.getByText("Store home")).toBeInTheDocument();
  });
});
