import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { RoleNavigation } from "./RoleNavigation";
import { SidebarProvider } from "./ui/sidebar";
import { TooltipProvider } from "./ui/tooltip";

describe("RoleNavigation", () => {
  it("uses the shadcn sidebar menu and limits items by role", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((media: string) => ({
        matches: false,
        media,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as MediaQueryList),
    });

    render(
      <MemoryRouter initialEntries={["/operaciones"]}>
        <TooltipProvider>
          <SidebarProvider>
            <RoleNavigation role="Operador" />
          </SidebarProvider>
        </TooltipProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation", { name: "Navegación de operaciones" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Resumen" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Pedidos" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="sidebar-menu"]')).toBeInTheDocument();
    expect(screen.getByText("Resumen")).toHaveClass("group-data-[collapsible=icon]:hidden");
    expect(screen.getByRole("link", { name: "Resumen" })).toHaveClass("group-data-[collapsible=icon]:justify-center");
  });
});
