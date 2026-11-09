import type { AuthContextValue } from "../shared/auth/AuthContext";
import type { AuthUser, UserRole } from "../shared/auth/authTypes";

const fallbackUser: AuthUser = {
  idUsuario: 1,
  codigoPublico: "test-user",
  nombre: "Usuario",
  apellido: "Prueba",
  correo: "usuario@example.com",
  telefono: null,
  rol: "Cliente",
};

export function createAuthContextValue(
  user: AuthUser | null = null,
  isLoading = false,
): AuthContextValue {
  return {
    session: user ? { usuario: user } : null,
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    signIn: async (_input, expectedRole?: UserRole) => ({
      usuario: { ...fallbackUser, rol: expectedRole ?? fallbackUser.rol },
    }),
    signUp: async () => ({ usuario: fallbackUser }),
    signOut: async () => undefined,
  };
}

export function createTestUser(rol: UserRole): AuthUser {
  return { ...fallbackUser, rol };
}
