import { describe, expect, it } from "vitest";
import { cn } from "../utils";

describe("cn", () => {
  it("combines conditional classes and resolves conflicting Tailwind utilities", () => {
    const hidden = false;
    expect(cn("rounded p-2", hidden && "hidden", "p-4 text-dn-azul")).toBe(
      "rounded p-4 text-dn-azul",
    );
  });
});
