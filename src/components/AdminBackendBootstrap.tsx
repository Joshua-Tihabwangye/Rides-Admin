import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { isAuthed } from "../auth/auth"
import {
  createAdminSocket,
  isAdminBackendEnabled,
  syncAdminReferenceData,
} from "../services/api/adminApi"
import { startAdminProactiveSessionRefresh } from "../services/api/httpClient"

export default function AdminBackendBootstrap() {
  const location = useLocation()
  const [adminBackendEnabled] = useState(() => isAdminBackendEnabled())

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

    // Refresh the access token before it expires so a racing 401-refresh
    // (parallel admin requests, multiple tabs) never logs the admin out
    // while idle.
    startAdminProactiveSessionRefresh()
  }, [adminBackendEnabled])

  useEffect(() => {
    if (!adminBackendEnabled || !isAuthed()) {
      return
    }

    const socket = createAdminSocket()
    let refreshTimer: number | null = null
    const receivedEventIds = new Set<string>()
    const syncFromRealtime = (payload?: unknown) => {
      if (payload && typeof payload === "object") {
        const eventId = (payload as Record<string, unknown>).eventId
        if (typeof eventId === "string") {
          if (receivedEventIds.has(eventId)) return
          receivedEventIds.add(eventId)
          if (receivedEventIds.size > 500) {
            const first = receivedEventIds.values().next().value
            if (first) receivedEventIds.delete(first)
          }
        }
      }
      if (refreshTimer !== null) window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null
        void syncAdminReferenceData().catch(() => undefined)
      }, 100)
    }
    const refreshOnResume = () => syncFromRealtime()
    const adminEventAliases: Record<string, string[]> = {
      "audit.log.entry": ["admin.audit.updated"],
      "approval.reviewed": ["approval.updated"],
      "service.updated": ["admin.service.updated"],
      "flag.changed": ["admin.flag.updated"],
      "cashout.request.updated": ["finance.payout.updated"],
      "risk.case.updated": ["admin.risk.updated"],
      "safety.incident.new": ["admin.safety.incidents.updated"],
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

    // Phase 1.5 equivalent for admin — event names are hardcoded from
    // events.contract.ts. No preflight HTTP fetch needed.
    const syncEvents = normalizeAdminEvents([
      "audit.log.entry",
      "admin.audit.updated",
      "approval.updated",
      "approval.reviewed",
      "flag.changed",
      "flag.created",
      "service.updated",
      "finance.payout.updated",
      "risk.case.updated",
      "safety.incident.new",
    ])

    syncEvents.forEach((eventName) => {
      socket.on(eventName, syncFromRealtime)
    })
    socket.connect()
    window.addEventListener("focus", refreshOnResume)
    window.addEventListener("online", refreshOnResume)
    document.addEventListener("visibilitychange", refreshOnResume)

    return () => {
      if (refreshTimer !== null) window.clearTimeout(refreshTimer)
      window.removeEventListener("focus", refreshOnResume)
      window.removeEventListener("online", refreshOnResume)
      document.removeEventListener("visibilitychange", refreshOnResume)
      syncEvents.forEach((eventName) => {
        socket.off(eventName, syncFromRealtime)
      })
      socket.disconnect()
    }
  }, [adminBackendEnabled])

  return null
}
