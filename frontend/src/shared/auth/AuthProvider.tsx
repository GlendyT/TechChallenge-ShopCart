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
  getCurrentUserRequest,
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const syncSession = () => setCurrentSession(getSession());
    const eventName = getSessionEventName();
    window.addEventListener(eventName, syncSession);

    void getCurrentUserRequest()
      .then((restoredSession) => {
        if (active && !getSession()) setSession(restoredSession);
      })
      .catch(() => {
        if (active && !getSession()) setSession(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      window.removeEventListener(eventName, syncSession);
    };
  }, []);

  const migrateGuestCart = useCallback(async () => {
    const guestToken = getStoredGuestToken();
    if (!guestToken) return;

    try {
      await migrateGuestCartRequest(guestToken);
      clearGuestToken();
    } catch {
      // Conserva el token para reintentar la migración del carrito más adelante.
    }
  }, []);

  const signIn = useCallback(async (
    input: LoginInput,
    expectedRole?: UserRole,
  ) => {
    const nextSession = await signInRequest(input);
    if (expectedRole && nextSession.usuario.rol !== expectedRole) {
      try {
        await signOutRequest();
      } catch {
        // El login incompatible no se conserva en el estado local.
      }
      setSession(null);
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
    try {
      await signOutRequest();
    } finally {
      setSession(null);
      getGuestToken();
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session: currentSession,
    user: currentSession?.usuario ?? null,
    isAuthenticated: Boolean(currentSession),
    isLoading,
    signIn,
    signUp,
    signOut,
  }), [currentSession, isLoading, signIn, signOut, signUp]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
