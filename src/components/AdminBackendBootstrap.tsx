import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { isAuthed } from "../auth/auth"
import { API_BASE_URL, BACKEND_FLAG_EVENT } from "../services/api/config"
import {
  createAdminSocket,
  isAdminBackendEnabled,
  syncAdminReferenceData,
} from "../services/api/adminApi"

export default function AdminBackendBootstrap() {
  const location = useLocation()
  const [adminBackendEnabled, setAdminBackendEnabled] = useState(() => isAdminBackendEnabled())

  useEffect(() => {
    if (typeof window === "undefined") return undefined

    const syncBackendFlag = () => {
      setAdminBackendEnabled(isAdminBackendEnabled())
    }

    window.addEventListener(BACKEND_FLAG_EVENT, syncBackendFlag as EventListener)
    syncBackendFlag()

    return () => {
      window.removeEventListener(BACKEND_FLAG_EVENT, syncBackendFlag as EventListener)
    }
  }, [])

  useEffect(() => {
    if (!adminBackendEnabled || !isAuthed()) {
      return
    }

    void syncAdminReferenceData().catch((error) => {
      console.warn("Admin backend sync failed. Keeping current local store.", error)
    })
  }, [adminBackendEnabled, location.pathname])

  useEffect(() => {
    if (!adminBackendEnabled || !isAuthed()) {
      return
    }

    const socket = createAdminSocket()
    const syncFromRealtime = () => {
      void syncAdminReferenceData().catch(() => undefined)
    }
    const adminEventAliases: Record<string, string[]> = {
      "audit.log.entry": ["admin.audit.updated"],
      "approval.reviewed": ["approval.updated"],
    }
    const normalizeAdminEvents = (events: string[]) => {
      const normalized = new Set<string>()
      events.forEach((eventName) => {
        if (!eventName) return
        normalized.add(eventName)
        ;(adminEventAliases[eventName] || []).forEach((alias) => normalized.add(alias))
      })
      return Array.from(normalized)
    }

    const defaultSyncEvents = normalizeAdminEvents([
      "audit.log.entry",
      "admin.audit.updated",
      "approval.updated",
      "approval.reviewed",
      "flag.changed",
      "flag.created",
    ])
    let syncEvents = [...defaultSyncEvents]
    let cancelled = false

    const bootstrapRealtime = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/compat/realtime/events`)
        if (response.ok) {
          const payload = await response.json()
          const data = (payload?.data || payload) as { admin?: { server?: Record<string, string> } }
          const backendEvents = Object.values(data?.admin?.server || {}).filter(
            (value): value is string => typeof value === "string" && value.length > 0,
          )
          if (backendEvents.length > 0) {
            syncEvents = normalizeAdminEvents([...defaultSyncEvents, ...backendEvents])
          }
        }
      } catch {
        // fallback to defaults
      }

      if (cancelled) return
      syncEvents.forEach((eventName) => {
        socket.on(eventName, syncFromRealtime)
      })
      socket.connect()
    }

    void bootstrapRealtime()

    return () => {
      cancelled = true
      syncEvents.forEach((eventName) => {
        socket.off(eventName, syncFromRealtime)
      })
      socket.disconnect()
    }
  }, [adminBackendEnabled])

  return null
}
