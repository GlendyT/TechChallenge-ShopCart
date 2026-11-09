import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "../use-mobile";

describe("useIsMobile", () => {
  const originalWidth = window.innerWidth;
  afterEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    vi.restoreAllMocks();
  });

  it("returns whether the viewport is below the mobile breakpoint", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 600 });
    const mobile = renderHook(() => useIsMobile());
    expect(mobile.result.current).toBe(true);
    mobile.unmount();

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 900 });
    const desktop = renderHook(() => useIsMobile());
    expect(desktop.result.current).toBe(false);
  });

  it("updates when the media query changes and removes its listener on unmount", () => {
    let changeHandler: (() => void) | undefined;
    const removeEventListener = vi.fn();
    vi.spyOn(window, "matchMedia").mockImplementation(() => ({
      matches: true,
      media: "(max-width: 767px)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => { changeHandler = listener as () => void; },
      removeEventListener,
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList);
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 500 });

    const { result, unmount } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 900 });
    act(() => changeHandler?.());

    expect(result.current).toBe(false);
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
