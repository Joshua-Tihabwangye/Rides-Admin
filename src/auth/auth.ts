import { backendForgotPassword, backendLogin, isBackendAuthEnabled } from "../services/api/authApi"
import { ApiRequestError } from "../services/api/httpClient"
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

function shouldFallbackToLocal(error: unknown) {
  if (error instanceof TypeError) return true
  if (error instanceof ApiRequestError) {
    return error.status >= 500
  }
  return false
}

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

  if (isBackendAuthEnabled()) {
    try {
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
    } catch (error) {
      if (!shouldFallbackToLocal(error)) {
        throw error
      }
      console.warn("Admin backend login unavailable. Falling back to local auth.", error)
    }
  }

  const fallbackUser: AuthUser = {
    name: "Admin",
    email: normalizedEmail || credentials.email,
    role: "Admin (simulated)",
  }
  signIn(fallbackUser)
  return fallbackUser
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (!isBackendAuthEnabled()) return

  try {
    await backendForgotPassword({ email: email.trim().toLowerCase() })
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }
    console.warn("Admin backend forgot-password unavailable. Continuing local flow.", error)
  }
}
