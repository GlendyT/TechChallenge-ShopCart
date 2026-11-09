import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  afterEach(() => vi.useRealTimers());

  it("updates the value after the delay and ignores intermediate values", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "" },
    });

    rerender({ value: "cam" });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: "camisa" });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe("");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("camisa");
  });
});
