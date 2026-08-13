import { API_BASE_URL, APP_ID } from "./config";

interface ApiEnvelope<T> {
  code?: string;
  message?: string;
  details?: unknown;
  requestId?: string;
  data?: T;
}

type QueryPrimitive = string | number | boolean;
type QueryValue = QueryPrimitive | QueryPrimitive[] | null | undefined;

export interface TokenRefreshResult {
  accessToken: string;
  refreshToken?: string;
}

interface HttpClientAuthAdapter {
  getAccessToken: () => string | null;
  getRefreshToken?: () => string | null;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  clearSession: () => void;
  refresh: (refreshToken?: string) => Promise<TokenRefreshResult>;
  onUnauthorized?: () => void;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, QueryValue>;
  retryOnUnauthorized?: boolean;
  unwrapData?: boolean;
}

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }
}

let authAdapter: HttpClientAuthAdapter | null = null;
let inFlightRefresh: Promise<TokenRefreshResult> | null = null;

function decodeJwtExp(accessToken: string): number | null {
  try {
    const payloadPart = accessToken.split(".")[1];
    if (!payloadPart) return null;
    const padded = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Refresh the access token before it expires so parallel 401s never race a
 * single rotation (the idle-logout bug). Call once at app start while signed
 * in; dedupes with any in-flight refresh.
 */
export function startAdminProactiveSessionRefresh(
  intervalMs = 60_000,
  leadMs = 5 * 60_000,
): void {
  if (typeof window === "undefined") return;
  const tick = () => {
    if (!authAdapter) return;
    const token = authAdapter.getAccessToken();
    if (!token) return;
    const exp = decodeJwtExp(token);
    if (exp === null) return;
    if (exp - Date.now() <= leadMs) {
      void attemptRefresh()
        .then((result) => authAdapter?.setTokens(result.accessToken, result.refreshToken))
        .catch((error) => {
          // A permanent refresh rejection means the session can never
          // recover — sign out instead of retrying every tick.
          if (isDefinitiveAuthRejection(error)) {
            handleUnauthorized();
          }
        });
    }
  };
  tick();
  window.setInterval(tick, intervalMs);
}

export function configureHttpClientAuth(adapter: HttpClientAuthAdapter) {
  authAdapter = adapter;
}

function parseJson<T>(text: string): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function buildHeaders(options: RequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-App-Id": APP_ID,
    ...(options.headers || {}),
  };

  if (!headers.Authorization) {
    const accessToken = authAdapter?.getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  return headers;
}

async function attemptRefresh(): Promise<TokenRefreshResult> {
  if (!authAdapter) {
    throw new ApiRequestError("Session expired", 401);
  }

  // When the adapter exposes getRefreshToken and it returns null, there is no
  // stored token to refresh with. When it is not provided at all, the refresh
  // token travels in the HttpOnly cookie, so attempt the refresh regardless.
  let refreshToken: string | undefined;
  if (authAdapter.getRefreshToken) {
    const stored = authAdapter.getRefreshToken();
    if (!stored) {
      throw new ApiRequestError("Session expired", 401);
    }
    refreshToken = stored;
  }

  if (!inFlightRefresh) {
    inFlightRefresh = authAdapter.refresh(refreshToken).finally(() => {
      inFlightRefresh = null;
    });
  }

  return inFlightRefresh;
}

function isDefinitiveAuthRejection(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status >= 400 &&
    error.status < 500 &&
    error.status !== 429
  );
}

function handleUnauthorized() {
  authAdapter?.clearSession();
  authAdapter?.onUnauthorized?.();
}

function appendQueryValue(search: URLSearchParams, key: string, value: QueryValue): void {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item) => appendQueryValue(search, key, item));
    return;
  }
  search.append(key, String(value));
}

function buildRequestUrl(path: string, query?: Record<string, QueryValue>): string {
  if (!query) {
    return `${API_BASE_URL}${path}`;
  }

  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => appendQueryValue(search, key, value));

  const suffix = search.toString();
  return suffix ? `${API_BASE_URL}${path}?${suffix}` : `${API_BASE_URL}${path}`;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(buildRequestUrl(path, options.query), {
    method: options.method || "GET",
    // Send the HttpOnly refresh-token cookie. In dev the API is same-origin
    // via the Vite proxy; in production this keeps cookie refresh working
    // when the backend is on another origin (CORS allows credentials).
    credentials: "include",
    headers: buildHeaders(options),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 401 && options.retryOnUnauthorized !== false && authAdapter) {
    try {
      const refreshed = await attemptRefresh();
      authAdapter.setTokens(refreshed.accessToken, refreshed.refreshToken);
      return request<T>(path, {
        ...options,
        retryOnUnauthorized: false,
        unwrapData: options.unwrapData,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${refreshed.accessToken}`,
        },
      });
    } catch (error) {
      // A definitive 4xx (except 429) means the session is gone: 401/403 are
      // invalid tokens and 400/422 mean the refresh credential itself is
      // missing/malformed. Clearing on those stops the 400-refresh loop.
      // Transient failures (offline, backend down, timeout, 5xx, 429) keep
      // the admin signed in — clearing here was the idle-logout bug.
      if (isDefinitiveAuthRejection(error)) {
        handleUnauthorized();
      }
      throw error;
    }
  }

  const raw = await response.text();
  const parsed = parseJson<ApiEnvelope<T>>(raw);

  if (!response.ok) {
    const message = parsed?.message || `Request failed with status ${response.status}`;
    throw new ApiRequestError(message, response.status, parsed?.details);
  }

  if (options.unwrapData === false) {
    return parsed as unknown as T;
  }

  if (parsed && "data" in parsed && parsed.data !== undefined) {
    return parsed.data;
  }

  if (parsed !== null) {
    return parsed as unknown as T;
  }

  throw new ApiRequestError("Empty response from server", response.status);
}
