import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Address } from "../../types/accountTypes";
import { AddressManager } from "../AddressManager";

const mutationMocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  resetCreate: vi.fn(),
  resetUpdate: vi.fn(),
  resetRemove: vi.fn(),
}));

vi.mock("../../hooks/useAddresses", () => ({
  useAddressMutations: () => ({
    create: {
      error: null,
      isPending: false,
      mutateAsync: mutationMocks.create,
      reset: mutationMocks.resetCreate,
    },
    update: {
      error: null,
      isPending: false,
      mutateAsync: mutationMocks.update,
      reset: mutationMocks.resetUpdate,
    },
    remove: {
      error: null,
      isPending: false,
      mutateAsync: mutationMocks.remove,
      reset: mutationMocks.resetRemove,
    },
  }),
}));

const savedAddress: Address = {
  IDDireccion: 42,
  NombreDestinatario: "Ana López",
  TelefonoContacto: "55551234",
  DireccionLinea1: "Avenida Central 10",
  DireccionLinea2: "Casa 4",
  Ciudad: "Guatemala",
  Departamento: "Guatemala",
  CodigoPostal: "01001",
  EsPrincipal: true,
};

describe("AddressManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutationMocks.create.mockResolvedValue(undefined);
    mutationMocks.update.mockResolvedValue(undefined);
    mutationMocks.remove.mockResolvedValue(undefined);
  });

  it("creates an address with trimmed fields and null optional values", async () => {
    const user = userEvent.setup();
    render(<AddressManager addresses={[]} />);

    await user.click(screen.getByRole("button", { name: "Agregar dirección" }));
    await user.type(screen.getByRole("textbox", { name: "Nombre del destinatario" }), " Ana López ");
    await user.type(screen.getByRole("textbox", { name: "Teléfono" }), " 55551234 ");
    await user.type(screen.getByRole("textbox", { name: "Dirección" }), " Avenida Central 10 ");
    await user.type(screen.getByRole("textbox", { name: "Ciudad" }), " Guatemala ");
    await user.type(screen.getByRole("textbox", { name: "Departamento" }), " Guatemala ");
    await user.click(screen.getByRole("button", { name: "Guardar dirección" }));

    expect(mutationMocks.create).toHaveBeenCalledWith({
      nombreDestinatario: "Ana López",
      telefonoContacto: "55551234",
      direccionLinea1: "Avenida Central 10",
      direccionLinea2: null,
      ciudad: "Guatemala",
      departamento: "Guatemala",
      codigoPostal: null,
      esPrincipal: false,
    });
    expect(await screen.findByRole("button", { name: "Agregar dirección" })).toBeInTheDocument();
  });

  it("prefills and updates an existing address", async () => {
    const user = userEvent.setup();
    render(<AddressManager addresses={[savedAddress]} />);

    await user.click(
      screen.getByRole("button", { name: "Editar dirección de Ana López" }),
    );
    expect(screen.getByRole("textbox", { name: "Nombre del destinatario" })).toHaveValue(
      "Ana López",
    );
    expect(screen.getByRole("checkbox", { name: "Marcar como dirección principal" })).toBeChecked();

    const recipient = screen.getByRole("textbox", { name: "Nombre del destinatario" });
    await user.clear(recipient);
    await user.type(recipient, "Ana García");
    await user.click(screen.getByRole("button", { name: "Guardar dirección" }));

    expect(mutationMocks.update).toHaveBeenCalledWith({
      id: 42,
      address: {
        nombreDestinatario: "Ana García",
        telefonoContacto: "55551234",
        direccionLinea1: "Avenida Central 10",
        direccionLinea2: "Casa 4",
        ciudad: "Guatemala",
        departamento: "Guatemala",
        codigoPostal: "01001",
        esPrincipal: true,
      },
    });
  });

  it("asks for confirmation before deleting an address", async () => {
    const user = userEvent.setup();
    render(<AddressManager addresses={[savedAddress]} />);

    await user.click(
      screen.getByRole("button", { name: "Eliminar dirección de Ana López" }),
    );
    expect(screen.getByRole("dialog", { name: "Eliminar dirección" })).toBeInTheDocument();
    expect(screen.getByText(/¿Eliminar la dirección de Ana López\?/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Eliminar$/ }));

    expect(mutationMocks.remove).toHaveBeenCalledWith(42);
    expect(await screen.findByRole("button", { name: "Eliminar dirección de Ana López" })).toBeInTheDocument();
  });
});
