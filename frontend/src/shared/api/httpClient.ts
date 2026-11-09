import { ApiError } from "./apiError";
import type { ApiEnvelope } from "./apiTypes";
import type { AuthSession } from "../auth/authTypes";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"
).replace(/\/$/, "");
const LEGACY_SESSION_KEY = "shopcart.session";
const GUEST_TOKEN_KEY = "shopcart.guest-token";
const SESSION_EVENT = "shopcart:session-change";

sessionStorage.removeItem(LEGACY_SESSION_KEY);

let session: AuthSession | null = null;
let refreshInFlight: Promise<boolean> | null = null;

function publishSessionChange() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function getSession(): AuthSession | null {
  return session;
}

export function setSession(next: AuthSession | null) {
  session = next;
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
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        setSession(null);
        return false;
      }

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

const AUTH_ENDPOINTS_WITHOUT_REFRESH = /^\/auth\/(login|register|refresh|logout)(\/|$)/;

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  const { guestToken, skipRefresh, ...init } = options;
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (guestToken) headers.set("x-guest-token", guestToken);

  const send = () =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });
  let response = await send();

  if (
    response.status === 401 &&
    !skipRefresh &&
    !AUTH_ENDPOINTS_WITHOUT_REFRESH.test(path)
  ) {
    const refreshed = await refreshSession();
    if (refreshed) response = await send();
  }

  let payload: ApiEnvelope<T> | undefined;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    if (response.ok) {
      throw new ApiError("La API devolvi\u00f3 una respuesta inesperada.", response.status);
    }
  }

  if (!response.ok || !payload?.ok) {
    throw new ApiError(
      payload?.mensaje || "No pudimos completar la solicitud. Int\u00e9ntalo de nuevo.",
      response.status,
      payload?.errores,
    );
  }

  return payload;
}

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}
