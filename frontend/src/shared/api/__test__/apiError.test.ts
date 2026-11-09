import { describe, expect, it } from "vitest";
import { ApiError } from "../apiError";

describe("ApiError", () => {
  it("preserves the HTTP status and validation fields", () => {
    const fields = [{ campo: "correo", mensaje: "Formato inválido" }];
    const error = new ApiError("Error de validación", 400, fields);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ApiError");
    expect(error.message).toBe("Error de validación");
    expect(error.status).toBe(400);
    expect(error.fields).toEqual(fields);
  });
});
