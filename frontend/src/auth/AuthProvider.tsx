import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  apiRequest,
  clearGuestToken,
  getGuestToken,
  getSession,
  getSessionEventName,
  setSession,
  type AuthSession,
} from '../api/client'
import { AuthContext, type AuthContextValue, type LoginInput, type RegisterInput } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentSession, setCurrentSession] = useState<AuthSession | null>(() => getSession())

  useEffect(() => {
    const syncSession = () => setCurrentSession(getSession())
    const eventName = getSessionEventName()
    window.addEventListener(eventName, syncSession)
    return () => window.removeEventListener(eventName, syncSession)
  }, [])

  const migrateGuestCart = useCallback(async () => {
    const guestToken = localStorage.getItem('shopcart.guest-token')
    if (!guestToken) return

    try {
      await apiRequest('/carrito/migrar', {
        method: 'POST',
        body: JSON.stringify({ tokenInvitado: guestToken }),
      })
      clearGuestToken()
    } catch {
      // Keep the token so the customer can retry the merge on the next login.
    }
  }, [])

  const signIn = useCallback(async (input: LoginInput) => {
    const response = await apiRequest<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
      skipRefresh: true,
    })
    setSession(response.datos)
    await migrateGuestCart()
  }, [migrateGuestCart])

  const signUp = useCallback(async (input: RegisterInput) => {
    const response = await apiRequest<AuthSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
      skipRefresh: true,
    })
    setSession(response.datos)
    await migrateGuestCart()
  }, [migrateGuestCart])

  const signOut = useCallback(async () => {
    const active = getSession()
    if (active?.refreshToken) {
      try {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: active.refreshToken }),
          skipRefresh: true,
        })
      } finally {
        setSession(null)
      }
    } else {
      setSession(null)
    }
    getGuestToken()
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    session: currentSession,
    user: currentSession?.usuario ?? null,
    isAuthenticated: Boolean(currentSession),
    signIn,
    signUp,
    signOut,
  }), [currentSession, signIn, signOut, signUp])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

