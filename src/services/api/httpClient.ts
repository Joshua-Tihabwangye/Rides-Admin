import { API_BASE_URL, APP_ID } from "./config";

interface ApiEnvelope<T> {
  code?: string;
  message?: string;
  details?: unknown;
  requestId?: string;
  data?: T;
}

export interface TokenRefreshResult {
  accessToken: string;
  refreshToken: string;
}

interface HttpClientAuthAdapter {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearSession: () => void;
  refresh: (refreshToken: string) => Promise<TokenRefreshResult>;
  onUnauthorized?: () => void;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  retryOnUnauthorized?: boolean;
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
  const refreshToken = authAdapter?.getRefreshToken();
  if (!authAdapter || !refreshToken) {
    throw new ApiRequestError("Session expired", 401);
  }

  if (!inFlightRefresh) {
    inFlightRefresh = authAdapter.refresh(refreshToken).finally(() => {
      inFlightRefresh = null;
    });
  }

  return inFlightRefresh;
}

function handleUnauthorized() {
  authAdapter?.clearSession();
  authAdapter?.onUnauthorized?.();
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
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
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${refreshed.accessToken}`,
        },
      });
    } catch {
      handleUnauthorized();
    }
  }

  const raw = await response.text();
  const parsed = parseJson<ApiEnvelope<T>>(raw);

  if (!response.ok) {
    const message = parsed?.message || `Request failed with status ${response.status}`;
    throw new ApiRequestError(message, response.status, parsed?.details);
  }

  if (parsed && "data" in parsed && parsed.data !== undefined) {
    return parsed.data;
  }

  if (parsed !== null) {
    return parsed as unknown as T;
  }

  throw new ApiRequestError("Empty response from server", response.status);
}
