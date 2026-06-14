import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { backendFetchSession, isBackendAuthEnabled } from '../services/api/authApi'
import { signIn, signOut, type AuthUser, isAuthed } from './auth'

function buildUserFromSession(session: Awaited<ReturnType<typeof backendFetchSession>>): AuthUser {
  const roles = Array.isArray(session.user.roles) ? session.user.roles : []
  return {
    name: session.user.email.split("@")[0] || "Admin",
    email: session.user.email,
    role: roles.includes("super_admin") ? "Super Admin" : "Admin",
    roles,
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
