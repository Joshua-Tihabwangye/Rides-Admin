export type AuthPrefillState = {
  email?: string;
  password?: string;
  identity?: string;
};

const AUTH_PREFILL_STORAGE_KEY = "evz_admin_auth_prefill";

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function readAuthPrefill(): AuthPrefillState {
  if (!canUseSessionStorage()) return {}

  try {
    const raw = window.sessionStorage.getItem(AUTH_PREFILL_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as AuthPrefillState
    return {
      email: typeof parsed.email === "string" ? parsed.email : undefined,
      password: typeof parsed.password === "string" ? parsed.password : undefined,
      identity: typeof parsed.identity === "string" ? parsed.identity : undefined,
    }
  } catch {
    return {}
  }
}

export function saveAuthPrefill(next: AuthPrefillState): void {
  if (!canUseSessionStorage()) return

  const current = readAuthPrefill()
  const merged: AuthPrefillState = {
    ...current,
    ...Object.fromEntries(
      Object.entries(next).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]),
    ),
  }

  const normalized = Object.fromEntries(
    Object.entries(merged).filter(([, value]) => typeof value === "string" && value.length > 0),
  )

  if (Object.keys(normalized).length === 0) {
    window.sessionStorage.removeItem(AUTH_PREFILL_STORAGE_KEY)
    return
  }

  window.sessionStorage.setItem(AUTH_PREFILL_STORAGE_KEY, JSON.stringify(normalized))
}

export function clearAuthPrefillPassword(): void {
  if (!canUseSessionStorage()) return
  const current = readAuthPrefill()
  delete current.password
  saveAuthPrefill(current)
}
