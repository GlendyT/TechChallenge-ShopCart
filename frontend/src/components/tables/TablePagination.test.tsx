import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TablePagination } from "./TablePagination";

describe("TablePagination", () => {
  it("offers the supported page sizes and reports the selected size", async () => {
    const onPageSizeChange = vi.fn();
    const user = userEvent.setup();

    render(
      <TablePagination
        currentPage={1}
        totalPages={3}
        totalItems={25}
        pageSize={10}
        itemLabel="pedidos"
        onPageChange={vi.fn()}
        onPageSizeChange={onPageSizeChange}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Filas por página" }));
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "10",
      "20",
      "30",
      "50",
      "100",
    ]);
    await user.click(screen.getByRole("option", { name: "50" }));

    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });
});
