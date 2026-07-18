const env = import.meta.env as Record<string, string | undefined>;

function parseBooleanFlag(value: string | undefined, fallback = false): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function normalizeBaseUrl(value: string | undefined): string {
  const raw = value?.trim();
  if (!raw) {
    if (IS_NON_PROD) return "/api/v1";
    throw new Error(
      "VITE_BACKEND_BASE_URL must be configured to the backend origin, for example https://your-backend-domain.com/api/v1.",
    );
  }
  return raw.replace(/\/+$/, "");
}

function normalizeSocketBaseUrl(value: string | undefined, apiBaseUrl: string): string {
  const raw = value?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  return apiBaseUrl.replace(/\/api(?:\/v\d+)?$/, "");
}

function isInvalidProductionOrigin(value: string): boolean {
  try {
    const parsed = new URL(value);
    return !["http:", "https:"].includes(parsed.protocol) ||
      ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  } catch {
    return true;
  }
}

function assertValidProductionOrigin(value: string, name: string): string {
  if (!IS_NON_PROD) {
    if (!value) {
      throw new Error(
        `${name} is missing in production. Set it to the public backend origin before deploying.`,
      );
    }

    if (isInvalidProductionOrigin(value)) {
      throw new Error(
        `${name} must be an absolute public backend origin in production. Set it to something like https://api.evzone.app or https://api.evzone.app/api/v1 before deploying.`,
      );
    }
  }

  return value;
}

const backendBaseUrlEnv = env.VITE_BACKEND_BASE_URL ?? env.VITE_API_BASE_URL;
const backendEnabledEnv = env.VITE_BACKEND_ENABLED ?? env.VITE_USE_BACKEND;
const IS_NON_PROD = (env.MODE?.trim().toLowerCase() ?? "development") !== "production";

export const USE_BACKEND = parseBooleanFlag(backendEnabledEnv, true);
export const API_BASE_URL = assertValidProductionOrigin(
  normalizeBaseUrl(backendBaseUrlEnv),
  "VITE_BACKEND_BASE_URL",
);
export const SOCKET_BASE_URL = assertValidProductionOrigin(
  normalizeSocketBaseUrl(env.VITE_SOCKET_BASE_URL, API_BASE_URL),
  "VITE_SOCKET_BASE_URL",
);
export const SOCKET_PATH = (env.VITE_SOCKET_PATH || "/socket.io").trim() || "/socket.io";
export const APP_ID = (env.VITE_APP_ID || "admin").trim() || "admin";

export interface CanonicalRouteContract {
  appId: string;
  rest: Record<string, string>;
  realtime: {
    namespace: string;
    path: string;
  };
  notes?: string[];
}

interface CanonicalRouteEnvelope {
  data?: CanonicalRouteContract;
}

export function getBackendEnabled(): boolean {
  return USE_BACKEND;
}

let runtimeCanonicalContract: CanonicalRouteContract | null = null;
let runtimeCanonicalLoadPromise: Promise<CanonicalRouteContract | null> | null = null;

export function getCanonicalRouteContract(): CanonicalRouteContract | null {
  return runtimeCanonicalContract;
}

export async function loadCanonicalRouteContract(force = false): Promise<CanonicalRouteContract | null> {
  if (typeof window === "undefined") {
    return runtimeCanonicalContract;
  }

  if (!force && runtimeCanonicalLoadPromise) {
    return runtimeCanonicalLoadPromise;
  }

  runtimeCanonicalLoadPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/compat/canonical-routes/${APP_ID}`);
      if (!response.ok) {
        throw new Error(`Canonical contract request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as CanonicalRouteEnvelope;
      runtimeCanonicalContract = payload.data ?? null;
      return runtimeCanonicalContract;
    } catch {
      return runtimeCanonicalContract;
    }
  })();

  return runtimeCanonicalLoadPromise;
}

if (typeof window !== "undefined") {
  void loadCanonicalRouteContract().catch(() => undefined);
}
