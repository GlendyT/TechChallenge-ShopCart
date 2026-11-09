import { apiRequest } from "../../../shared/api/httpClient";
import type { CreatedOrder, ConfirmCheckoutInput } from "../types/checkoutTypes";

export function validateCoupon(code: string) {
  return apiRequest<{ MontoDescuento?: number }>("/cupones/validar", {
    method: "POST",
    body: JSON.stringify({ codigo: code }),
  });
}

export async function submitCheckout(input: ConfirmCheckoutInput): Promise<CreatedOrder> {
  await apiRequest("/pedidos/checkout/reserva", {
    method: "POST",
    body: JSON.stringify({ claveIdempotencia: input.claveIdempotencia }),
  });
  const response = await apiRequest<CreatedOrder>("/pedidos/checkout/confirmar", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.datos;
}

export function fetchOrder(publicCode: string): Promise<CreatedOrder> {
  return apiRequest<CreatedOrder>(`/pedidos/${encodeURIComponent(publicCode)}`)
    .then(({ datos }) => datos);
}
