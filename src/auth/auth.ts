import {
  backendFetchSession,
  backendForgotPassword,
  backendLogin,
  backendResetPassword,
  backendRegister,
  backendVerifyOtp,
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
  defaultRedirect?: string
}

type JwtPayload = { exp?: number; roles?: unknown }
type AdminRoleClaimStatus = { roles: AdminBackendRole[]; hasUnknownRoles: boolean }

const STORAGE_KEY = "evzone_admin_auth"
const ADMIN_ROLE_SET = new Set<string>(ADMIN_BACKEND_ROLE_ENUMS)

function parseJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".")
  if (parts.length < 2) return null

  try {
    const normalized = parts[1]!.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
    const json = atob(padded)
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

function parseAdminRoles(roles: unknown): AdminRoleClaimStatus {
  if (!Array.isArray(roles)) {
    return { roles: [], hasUnknownRoles: false }
  }

  const normalized = new Set<AdminBackendRole>()
  let hasUnknownRoles = false

  for (const value of roles) {
    if (typeof value !== "string") {
      hasUnknownRoles = true
      continue
    }

    const role = value.trim().toLowerCase()
    if (!role) continue

    if (ADMIN_ROLE_SET.has(role)) {
      normalized.add(role as AdminBackendRole)
    } else {
      hasUnknownRoles = true
    }
  }

  return {
    roles: Array.from(normalized),
    hasUnknownRoles,
  }
}

function isTokenExpired(token: string): boolean {
  const payload = parseJwtPayload(token)
  if (!payload?.exp) return false
  return payload.exp * 1000 <= Date.now()
}

function resolveClaimRoles(): AdminRoleClaimStatus {
  const accessToken = readAdminBackendAccessToken()
  if (!accessToken) return { roles: [], hasUnknownRoles: false }
  const payload = parseJwtPayload(accessToken)
  return parseAdminRoles(payload?.roles)
}

function buildAuthUser(email: string, roles: AdminBackendRole[], name?: string, defaultRedirect?: string): AuthUser {
  const normalizedEmail = email.trim().toLowerCase()
  const resolvedName = name?.trim() || normalizedEmail.split("@")[0] || "Admin"
  return {
    name: resolvedName,
    email: normalizedEmail,
    role: roles.includes("super_admin") ? "Super Admin" : "Admin",
    roles,
    defaultRedirect,
  }
}

async function finalizeBackendAuth(backend: {
  accessToken: string
  refreshToken: string
  user: { email: string; roles?: string[] }
}, preferredName?: string): Promise<AuthUser> {
  saveAdminBackendTokens(backend.accessToken, backend.refreshToken)

  const session = await backendFetchSession()
  const sessionRoles = parseAdminRoles(session.user.roles)
  if (sessionRoles.hasUnknownRoles) {
    signOut()
    throw new Error("Received unsupported admin role claims.")
  }

  const roleClaims = resolveClaimRoles()
  if (roleClaims.hasUnknownRoles) {
    signOut()
    throw new Error("Received unsupported admin role claims.")
  }

  const resolvedRoles =
    sessionRoles.roles.length > 0
      ? sessionRoles.roles
      : roleClaims.roles.length > 0
        ? roleClaims.roles
        : parseAdminRoles(backend.user.roles).roles
  if (resolvedRoles.length === 0) {
    signOut()
    throw new Error("Admin account has no supported backend role.")
  }

  const authUser = buildAuthUser(session.user.email, resolvedRoles, preferredName, session.defaultRedirect)
  signIn(authUser)
  void syncAdminReferenceData().catch((error) => {
    console.warn("Admin backend bootstrap sync failed. Keeping current local store.", error)
  })
  return authUser
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
  if (claimRoles.hasUnknownRoles) {
    signOut()
    return []
  }
  if (claimRoles.roles.length > 0) return claimRoles.roles
  const user = getAuthUser()
  return parseAdminRoles(user?.roles).roles
}

export function hasInvalidRoleClaims(): boolean {
  return resolveClaimRoles().hasUnknownRoles
}

export function signIn(user: AuthUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function signOut() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY)
  }
  clearAdminBackendTokens()
}

export function isAuthed() {
  const user = getAuthUser()
  if (!user) return false

  if (isBackendAuthEnabled()) {
    const token = readAdminBackendAccessToken()
    if (!token || isTokenExpired(token) || hasInvalidRoleClaims()) {
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

export async function registerWithCredentials(credentials: {
  email: string
  password: string
  fullName?: string
  phone?: string
}): Promise<AuthUser> {
  const normalizedEmail = credentials.email.trim().toLowerCase()

  if (isOpenAuthEnabled() && import.meta.env.DEV) {
    const authUser = buildDevAuthUser(normalizedEmail)
    signIn(authUser)
    return authUser
  }

  if (!isBackendAuthEnabled()) {
    throw new Error("Admin backend authentication is disabled.")
  }

  const backend = await backendRegister({
    email: normalizedEmail,
    password: credentials.password,
    fullName: credentials.fullName,
    phone: credentials.phone,
  })

  return finalizeBackendAuth(backend, credentials.fullName)
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

  return finalizeBackendAuth(backend)
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (!isBackendAuthEnabled()) {
    throw new Error("Admin backend authentication is disabled.")
  }

  await backendForgotPassword({ email: email.trim().toLowerCase() })
}

export async function verifyPasswordResetOtp(email: string, otp: string) {
  if (!isBackendAuthEnabled()) {
    throw new Error("Admin backend authentication is disabled.")
  }

  return backendVerifyOtp({
    email: email.trim().toLowerCase(),
    otp: otp.trim(),
  })
}

export async function resetPasswordWithOtp(email: string, otp: string, newPassword: string) {
  if (!isBackendAuthEnabled()) {
    throw new Error("Admin backend authentication is disabled.")
  }

  return backendResetPassword({
    email: email.trim().toLowerCase(),
    otp: otp.trim(),
    newPassword,
  })
}
