import { API_BASE_URL } from "./config";

interface ApiEnvelope<T> {
  code?: string;
  message?: string;
  details?: unknown;
  requestId?: string;
  data?: T;
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

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

function parseJson<T>(text: string): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

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
