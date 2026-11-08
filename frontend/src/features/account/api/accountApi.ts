import { apiRequest } from "../../../shared/api/httpClient";
import type { AccountProfile, Address, AddressInput, OrderSummary } from "../types/accountTypes";

export function fetchAccountProfile(): Promise<AccountProfile> {
  return apiRequest<AccountProfile>("/auth/me").then(({ datos }) => datos);
}

export function fetchMyOrders(): Promise<OrderSummary[]> {
  return apiRequest<OrderSummary[]>("/pedidos/mis-pedidos?pagina=1&limite=5")
    .then(({ datos }) => datos);
}

export function fetchAddresses(): Promise<Address[]> {
  return apiRequest<Address[]>("/auth/direcciones").then(({ datos }) => datos);
}

export async function createAddress(input: AddressInput): Promise<void> {
  await apiRequest("/auth/direcciones", { method: "POST", body: JSON.stringify(input) });
}

export async function updateAddress(id: number, input: AddressInput): Promise<void> {
  await apiRequest(`/auth/direcciones/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deleteAddress(id: number): Promise<void> {
  await apiRequest(`/auth/direcciones/${id}`, { method: "DELETE" });
}
