import { apiRequest } from "../../../shared/api/httpClient";
import type { Address, OrderSummary } from "../types/accountTypes";

export function fetchMyOrders(): Promise<OrderSummary[]> {
  return apiRequest<OrderSummary[]>("/pedidos/mis-pedidos?pagina=1&limite=5")
    .then(({ datos }) => datos);
}

export function fetchAddresses(): Promise<Address[]> {
  return apiRequest<Address[]>("/auth/direcciones").then(({ datos }) => datos);
}
