import { describe, expect, it } from "vitest";
import { AuthPortalMismatchError } from "../authErrors";

describe("AuthPortalMismatchError", () => {
  it("describes the expected portal and the account role", () => {
    const error = new AuthPortalMismatchError("Administrador", "Operador");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AuthPortalMismatchError");
    expect(error.message).toBe("Seleccionaste el acceso de Administrador, pero esta cuenta tiene el rol Operador.");
  });
});
