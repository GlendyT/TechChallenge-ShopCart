import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  clearGuestToken,
  getGuestToken,
  getSession,
  getSessionEventName,
  getStoredGuestToken,
  setSession,
} from "../api/httpClient";
import {
  migrateGuestCartRequest,
  signInRequest,
  signOutRequest,
  signUpRequest,
} from "../../features/auth/api/authApi";
import { AuthContext, type AuthContextValue } from "./AuthContext";
import type { AuthSession, LoginInput, RegisterInput, UserRole } from "./authTypes";
import { AuthPortalMismatchError } from "./authErrors";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentSession, setCurrentSession] = useState<AuthSession | null>(() => getSession());

  useEffect(() => {
    const syncSession = () => setCurrentSession(getSession());
    const eventName = getSessionEventName();
    window.addEventListener(eventName, syncSession);
    return () => window.removeEventListener(eventName, syncSession);
  }, []);

  const migrateGuestCart = useCallback(async () => {
    const guestToken = getStoredGuestToken();
    if (!guestToken) return;

    try {
      await migrateGuestCartRequest(guestToken);
      clearGuestToken();
    } catch {
      // Keep the token so the customer can retry the merge on the next login.
    }
  }, []);

  const signIn = useCallback(async (
    input: LoginInput,
    expectedRole?: UserRole,
  ) => {
    const nextSession = await signInRequest(input);
    if (expectedRole && nextSession.usuario.rol !== expectedRole) {
      try {
        await signOutRequest(nextSession.refreshToken);
      } catch {
        // No se conserva la sesión local cuando el portal no coincide.
      }
      throw new AuthPortalMismatchError(expectedRole, nextSession.usuario.rol);
    }
    setSession(nextSession);
    await migrateGuestCart();
    return nextSession;
  }, [migrateGuestCart]);

  const signUp = useCallback(async (input: RegisterInput) => {
    const nextSession = await signUpRequest(input);
    setSession(nextSession);
    await migrateGuestCart();
    return nextSession;
  }, [migrateGuestCart]);

  const signOut = useCallback(async () => {
    const active = getSession();
    if (active?.refreshToken) {
      try {
        await signOutRequest(active.refreshToken);
      } finally {
        setSession(null);
      }
    } else {
      setSession(null);
    }
    getGuestToken();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session: currentSession,
    user: currentSession?.usuario ?? null,
    isAuthenticated: Boolean(currentSession),
    signIn,
    signUp,
    signOut,
  }), [currentSession, signIn, signOut, signUp]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
