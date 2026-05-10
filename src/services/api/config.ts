const env = import.meta.env as Record<string, string | undefined>;

function parseBooleanFlag(value: string | undefined, fallback = false): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function normalizeBaseUrl(value: string | undefined): string {
  const raw = value?.trim();
  if (!raw) return "/api/v1";
  return raw.replace(/\/+$/, "");
}

export const USE_BACKEND = parseBooleanFlag(env.VITE_USE_BACKEND, false);
export const API_BASE_URL = normalizeBaseUrl(env.VITE_API_BASE_URL);
export const APP_ID = (env.VITE_APP_ID || "admin").trim() || "admin";
export const BACKEND_FLAG_EVENT = "evzone:backend-flag";
const BACKEND_FLAG_STORAGE_KEY = `evzone_backend_flag_${APP_ID}`;

interface RuntimeFlagEnvelope {
  data?: {
    backendEnabled?: boolean;
  };
  backendEnabled?: boolean;
}

function readStoredBackendFlag(): boolean | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = window.localStorage.getItem(BACKEND_FLAG_STORAGE_KEY);
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw) as { enabled?: boolean };
    return typeof parsed.enabled === "boolean" ? parsed.enabled : undefined;
  } catch {
    return undefined;
  }
}

let runtimeBackendEnabled: boolean | undefined = readStoredBackendFlag();
let runtimeFlagLoadPromise: Promise<boolean> | null = null;

export function getBackendEnabled(): boolean {
  return runtimeBackendEnabled ?? USE_BACKEND;
}

export function setBackendEnabled(enabled: boolean): void {
  runtimeBackendEnabled = enabled;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    BACKEND_FLAG_STORAGE_KEY,
    JSON.stringify({ enabled, updatedAt: Date.now() }),
  );
  window.dispatchEvent(new CustomEvent(BACKEND_FLAG_EVENT, { detail: { appId: APP_ID, enabled } }));
}

export async function loadBackendRuntimeFlag(force = false): Promise<boolean> {
  if (typeof window === "undefined") {
    return getBackendEnabled();
  }

  if (!force && runtimeFlagLoadPromise) {
    return runtimeFlagLoadPromise;
  }

  runtimeFlagLoadPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/compat/flags/${APP_ID}`);
      if (!response.ok) {
        throw new Error(`Runtime flag request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as RuntimeFlagEnvelope;
      const enabled = payload.data?.backendEnabled ?? payload.backendEnabled;
      if (typeof enabled === "boolean") {
        setBackendEnabled(enabled);
      }
      return getBackendEnabled();
    } catch {
      return getBackendEnabled();
    }
  })();

  return runtimeFlagLoadPromise;
}

if (typeof window !== "undefined") {
  void loadBackendRuntimeFlag().catch(() => undefined);
}
