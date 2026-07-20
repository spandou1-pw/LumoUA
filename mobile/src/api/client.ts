import * as SecureStore from 'expo-secure-store';

/**
 * doc 17 Mobile Architecture: refresh token lives in platform secure
 * storage (Keychain/Keystore via SecureStore), never AsyncStorage — same
 * requirement as doc 23. Access token is kept in memory only (not
 * persisted), refreshed on demand.
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const DEVICE_ID_KEY = 'lumo_device_id';
const REFRESH_TOKEN_KEY = 'lumo_refresh_token';

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

async function getOrCreateDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }
  return id;
}

export async function setSession(accessToken: string, refreshToken: string): Promise<void> {
  inMemoryAccessToken = accessToken;
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function clearSession(): Promise<void> {
  inMemoryAccessToken = null;
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export function hasAccessToken(): boolean {
  return inMemoryAccessToken !== null;
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;
  const deviceId = await getOrCreateDeviceId();

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken, deviceId }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    await setSession(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean; // default true — most endpoints require it (doc 23)
}

/**
 * doc 22 error envelope: { error: { code, message } } — parsed into
 * ApiError so callers can branch on `err.code` for specific handling
 * (e.g. 'PREMIUM_SUBSCRIPTION_REQUIRED' triggers an upsell screen instead
 * of a generic error toast).
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const deviceId = await getOrCreateDeviceId();

  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-Device-Id': deviceId };
    if (auth && inMemoryAccessToken) headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await doFetch();

  // doc 23: on a 401 with an expired access token, refresh once and retry
  // — never surface a spurious logout for a token that's simply due for
  // rotation.
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

export { getOrCreateDeviceId };
