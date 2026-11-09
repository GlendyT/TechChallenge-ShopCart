import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { clearCart } from "./cartApi";
import { emptyCart } from "../../../test/fixtures";
import { server } from "../../../test/server";

describe("cart API", () => {
  beforeEach(() => localStorage.setItem("shopcart.guest-token", "guest-token-test"));

  it("clears the current guest cart and sends its guest token", async () => {
    let receivedToken: string | null = null;
    server.use(http.delete("http://localhost:3000/api/carrito", ({ request }) => {
      receivedToken = request.headers.get("x-guest-token");
      return HttpResponse.json({ ok: true, datos: emptyCart });
    }));

    await expect(clearCart()).resolves.toEqual(emptyCart);
    expect(receivedToken).toBe("guest-token-test");
  });
});
