import {
  backendForgotPassword,
  backendLogin,
  isBackendAuthEnabled,
  isOpenAuthEnabled,
} from "../services/api/authApi"
import {
  clearAdminBackendTokens,
  readAdminBackendAccessToken,
  saveAdminBackendTokens,
  syncAdminReferenceData,
} from "../services/api/adminApi"

export const ADMIN_BACKEND_ROLE_ENUMS = ["admin", "super_admin"] as const
export type AdminBackendRole = (typeof ADMIN_BACKEND_ROLE_ENUMS)[number]

export type AuthUser = {
  name: string
  email: string
  role: string
  roles?: string[]
}

const STORAGE_KEY = "evzone_admin_auth"
const ADMIN_ROLE_SET = new Set<string>(ADMIN_BACKEND_ROLE_ENUMS)

function parseJwtPayload(token: string): { exp?: number; roles?: unknown } | null {
  const parts = token.split(".")
  if (parts.length < 2) return null

  try {
    const normalized = parts[1]!.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
    const json = atob(padded)
    return JSON.parse(json) as { exp?: number; roles?: unknown }
  } catch {
    return null
  }
}

function sanitizeAdminRoles(roles: unknown): AdminBackendRole[] {
  if (!Array.isArray(roles)) return []
  const normalized = roles
    .filter((role): role is string => typeof role === "string")
    .map((role) => role.trim().toLowerCase())
    .filter((role): role is AdminBackendRole => ADMIN_ROLE_SET.has(role))

  return Array.from(new Set(normalized))
}

function isTokenExpired(token: string): boolean {
  const payload = parseJwtPayload(token)
  if (!payload?.exp) return false
  return payload.exp * 1000 <= Date.now()
}

function resolveClaimRoles(): AdminBackendRole[] {
  const accessToken = readAdminBackendAccessToken()
  if (!accessToken) return []
  const payload = parseJwtPayload(accessToken)
  return sanitizeAdminRoles(payload?.roles)
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function getAuthRoles(): AdminBackendRole[] {
  const claimRoles = resolveClaimRoles()
  if (claimRoles.length > 0) return claimRoles
  const user = getAuthUser()
  return sanitizeAdminRoles(user?.roles)
}

export function signIn(user: AuthUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function signOut() {
  localStorage.removeItem(STORAGE_KEY)
  clearAdminBackendTokens()
}

export function isAuthed() {
  const user = getAuthUser()
  if (!user) return false

  if (isBackendAuthEnabled()) {
    const token = readAdminBackendAccessToken()
    if (!token || isTokenExpired(token)) {
      signOut()
      return false
    }
  }

  return true
}

function buildDevAuthUser(email: string): AuthUser {
  const normalizedEmail = email.trim().toLowerCase()
  return {
    name: normalizedEmail.split("@")[0] || "Admin",
    email: normalizedEmail,
    role: "Super Admin",
    roles: ["super_admin"],
  }
}

export async function loginWithCredentials(credentials: { email: string; password: string }): Promise<AuthUser> {
  const normalizedEmail = credentials.email.trim().toLowerCase()

  if (isOpenAuthEnabled() && import.meta.env.DEV) {
    const authUser = buildDevAuthUser(normalizedEmail)
    signIn(authUser)
    return authUser
  }

  if (!isBackendAuthEnabled()) {
    throw new Error("Admin backend authentication is disabled.")
  }

  const backend = await backendLogin({
    email: normalizedEmail,
    password: credentials.password,
  })

  saveAdminBackendTokens(backend.accessToken, backend.refreshToken)

  const roleClaims = resolveClaimRoles()
  const resolvedRoles = roleClaims.length > 0 ? roleClaims : sanitizeAdminRoles(backend.user.roles)

  const authUser: AuthUser = {
    name: backend.user.email.split("@")[0] || "Admin",
    email: backend.user.email,
    role: resolvedRoles.includes("super_admin") ? "Super Admin" : "Admin",
    roles: resolvedRoles,
  }

  signIn(authUser)
  void syncAdminReferenceData().catch((error) => {
    console.warn("Admin backend bootstrap sync failed. Keeping current local store.", error)
  })
  return authUser
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (!isBackendAuthEnabled()) {
    throw new Error("Admin backend authentication is disabled.")
  }

  await backendForgotPassword({ email: email.trim().toLowerCase() })
}
