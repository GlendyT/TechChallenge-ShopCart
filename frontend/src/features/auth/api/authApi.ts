import { apiRequest } from "../../../shared/api/httpClient";
import type { AuthSession, LoginInput, RegisterInput } from "../../../shared/auth/authTypes";

export async function signInRequest(input: LoginInput): Promise<AuthSession> {
  const response = await apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
    skipRefresh: true,
  });
  return response.datos;
}

export async function signUpRequest(input: RegisterInput): Promise<AuthSession> {
  const response = await apiRequest<AuthSession>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
    skipRefresh: true,
  });
  return response.datos;
}

export async function signOutRequest(refreshToken: string): Promise<void> {
  await apiRequest("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
    skipRefresh: true,
  });
}

export async function migrateGuestCartRequest(guestToken: string): Promise<void> {
  await apiRequest("/carrito/migrar", {
    method: "POST",
    body: JSON.stringify({ tokenInvitado: guestToken }),
  });
}
