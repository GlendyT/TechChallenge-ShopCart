import { apiRequest, getGuestToken } from '../api/client'
import type { Cart } from './types'

export const cartQueryKey = ['cart'] as const

export function fetchCart() {
  return apiRequest<Cart>('/carrito', { guestToken: getGuestToken() }).then((response) => response.datos)
}

export function updateCartItem(idVariante: number, cantidad: number) {
  return apiRequest<Cart>('/carrito/items', {
    method: 'POST',
    guestToken: getGuestToken(),
    body: JSON.stringify({ idVariante, cantidad }),
  }).then((response) => response.datos)
}

export function removeCartItem(idVariante: number) {
  return apiRequest<Cart>(`/carrito/items/${idVariante}`, {
    method: 'DELETE',
    guestToken: getGuestToken(),
  }).then((response) => response.datos)
}
