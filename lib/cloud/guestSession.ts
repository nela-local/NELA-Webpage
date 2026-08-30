import { getApiBaseUrl, getAccessToken } from "@/lib/nela-api";
import type { GuestLimits } from "./types";

const GUEST_TOKEN_KEY = "nela_guest_token";
const FINGERPRINT_KEY = "nela_guest_fingerprint";

export function getGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(GUEST_TOKEN_KEY);
}

export function storeGuestToken(token: string): void {
  window.localStorage.setItem(GUEST_TOKEN_KEY, token);
}

export function clearGuestToken(): void {
  window.localStorage.removeItem(GUEST_TOKEN_KEY);
}

/** User session takes precedence over anonymous guest try. */
export function getCloudBearerToken(): string | null {
  return getAccessToken() ?? getGuestToken();
}

function getOrCreateFingerprint(): string {
  let fp = window.localStorage.getItem(FINGERPRINT_KEY);
  if (!fp) {
    fp = `web_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    window.localStorage.setItem(FINGERPRINT_KEY, fp);
  }
  return fp;
}

type GuestSessionResponse = {
  guestToken: string;
  expiresIn: number;
  limits: GuestLimits;
};

export async function startGuestSession(): Promise<GuestSessionResponse> {
  const res = await fetch(`${getApiBaseUrl()}/v1/guest/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fingerprint: getOrCreateFingerprint() }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg =
      (err as { message?: string }).message ?? `Guest session failed (${res.status})`;
    throw new Error(msg);
  }

  const data = (await res.json()) as GuestSessionResponse;
  storeGuestToken(data.guestToken);
  return data;
}

export async function fetchGuestLimits(): Promise<GuestLimits> {
  const token = getGuestToken();
  if (!token) {
    const session = await startGuestSession();
    return session.limits;
  }

  const res = await fetch(`${getApiBaseUrl()}/v1/guest/limits`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearGuestToken();
    const session = await startGuestSession();
    return session.limits;
  }

  if (!res.ok) {
    throw new Error(`Failed to load guest limits (${res.status})`);
  }

  return (await res.json()) as GuestLimits;
}

export async function ensureGuestSession(): Promise<{
  limits: GuestLimits;
}> {
  const limits = await fetchGuestLimits();
  return { limits };
}

export function guestQuotaLabel(limits: GuestLimits | null): string {
  if (!limits) return "Guest try";
  return `Guest · ${limits.chat.remaining}/${limits.chat.limit} msgs · ${limits.search.remaining}/${limits.search.limit} search`;
}

export function guestCanSend(limits: GuestLimits | null): boolean {
  return (limits?.chat.remaining ?? 0) > 0;
}

export function applyGuestLimitsFromHeaders(
  headers: Headers,
  current: GuestLimits | null,
): GuestLimits | null {
  const chatRemaining = headers.get("x-nela-guest-chat-remaining");
  const searchRemaining = headers.get("x-nela-guest-search-remaining");
  const expiresAt = headers.get("x-nela-guest-expires-at");
  if (!chatRemaining || !searchRemaining || !expiresAt || !current) {
    return current;
  }

  const chatRem = Number(chatRemaining);
  const searchRem = Number(searchRemaining);
  return {
    chat: {
      limit: current.chat.limit,
      used: current.chat.limit - chatRem,
      remaining: chatRem,
    },
    search: {
      limit: current.search.limit,
      used: current.search.limit - searchRem,
      remaining: searchRem,
    },
    expiresAt,
  };
}

export async function cloudApiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getCloudBearerToken();
  if (!token) {
    throw new Error("UNAUTHORIZED: Sign in or start a guest try session");
  }

  const headers = new Headers(init.headers);
  if (!headers.has("content-type") && init.body) {
    headers.set("content-type", "application/json");
  }
  headers.set("authorization", `Bearer ${token}`);

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const bodyMessage = (err as { message?: string; code?: string }).message;
    const code = (err as { code?: string }).code;
    const combined = [code, bodyMessage, `API ${res.status}`]
      .filter(Boolean)
      .join(": ");
    throw new Error(combined || `API ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}
