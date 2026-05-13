import { backendForgotPassword, backendLogin, isBackendAuthEnabled } from "../services/api/authApi"
import {
  clearAdminBackendTokens,
  saveAdminBackendTokens,
  syncAdminReferenceData,
} from "../services/api/adminApi"

export type AuthUser = {
  name: string
  email: string
  role: string
}

const STORAGE_KEY = 'evzone_admin_auth'

export function getAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function signIn(user: AuthUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function signOut() {
  localStorage.removeItem(STORAGE_KEY)
  clearAdminBackendTokens()
}

export function isAuthed() {
  return !!getAuthUser()
}

export async function loginWithCredentials(credentials: { email: string; password: string }): Promise<AuthUser> {
  const normalizedEmail = credentials.email.trim().toLowerCase()

  if (!isBackendAuthEnabled()) {
    throw new Error("Admin backend authentication is disabled.")
  }

  const backend = await backendLogin({
    email: normalizedEmail,
    password: credentials.password,
  })

  saveAdminBackendTokens(backend.accessToken, backend.refreshToken)
  const authUser: AuthUser = {
    name: backend.user.email.split("@")[0] || "Admin",
    email: backend.user.email,
    role: backend.user.roles?.includes("super_admin") ? "Super Admin" : "Admin",
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
