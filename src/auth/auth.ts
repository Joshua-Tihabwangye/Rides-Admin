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
}

export function isAuthed() {
  return !!getAuthUser()
}
