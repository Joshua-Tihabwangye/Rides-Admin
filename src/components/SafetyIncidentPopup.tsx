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

type SafetyMessageSocketPayload = {
  incidentId?: string | null
  message?: {
    id: string
    text?: string | null
    audioUrl?: string | null
    senderRole?: string | null
    senderUserId?: string | null
    serviceType?: string | null
    serviceId?: string | null
    createdAt?: string | null
  }
}

type PopupAlert = {
  uid: string
  incidentId: string
  kind: "incident" | "message"
  title: string
  message: string
  audioUrl?: string | null
  serviceType?: string | null
  serviceId?: string | null
  createdAt?: string | null
  driverName: string
  driverId?: string | null
  riderName?: string | null
  riderPhone?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  sos: boolean
  audioDurationMs?: number | null
  vehicleInfo?: string | null
  tripStatus?: string | null
}

function formatIncidentTime(value?: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const MAX_STACKED = 3

export default function SafetyIncidentPopup() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<PopupAlert[]>([])
  const seenRef = useRef<Set<string>>(new Set())

  const dismissAlert = useCallback((uid: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.uid !== uid))
  }, [])

  const openAlert = useCallback(
    (alert: PopupAlert) => {
      // Standalone safety communications (sent before/without an incident)
      // have no incident page; route their alert to the safety overview.
      const target = alert.kind === "message" && !alert.incidentId
        ? "/admin/safety"
        : `/admin/safety/${alert.incidentId}`
      navigate(target)
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
        uid: `incident:${incident.id}`,
        kind: "incident",
        incidentId: incident.id,
        title: incident.sos ? "SOS EMERGENCY ALERT" : "Emergency assistance request",
        message: incident.description || "",
        driverName: driverName || reporterName,
        driverId: incident.driverId,
        riderName: incident.contextSnapshot?.ride?.rider?.name ?? null,
        riderPhone: incident.contextSnapshot?.ride?.rider?.phone ?? null,
        address: incident.address ?? incident.contextSnapshot?.incidentLocation?.address ?? null,
        latitude: incident.latitude ?? incident.contextSnapshot?.incidentLocation?.latitude ?? null,
        longitude: incident.longitude ?? incident.contextSnapshot?.incidentLocation?.longitude ?? null,
        serviceType: incident.serviceType,
        serviceId: incident.serviceId,
        sos: Boolean(incident.sos),
        audioUrl: incident.audioUrl,
        audioDurationMs: incident.audioDurationMs,
        createdAt: incident.createdAt,
        vehicleInfo: incident.contextSnapshot?.ride?.assignedVehicle
          ? [
              incident.contextSnapshot.ride.assignedVehicle.make,
              incident.contextSnapshot.ride.assignedVehicle.model,
            ]
              .filter(Boolean)
              .join(" ") + (incident.contextSnapshot.ride.assignedVehicle.plate ? ` (${incident.contextSnapshot.ride.assignedVehicle.plate})` : "")
          : null,
        tripStatus: incident.contextSnapshot?.ride?.status ?? null,
      }

      setAlerts((prev) => [...prev.slice(-(MAX_STACKED - 1)), alert])
    }

    const onEmergencyMessage = (payload: SafetyMessageSocketPayload) => {
      const message = payload?.message
      if (!message?.id) return
      if (seenRef.current.has(`msg:${message.id}`)) return
      seenRef.current.add(`msg:${message.id}`)

      const isVoice = !message.text && Boolean(message.audioUrl)
      const alert: PopupAlert = {
        uid: `msg:${message.id}`,
        kind: "message",
        incidentId: payload?.incidentId ?? "",
        title: isVoice ? "SAFETY VOICE NOTE" : "SAFETY MESSAGE",
        message: message.text || "",
        audioUrl: message.audioUrl,
        audioDurationMs: null,
        serviceType: message.serviceType,
        serviceId: message.serviceId,
        createdAt: message.createdAt,
        sos: false,
        driverName: message.senderRole || "Safety desk",
        driverId: message.senderUserId,
      }

      setAlerts((prev) => [...prev.slice(-(MAX_STACKED - 1)), alert])
    }

    socket.on("safety.incident.new", onSafetyIncident)
    socket.on("safety.emergency.message.new", onEmergencyMessage)
    socket.connect()

    return () => {
      socket.off("safety.incident.new", onSafetyIncident)
      socket.off("safety.emergency.message.new", onEmergencyMessage)
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
          key={alert.uid}
          elevation={12}
          onClick={() => openAlert(alert)}
          sx={{
            cursor: "pointer",
            borderRadius: 2,
            border: "1px solid #dc2626",
            bgcolor: "#ffffff",
            color: "#0f172a",
            overflow: "hidden",
            boxShadow: "0 18px 45px rgba(15,23,42,0.22)",
            animation: "safetyPopupIn 0.25s ease-out",
            "@keyframes safetyPopupIn": {
              from: { opacity: 0, transform: "translateX(24px)" },
              to: { opacity: 1, transform: "translateX(0)" },
            },
          }}
        >
          <Box sx={{ bgcolor: "#fef2f2", borderBottom: "1px solid #fecaca", px: 2, py: 1.5 }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  bgcolor: "#dc2626",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "0 0 auto",
                }}
              >
                <SmsFailedIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#111827", lineHeight: 1.2 }}>
                    {alert.title}
                  </Typography>
                  {alert.sos ? <Chip size="small" label="SOS" sx={{ height: 20, fontSize: 10, fontWeight: 900, color: "#fff", bgcolor: "#dc2626" }} /> : null}
                  {alert.kind === "message" ? <Chip size="small" label={alert.audioUrl ? "VOICE" : "MESSAGE"} sx={{ height: 20, fontSize: 10, fontWeight: 900 }} /> : null}
                </Stack>
                <Typography variant="body2" sx={{ fontSize: 12, color: "#334155", fontWeight: 800, mt: 0.25 }}>
                  {alert.driverName}
                </Typography>
              </Box>
              <IconButton
                size="small"
                aria-label="Dismiss alert"
                onClick={(event) => {
                  event.stopPropagation()
                  dismissAlert(alert.uid)
                }}
                sx={{ color: "#64748b", p: 0.5 }}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ p: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {alert.riderName ? (
                <Typography variant="caption" sx={{ color: "#475569", display: "block", fontWeight: 700 }}>
                  Rider: {alert.riderName}
                  {alert.riderPhone ? ` · ${alert.riderPhone}` : ""}
                </Typography>
              ) : null}
              {alert.vehicleInfo ? (
                <Typography variant="caption" sx={{ color: "#475569", display: "block", mt: 0.5 }}>
                  Vehicle: {alert.vehicleInfo}
                </Typography>
              ) : null}
              {alert.tripStatus ? (
                <Typography variant="caption" sx={{ color: "#475569", display: "block", mt: 0.5 }}>
                  Trip status: {alert.tripStatus}
                </Typography>
              ) : null}
              {alert.message ? (
                <Box sx={{ mt: 1, p: 1.25, borderRadius: 1.5, bgcolor: "#fff7ed", border: "1px solid #fed7aa" }}>
                  <Typography variant="body2" sx={{ fontSize: 12, color: "#7c2d12", fontWeight: 700, wordBreak: "break-word" }}>
                    {alert.message}
                  </Typography>
                </Box>
              ) : null}
              {alert.serviceType ? (
                <Typography variant="caption" sx={{ color: "#64748b", display: "block", mt: 0.75 }}>
                  Service: {alert.serviceType}
                  {alert.serviceId ? ` (${alert.serviceId})` : ""}
                </Typography>
              ) : null}
              {alert.address ? (
                <Typography variant="caption" sx={{ color: "#334155", display: "block", mt: 0.5, fontWeight: 700 }}>
                  Location: {alert.address}
                </Typography>
              ) : null}
              {alert.latitude != null && alert.longitude != null ? (
                <Typography variant="caption" sx={{ color: "#64748b", display: "block", mt: 0.5, fontFamily: "monospace" }}>
                  {alert.address ? "Coordinates: " : "Location: "}
                  {Number(alert.latitude).toFixed(5)}, {Number(alert.longitude).toFixed(5)}
                </Typography>
              ) : null}
              {formatIncidentTime(alert.createdAt) ? (
                <Typography variant="caption" sx={{ color: "#64748b", display: "block", mt: 0.5 }}>
                  Time: {formatIncidentTime(alert.createdAt)}
                </Typography>
              ) : null}
              {alert.audioUrl ? (
                <Box
                  component="audio"
                  controls
                  preload="metadata"
                  src={alert.audioUrl}
                  onClick={(event) => event.stopPropagation()}
                  sx={{ display: "block", width: "100%", mt: 1, height: 36, borderRadius: 1 }}
                />
              ) : null}
              <Button
                size="small"
                variant="contained"
                sx={{ mt: 1.25, fontSize: 11, fontWeight: 900, textTransform: "none", bgcolor: "#dc2626", "&:hover": { bgcolor: "#b91c1c" } }}
              >
                Open emergency incident
              </Button>
            </Box>
          </Stack>
        </Paper>
      ))}
    </Box>
  )
}
