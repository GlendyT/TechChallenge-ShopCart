import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportsPage } from "../ReportsPage";

const useReports = vi.hoisted(() => vi.fn());
vi.mock("../../hooks/useReports", () => ({ useReports }));

describe("ReportsPage filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useReports.mockReturnValue({ isPending: true, isFetching: false });
  });

  it("rejects an inverted date range without requesting a new report", () => {
    render(<ReportsPage />);
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2026-11-09" } });
    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "2026-11-01" } });
    fireEvent.click(screen.getByRole("button", { name: /Aplicar/ }));

    expect(screen.getByRole("alert")).toHaveTextContent("La fecha inicial debe ser anterior o igual a la fecha final.");
    expect(useReports.mock.calls.at(-1)?.[0]).toEqual(useReports.mock.calls[0]?.[0]);
  });

  it("rejects report ranges longer than 100 days", () => {
    render(<ReportsPage />);
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2026-01-01" } });
    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "2026-05-01" } });
    fireEvent.click(screen.getByRole("button", { name: /Aplicar/ }));

    expect(screen.getByRole("alert")).toHaveTextContent("El reporte de ventas admite rangos de hasta 100 días.");
  });
});
