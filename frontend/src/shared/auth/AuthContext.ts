import { createContext } from "react";
import type {
  AuthSession,
  AuthUser,
  LoginInput,
  RegisterInput,
  UserRole,
} from "./authTypes";

export interface AuthContextValue {
  session: AuthSession | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (input: LoginInput, expectedRole?: UserRole) => Promise<AuthSession>;
  signUp: (input: RegisterInput) => Promise<AuthSession>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
