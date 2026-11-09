import type { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthProvider } from "../AuthProvider";
import { useAuth } from "../useAuth";

describe("useAuth", () => {
  it("requires an AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow("useAuth debe usarse dentro de AuthProvider.");
  });

  it("exposes the session context inside AuthProvider", () => {
    const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toMatchObject({ user: null, isAuthenticated: false, isLoading: true });
  });
});
