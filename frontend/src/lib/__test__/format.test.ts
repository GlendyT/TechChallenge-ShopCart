import { describe, expect, it } from "vitest";
import { formatDate, formatPrice } from "../format";

describe("format helpers", () => {
  it("formats amounts as Guatemalan quetzales", () => {
    const formatted = formatPrice(1234.5);
    expect(formatted).toContain("Q");
    expect(formatted).toContain("1,234.50");
  });

  it("formats dates with the es-GT medium date and short time conventions", () => {
    const value = "2026-11-09T15:30:00.000Z";
    const expected = new Intl.DateTimeFormat("es-GT", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));

    expect(formatDate(value)).toBe(expected);
  });

  it("rejects invalid date values", () => {
    expect(() => formatDate("not-a-date")).toThrow(RangeError);
  });
});
