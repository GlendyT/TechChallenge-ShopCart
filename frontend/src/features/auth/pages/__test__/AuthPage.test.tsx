import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthContextValue } from "../../../../shared/auth/AuthContext";
import { createAuthContextValue, createTestUser } from "../../../../test/authContextValue";
import { AuthPage } from "../AuthPage";

const toastMocks = vi.hoisted(() => ({ success: vi.fn() }));

vi.mock("sonner", () => ({
  toast: { success: toastMocks.success },
}));

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="current-location">
      {location.pathname}
      {location.search}
    </output>
  );
}

function renderAuthPage(
  mode: "signin" | "signup",
  initialEntry: string,
  overrides: Partial<Pick<AuthContextValue, "signIn" | "signUp">> = {},
) {
  return render(
    <AuthContext.Provider
      value={{ ...createAuthContextValue(), ...overrides }}
    >
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <AuthPage mode={mode} />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("AuthPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates the selected portal and routes an administrator to its workspace", async () => {
    const user = userEvent.setup();
    const signIn = vi
      .fn()
      .mockResolvedValue({ usuario: createTestUser("Administrador") });
    renderAuthPage("signin", "/acceso?portal=administrador", { signIn });

    await user.type(
      screen.getByRole("textbox", { name: "Correo electrónico" }),
      "admin@example.com",
    );
    await user.type(
      screen.getByLabelText("Contraseña"),
      "secret123",
    );
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    await waitFor(() =>
      expect(screen.getByTestId("current-location")).toHaveTextContent(
        "/administracion/catalogo",
      ),
    );
    expect(signIn).toHaveBeenCalledWith(
      { correo: "admin@example.com", password: "secret123" },
      "Administrador",
    );
    expect(toastMocks.success).toHaveBeenCalledWith(
      "Sesión iniciada correctamente.",
    );
  });

  it("preserves a requested route after customer sign-in", async () => {
    const user = userEvent.setup();
    const signIn = vi.fn().mockResolvedValue({ usuario: createTestUser("Cliente") });
    renderAuthPage("signin", "/acceso?next=%2Fcheckout", { signIn });

    await user.type(
      screen.getByRole("textbox", { name: "Correo electrónico" }),
      "ana@example.com",
    );
    await user.type(screen.getByLabelText("Contraseña"), "secret123");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    await waitFor(() =>
      expect(screen.getByTestId("current-location")).toHaveTextContent("/checkout"),
    );
  });

  it("shows validation messages without calling the sign-in action", async () => {
    const user = userEvent.setup();
    const signIn = vi.fn();
    renderAuthPage("signin", "/acceso", { signIn });

    await user.type(
      screen.getByRole("textbox", { name: "Correo electrónico" }),
      "correo-invalido",
    );
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(screen.getByText("Escribe un correo válido.")).toBeInTheDocument();
    expect(screen.getByText("La contraseña es obligatoria.")).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("shows the authentication error returned by the server", async () => {
    const user = userEvent.setup();
    const signIn = vi.fn().mockRejectedValue(new Error("Credenciales incorrectas."));
    renderAuthPage("signin", "/acceso?portal=cliente", { signIn });

    await user.type(
      screen.getByRole("textbox", { name: "Correo electrónico" }),
      "ana@example.com",
    );
    await user.type(screen.getByLabelText("Contraseña"), "secret123");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Credenciales incorrectas.",
    );
  });

  it("creates a customer account and routes to the account page", async () => {
    const user = userEvent.setup();
    const signUp = vi.fn().mockResolvedValue({ usuario: createTestUser("Cliente") });
    renderAuthPage("signup", "/registro?portal=cliente", { signUp });

    await user.type(screen.getByRole("textbox", { name: "Nombre" }), "Ana");
    await user.type(screen.getByRole("textbox", { name: "Apellido" }), "López");
    await user.type(
      screen.getByRole("textbox", { name: "Correo electrónico" }),
      "ana@example.com",
    );
    await user.type(screen.getByLabelText("Contraseña"), "secret123");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() =>
      expect(screen.getByTestId("current-location")).toHaveTextContent("/cuenta"),
    );
    expect(signUp).toHaveBeenCalledWith({
      nombre: "Ana",
      apellido: "López",
      correo: "ana@example.com",
      password: "secret123",
      telefono: "",
    });
    expect(toastMocks.success).toHaveBeenCalledWith("Cuenta creada correctamente.");
  });

  it("does not render public registration for staff portals", () => {
    const signUp = vi.fn();
    renderAuthPage("signup", "/registro?portal=operador", { signUp });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "El registro público está disponible únicamente para clientes.",
    );
    expect(screen.queryByRole("button", { name: "Crear cuenta" })).not.toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });
});
