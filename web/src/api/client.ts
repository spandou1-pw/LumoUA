'use client';

/**
 * doc 23 specifies an HttpOnly, Secure, SameSite=Strict cookie for the web
 * refresh token, set server-side — that's the properly hardened pattern
 * (closes the XSS-can-steal-the-token surface a JS-readable store leaves
 * open). The backend's actual Stage 4 `/auth/login` implementation returns
 * both tokens in the JSON response body (matching the mobile client's
 * needs), not a Set-Cookie header — so the web client here stores the
 * refresh token in `localStorage`, same as it would need to regardless of
 * mobile parity, with this tradeoff named explicitly rather than silently
 * assumed to be fine. Migrating the backend to set an HttpOnly cookie for
 * web specifically (while still returning tokens in-body for mobile) is
 * the flagged hardening follow-up — see WEB_DESKTOP.md.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const REFRESH_TOKEN_KEY = 'lumo_refresh_token';
const DEVICE_ID_KEY = 'lumo_device_id';

let inMemoryAccessToken: string | null = null;

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function setSession(accessToken: string, refreshToken: string): void {
  inMemoryAccessToken = accessToken;
  if (typeof window !== 'undefined') localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearSession(): void {
  inMemoryAccessToken = null;
  if (typeof window !== 'undefined') localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function hasStoredRefreshToken(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(REFRESH_TOKEN_KEY);
}

async function refreshAccessToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken, deviceId: getOrCreateDeviceId() }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setSession(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const doFetch = async () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Device-Id': getOrCreateDeviceId(),
    };
    if (auth && inMemoryAccessToken) headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await doFetch();
  if (res.status === 401 && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) res = await doFetch();
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(json?.error?.code ?? 'UNKNOWN_ERROR', json?.error?.message ?? 'Request failed', res.status);
  }
  return json as T;
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'method'>) => apiRequest<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, 'method'>) => apiRequest<T>(path, { ...opts, method: 'DELETE' }),
};
