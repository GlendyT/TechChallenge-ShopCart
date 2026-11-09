import { apiRequest, getGuestToken } from "../../../shared/api/httpClient";
import type { Cart } from "../types/cartTypes";

export const cartQueryKey = ["cart"] as const;

export function fetchCart(): Promise<Cart> {
  return apiRequest<Cart>("/carrito", { guestToken: getGuestToken() }).then(
    ({ datos }) => datos,
  );
}

export function updateCartItem(idVariante: number, cantidad: number): Promise<Cart> {
  return apiRequest<Cart>("/carrito/items", {
    method: "POST",
    guestToken: getGuestToken(),
    body: JSON.stringify({ idVariante, cantidad }),
  }).then(({ datos }) => datos);
}

export function removeCartItem(idVariante: number): Promise<Cart> {
  return apiRequest<Cart>(`/carrito/items/${idVariante}`, {
    method: "DELETE",
    guestToken: getGuestToken(),
  }).then(({ datos }) => datos);
}

export function clearCart(): Promise<Cart> {
  return apiRequest<Cart>("/carrito", { method: "DELETE", guestToken: getGuestToken() }).then(({ datos }) => datos);
}
