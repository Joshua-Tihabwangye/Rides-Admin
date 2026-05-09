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
