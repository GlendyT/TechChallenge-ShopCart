import { describe, expect, it } from "vitest";
import { routePaths } from "../routePaths";
import { getPostAuthenticationRoute } from "../authNavigation";

describe("getPostAuthenticationRoute", () => {
  it("sends each role to its default workspace", () => {
    expect(getPostAuthenticationRoute("Administrador")).toBe(
      routePaths.administrationCatalog,
    );
    expect(getPostAuthenticationRoute("Operador")).toBe(routePaths.operations);
    expect(getPostAuthenticationRoute("Cliente")).toBe(routePaths.account);
  });

  it("preserves a requested route when the role is allowed to open it", () => {
    expect(
      getPostAuthenticationRoute("Operador", routePaths.operationsOrders),
    ).toBe(routePaths.operationsOrders);
    expect(getPostAuthenticationRoute("Cliente", routePaths.checkout)).toBe(
      routePaths.checkout,
    );
  });

  it("sends the administration root to its catalog section", () => {
    expect(
      getPostAuthenticationRoute("Administrador", routePaths.administration),
    ).toBe(routePaths.administrationCatalog);
  });

  it("uses the role workspace when the requested route is not allowed", () => {
    expect(
      getPostAuthenticationRoute(
        "Operador",
        routePaths.administrationCatalog,
      ),
    ).toBe(routePaths.operations);
    expect(getPostAuthenticationRoute("Cliente", routePaths.operations)).toBe(
      routePaths.account,
    );
  });

  it("rejects external and authentication-page destinations", () => {
    expect(
      getPostAuthenticationRoute("Cliente", "https://example.com"),
    ).toBe(routePaths.account);
    expect(getPostAuthenticationRoute("Cliente", routePaths.signIn)).toBe(
      routePaths.account,
    );
  });
});
