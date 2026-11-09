import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AddressInput } from "../../types/accountTypes";
import {
  accountProfileQueryKey,
  useAccountProfile,
} from "../useAccountProfile";
import { addressesQueryKey, useAddressMutations, useAddresses } from "../useAddresses";
import { myOrdersQueryKey, useMyOrders } from "../useMyOrders";

const mocks = vi.hoisted(() => ({
  fetchAccountProfile: vi.fn(),
  fetchAddresses: vi.fn(),
  fetchMyOrders: vi.fn(),
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("../../api/accountApi", () => ({
  fetchAccountProfile: mocks.fetchAccountProfile,
  fetchAddresses: mocks.fetchAddresses,
  fetchMyOrders: mocks.fetchMyOrders,
  createAddress: mocks.createAddress,
  updateAddress: mocks.updateAddress,
  deleteAddress: mocks.deleteAddress,
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { queryClient, Wrapper };
}

const addressInput: AddressInput = {
  nombreDestinatario: "Ana López",
  telefonoContacto: "55551234",
  direccionLinea1: "Avenida Central 10",
  direccionLinea2: null,
  ciudad: "Guatemala",
  departamento: "Guatemala",
  codigoPostal: null,
  esPrincipal: true,
};

describe("account data hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchAccountProfile.mockResolvedValue({ nombre: "Ana" });
    mocks.fetchAddresses.mockResolvedValue([]);
    mocks.fetchMyOrders.mockResolvedValue([]);
    mocks.createAddress.mockResolvedValue(undefined);
    mocks.updateAddress.mockResolvedValue(undefined);
    mocks.deleteAddress.mockResolvedValue(undefined);
  });

  it("loads the profile only when a user ID is available and keys it by ID", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const disabled = renderHook(() => useAccountProfile(null), { wrapper: Wrapper });

    expect(disabled.result.current.fetchStatus).toBe("idle");
    expect(mocks.fetchAccountProfile).not.toHaveBeenCalled();
    disabled.unmount();

    const { result } = renderHook(() => useAccountProfile(7), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mocks.fetchAccountProfile).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData([...accountProfileQueryKey, 7])).toEqual({
      nombre: "Ana",
    });
  });

  it("loads addresses only for an authenticated user and uses the account key", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const disabled = renderHook(() => useAddresses(null), { wrapper: Wrapper });

    expect(disabled.result.current.fetchStatus).toBe("idle");
    expect(mocks.fetchAddresses).not.toHaveBeenCalled();
    disabled.unmount();

    const { result } = renderHook(() => useAddresses(7), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mocks.fetchAddresses).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData([...addressesQueryKey, 7])).toEqual([]);
  });

  it("loads recent orders under the account orders key", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useMyOrders(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mocks.fetchMyOrders).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(myOrdersQueryKey)).toEqual([]);
  });

  it("runs address mutations, refreshes address data and reports success", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAddressMutations(), { wrapper: Wrapper });

    await result.current.create.mutateAsync(addressInput);
    await result.current.update.mutateAsync({ id: 42, address: addressInput });
    await result.current.remove.mutateAsync(42);

    expect(mocks.createAddress).toHaveBeenCalledWith(addressInput);
    expect(mocks.updateAddress).toHaveBeenCalledWith(42, addressInput);
    expect(mocks.deleteAddress.mock.calls[0]?.[0]).toBe(42);
    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: addressesQueryKey });
    expect(mocks.toastSuccess).toHaveBeenCalledTimes(3);
    expect(mocks.toastSuccess).toHaveBeenNthCalledWith(
      1,
      "Dirección agregada correctamente.",
    );
    expect(mocks.toastSuccess).toHaveBeenNthCalledWith(
      2,
      "Dirección actualizada correctamente.",
    );
    expect(mocks.toastSuccess).toHaveBeenNthCalledWith(
      3,
      "Dirección eliminada correctamente.",
    );
  });
});
