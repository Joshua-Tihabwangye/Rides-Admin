import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { backendFetchSession, isBackendAuthEnabled } from '../services/api/authApi'
import {
  ADMIN_BACKEND_ROLE_ENUMS,
  ADMIN_ROLE_OPTIONS,
  getAuthUser,
  signIn,
  signOut,
  type AdminBackendRole,
  type AuthUser,
  isAuthed,
} from './auth'

const ADMIN_ROLE_SET = new Set<string>(ADMIN_BACKEND_ROLE_ENUMS)

function normalizeAdminRole(value?: string): AdminBackendRole | undefined {
  const normalized = value?.trim().toLowerCase()
  return normalized && ADMIN_ROLE_SET.has(normalized) ? normalized as AdminBackendRole : undefined
}

function buildUserFromSession(session: Awaited<ReturnType<typeof backendFetchSession>>): AuthUser {
  const roles = Array.isArray(session.user.roles)
    ? session.user.roles.filter((role) => normalizeAdminRole(role))
    : []
  const previousActiveRole = normalizeAdminRole(getAuthUser()?.activeRole)
  const activeRole =
    previousActiveRole && roles.includes(previousActiveRole)
      ? previousActiveRole
      : roles.includes("super_admin")
        ? "super_admin"
        : normalizeAdminRole(roles[0])
  const roleLabel = ADMIN_ROLE_OPTIONS.find((option) => option.value === activeRole)?.label ?? "Admin"
  const realName = [session.user.firstName, session.user.lastName].filter(Boolean).join(" ").trim()
  return {
    name: realName || session.user.email,
    email: session.user.email,
    role: roleLabel,
    roles,
    activeRole,
    permissions: Array.isArray(session.permissions) ? session.permissions : [],
    defaultRedirect: session.defaultRedirect,
  }
}

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [hydrated, setHydrated] = React.useState(() => !isBackendAuthEnabled())
  const [allowed, setAllowed] = React.useState(() => !isBackendAuthEnabled() ? isAuthed() : false)

  React.useEffect(() => {
    let cancelled = false

    const hydrate = async () => {
      if (!isBackendAuthEnabled()) {
        if (!cancelled) {
          setAllowed(isAuthed())
          setHydrated(true)
        }
        return
      }

      try {
        const session = await backendFetchSession()
        if (cancelled) return
        signIn(buildUserFromSession(session))
        setAllowed(true)
      } catch {
        if (cancelled) return
        signOut()
        setAllowed(false)
      } finally {
        if (!cancelled) {
          setHydrated(true)
        }
      }
    }

    void hydrate()

    return () => {
      cancelled = true
    }
  }, [])

  if (!hydrated) {
    return <div aria-hidden style={{ minHeight: '100vh', background: 'transparent' }} />
  }

  if (!allowed) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
