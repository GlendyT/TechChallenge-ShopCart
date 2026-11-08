import { createContext } from 'react'
import type { AuthSession, AuthUser } from '../api/client'

export interface LoginInput {
  correo: string
  password: string
}

export interface RegisterInput extends LoginInput {
  nombre: string
  apellido: string
  telefono?: string
}

export interface AuthContextValue {
  session: AuthSession | null
  user: AuthUser | null
  isAuthenticated: boolean
  signIn: (input: LoginInput) => Promise<void>
  signUp: (input: RegisterInput) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
