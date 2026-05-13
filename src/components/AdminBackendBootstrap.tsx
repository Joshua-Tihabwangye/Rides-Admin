import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { isAuthed } from "../auth/auth"
import { BACKEND_FLAG_EVENT } from "../services/api/config"
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
    socket.connect()
    const syncFromRealtime = () => {
      void syncAdminReferenceData().catch(() => undefined)
    }

    const syncEvents = [
      "audit.log.entry",
      "admin.audit.updated",
      "approval.updated",
      "approval.reviewed",
      "flag.changed",
      "flag.created",
    ]

    syncEvents.forEach((eventName) => {
      socket.on(eventName, syncFromRealtime)
    })

    return () => {
      syncEvents.forEach((eventName) => {
        socket.off(eventName, syncFromRealtime)
      })
      socket.disconnect()
    }
  }, [adminBackendEnabled])

  return null
}
