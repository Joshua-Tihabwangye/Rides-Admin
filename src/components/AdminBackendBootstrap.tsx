import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { isAuthed } from "../auth/auth"
import {
  createAdminSocket,
  isAdminBackendEnabled,
  syncAdminReferenceData,
} from "../services/api/adminApi"

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

    const socket = createAdminSocket()
    const syncFromRealtime = () => {
      void syncAdminReferenceData().catch(() => undefined)
    }
    const adminEventAliases: Record<string, string[]> = {
      "audit.log.entry": ["admin.audit.updated"],
      "approval.reviewed": ["approval.updated"],
      "service.updated": ["admin.service.updated"],
      "flag.changed": ["admin.flag.updated"],
      "cashout.request.updated": ["finance.payout.updated"],
      "risk.case.updated": ["admin.risk.updated"],
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
    ])

    syncEvents.forEach((eventName) => {
      socket.on(eventName, syncFromRealtime)
    })
    socket.connect()

    return () => {
      syncEvents.forEach((eventName) => {
        socket.off(eventName, syncFromRealtime)
      })
      socket.disconnect()
    }
  }, [adminBackendEnabled])

  return null
}
