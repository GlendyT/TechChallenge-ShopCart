import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataTable, type DataTableColumn } from "./DataTable";

interface ProductRow {
  id: number;
  name: string;
  stock: number;
}

describe("DataTable", () => {
  it("renders reusable column definitions and keyed rows", () => {
    const columns: DataTableColumn<ProductRow>[] = [
      { id: "name", header: "Producto", cell: (product) => product.name },
      { id: "stock", header: "Existencias", cell: (product) => product.stock },
    ];

    render(
      <DataTable
        ariaLabel="Inventario de productos"
        columns={columns}
        data={[{ id: 1, name: "Teclado", stock: 12 }]}
        getRowId={(product) => product.id}
        containerClassName="max-h-[65vh] overflow-y-auto"
      />,
    );

    expect(
      screen.getByRole("table", { name: "Inventario de productos" }).parentElement,
    ).toHaveClass("max-h-[65vh]", "overflow-y-auto");
    expect(
      screen.getByRole("table", { name: "Inventario de productos" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Producto" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Teclado" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "12" })).toBeInTheDocument();
  });
});
