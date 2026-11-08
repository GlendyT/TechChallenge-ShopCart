import { ApiError } from "./apiError";
import type { ApiEnvelope } from "./apiTypes";
import type { AuthSession } from "../auth/authTypes";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"
).replace(/\/$/, "");
const SESSION_KEY = "shopcart.session";
const GUEST_TOKEN_KEY = "shopcart.guest-token";
const SESSION_EVENT = "shopcart:session-change";

let session: AuthSession | null = readStoredSession();
let refreshInFlight: Promise<boolean> | null = null;

function readStoredSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function publishSessionChange() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function getSession(): AuthSession | null {
  return session;
}

export function setSession(next: AuthSession | null) {
  session = next;
  if (next) sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  else sessionStorage.removeItem(SESSION_KEY);
  publishSessionChange();
}

export function getGuestToken(): string {
  let token = localStorage.getItem(GUEST_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(GUEST_TOKEN_KEY, token);
  }
  return token;
}

export function getStoredGuestToken(): string | null {
  return localStorage.getItem(GUEST_TOKEN_KEY);
}

export function clearGuestToken() {
  localStorage.removeItem(GUEST_TOKEN_KEY);
}

export function getSessionEventName() {
  return SESSION_EVENT;
}

async function refreshSession(): Promise<boolean> {
  if (!session?.refreshToken) return false;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: session?.refreshToken }),
      });
      const payload = (await response.json()) as ApiEnvelope<{
        accessToken: string;
        refreshToken: string;
      }>;

      if (!response.ok || !payload.ok || !session) {
        setSession(null);
        return false;
      }

      setSession({
        ...session,
        accessToken: payload.datos.accessToken,
        refreshToken: payload.datos.refreshToken,
      });
      return true;
    } catch {
      setSession(null);
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

interface RequestOptions extends RequestInit {
  guestToken?: string;
  skipRefresh?: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  const { guestToken, skipRefresh, ...init } = options;
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (session?.accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }
  if (guestToken) headers.set("x-guest-token", guestToken);

  const send = () => fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  let response = await send();

  if (response.status === 401 && !skipRefresh && !path.startsWith("/auth/")) {
    const refreshed = await refreshSession();
    if (refreshed && session) {
      headers.set("Authorization", `Bearer ${session.accessToken}`);
      response = await send();
    }
  }

  let payload: ApiEnvelope<T> | undefined;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    if (response.ok) {
      throw new ApiError("La API devolvió una respuesta inesperada.", response.status);
    }
  }

  if (!response.ok || !payload?.ok) {
    throw new ApiError(
      payload?.mensaje || "No pudimos completar la solicitud. Inténtalo de nuevo.",
      response.status,
      payload?.errores,
    );
  }

  return payload;
}

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}
