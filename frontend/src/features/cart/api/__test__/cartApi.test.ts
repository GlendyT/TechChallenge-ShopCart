import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearCart,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from "../cartApi";
import {  filledCart } from "../../../../test/fixtures";
import { server } from "../../../../test/server";

describe("cart API", () => {
  beforeEach(() => localStorage.setItem("shopcart.guest-token", "guest-token-test"));

  it("reads and mutates the cart while sending the guest token", async () => {
    const requests: { method: string; path: string; token: string | null; body?: unknown }[] = [];
    const record = async (request: Request) => {
      const body = request.method === "POST" ? await request.json() : undefined;
      requests.push({
        method: request.method,
        path: new URL(request.url).pathname,
        token: request.headers.get("x-guest-token"),
        ...(body === undefined ? {} : { body }),
      });
      return HttpResponse.json({ ok: true, datos: filledCart });
    };
    server.use(
      http.get("http://localhost:3000/api/carrito", ({ request }) => record(request)),
      http.post("http://localhost:3000/api/carrito/items", ({ request }) => record(request)),
      http.delete("http://localhost:3000/api/carrito/items/:id", ({ request }) => record(request)),
      http.delete("http://localhost:3000/api/carrito", ({ request }) => record(request)),
    );

    await expect(fetchCart()).resolves.toEqual(filledCart);
    await expect(updateCartItem(11, 3)).resolves.toEqual(filledCart);
    await expect(removeCartItem(11)).resolves.toEqual(filledCart);
    await expect(clearCart()).resolves.toEqual(filledCart);

    expect(requests).toEqual([
      { method: "GET", path: "/api/carrito", token: "guest-token-test" },
      {
        method: "POST",
        path: "/api/carrito/items",
        token: "guest-token-test",
        body: { idVariante: 11, cantidad: 3 },
      },
      { method: "DELETE", path: "/api/carrito/items/11", token: "guest-token-test" },
      { method: "DELETE", path: "/api/carrito", token: "guest-token-test" },
    ]);
  });
});
