import React, { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import SmsFailedIcon from "@mui/icons-material/SmsFailed"
import {
  createAdminSocket,
  getAdminDriver,
  isAdminBackendEnabled,
  type AdminSafetyIncident,
} from "../services/api/adminApi"

type SafetyIncidentReporter = {
  id?: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: string
}

type SafetyIncidentSocketPayload = {
  incident?: Partial<AdminSafetyIncident>
  reporter?: SafetyIncidentReporter
  emergencyContacts?: Array<{ name?: string; phone?: string }>
}

type PopupAlert = {
  incidentId: string
  title: string
  message: string
  driverName: string
  driverId?: string | null
  latitude?: number | null
  longitude?: number | null
  serviceType?: string | null
  serviceId?: string | null
  sos: boolean
  createdAt?: string | null
}

function mapsLink(latitude: number | null | undefined, longitude: number | null | undefined): string | null {
  if (latitude == null || longitude == null) return null
  return `https://maps.google.com/?q=${latitude},${longitude}`
}

const MAX_STACKED = 3

export default function SafetyIncidentPopup() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<PopupAlert[]>([])
  const seenRef = useRef<Set<string>>(new Set())

  const dismissAlert = useCallback((incidentId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.incidentId !== incidentId))
  }, [])

  const openAlert = useCallback(
    (alert: PopupAlert) => {
      if (alert.driverId) {
        navigate(`/admin/drivers/${alert.driverId}`)
      } else {
        navigate("/admin/safety")
      }
    },
    [navigate],
  )

  useEffect(() => {
    if (!isAdminBackendEnabled()) return

    const socket = createAdminSocket()

    const onSafetyIncident = async (payload: SafetyIncidentSocketPayload) => {
      const incident = payload?.incident
      if (!incident?.id) return
      if (seenRef.current.has(incident.id)) return
      seenRef.current.add(incident.id)

      const reporter = payload?.reporter
      const reporterName = [reporter?.firstName, reporter?.lastName].filter(Boolean).join(" ") || "Unknown user"

      let driverName = ""
      if (incident.driverId) {
        try {
          const driver = await getAdminDriver(incident.driverId)
          driverName = driver.fullName || [driver.firstName, driver.lastName].filter(Boolean).join(" ")
        } catch {
          driverName = ""
        }
      }

      const alert: PopupAlert = {
        incidentId: incident.id,
        title: incident.sos ? "SOS EMERGENCY ALERT" : "Emergency assistance request",
        message: incident.description || "",
        driverName: driverName || reporterName,
        driverId: incident.driverId,
        latitude: incident.latitude,
        longitude: incident.longitude,
        serviceType: incident.serviceType,
        serviceId: incident.serviceId,
        sos: Boolean(incident.sos),
        createdAt: incident.createdAt,
      }

      setAlerts((prev) => [...prev.slice(-(MAX_STACKED - 1)), alert])
    }

    socket.on("safety.incident.new", onSafetyIncident)
    socket.connect()

    return () => {
      socket.off("safety.incident.new", onSafetyIncident)
      socket.disconnect()
    }
  }, [])

  if (alerts.length === 0) return null

  return (
    <Box
      sx={{
        position: "fixed",
        top: 80,
        right: 16,
        zIndex: (theme) => theme.zIndex.drawer + 20,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        maxWidth: 380,
        width: "calc(100% - 32px)",
      }}
    >
      {alerts.map((alert) => (
        <Paper
          key={alert.incidentId}
          elevation={12}
          onClick={() => openAlert(alert)}
          sx={{
            cursor: "pointer",
            borderRadius: 2,
            border: "2px solid #dc2626",
            bgcolor: "#7f1d1d",
            color: "#fecaca",
            p: 2,
            animation: "safetyPopupIn 0.25s ease-out",
            "@keyframes safetyPopupIn": {
              from: { opacity: 0, transform: "translateX(24px)" },
              to: { opacity: 1, transform: "translateX(0)" },
            },
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <SmsFailedIcon sx={{ fontSize: 28, color: "#fecaca", mt: 0.25 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle1" className="font-black tracking-wide text-red-100" sx={{ fontSize: 13 }}>
                  {alert.title}
                </Typography>
                {alert.sos ? <Chip size="small" color="error" label="SOS" sx={{ height: 20, fontSize: 10 }} /> : null}
              </Stack>
              <Typography variant="body2" sx={{ fontSize: 12, color: "#fecaca", fontWeight: 700, mt: 0.5 }}>
                {alert.driverName}
              </Typography>
              {alert.message ? (
                <Typography variant="body2" sx={{ fontSize: 12, color: "#fde68a", mt: 0.5, wordBreak: "break-word" }}>
                  {alert.message}
                </Typography>
              ) : null}
              {alert.serviceType ? (
                <Typography variant="caption" sx={{ color: "#fecaca", opacity: 0.85, display: "block", mt: 0.5 }}>
                  Service: {alert.serviceType}
                  {alert.serviceId ? ` (${alert.serviceId})` : ""}
                </Typography>
              ) : null}
              {alert.latitude != null && alert.longitude != null ? (
                <Typography variant="caption" sx={{ color: "#fecaca", opacity: 0.85, display: "block", mt: 0.5 }}>
                  Location: {Number(alert.latitude).toFixed(5)}, {Number(alert.longitude).toFixed(5)}
                </Typography>
              ) : null}
              <Button
                size="small"
                variant="contained"
                sx={{ mt: 1, fontSize: 11, fontWeight: 800, bgcolor: "#dc2626", "&:hover": { bgcolor: "#b91c1c" } }}
              >
                {alert.driverId ? "Open driver" : "Open safety desk"}
              </Button>
            </Box>
            <IconButton
              size="small"
              aria-label="Dismiss alert"
              onClick={(event) => {
                event.stopPropagation()
                dismissAlert(alert.incidentId)
              }}
              sx={{ color: "#fecaca", p: 0.5 }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </Paper>
      ))}
    </Box>
  )
}
