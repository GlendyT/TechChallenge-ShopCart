import { describe, expect, it } from "vitest";
import {
  getAuthPortalLabel,
  getExpectedRoleForPortal,
  parseAuthPortal,
} from "../authPortal";

describe("authPortal", () => {
  it("maps each entry portal to its expected account role", () => {
    expect(getExpectedRoleForPortal("cliente")).toBe("Cliente");
    expect(getExpectedRoleForPortal("operador")).toBe("Operador");
    expect(getExpectedRoleForPortal("administrador")).toBe("Administrador");
  });

  it("parses only supported portal names", () => {
    expect(parseAuthPortal("administrador")).toBe("administrador");
    expect(parseAuthPortal("unknown")).toBeNull();
    expect(parseAuthPortal(null)).toBeNull();
  });

  it("provides a human-readable portal label", () => {
    expect(getAuthPortalLabel("operador")).toBe("operador");
  });
});
