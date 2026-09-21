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
import LocationOnIcon from "@mui/icons-material/LocationOn"
import MapIcon from "@mui/icons-material/Map"
import SmsFailedIcon from "@mui/icons-material/SmsFailed"
import {
  createAdminSocket,
  getAdminDriver,
  isAdminBackendEnabled,
  type AdminSafetyIncident,
} from "../services/api/adminApi"
import { attachAdminRealtimeSocket } from "../services/adminRealtime"

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

function mapsLink(latitude?: number | null, longitude?: number | null): string | null {
  if (latitude == null || longitude == null) return null
  return `https://www.google.com/maps?q=${Number(latitude)},${Number(longitude)}`
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

    const detach = attachAdminRealtimeSocket(socket, {
      rooms: ["operations"],
      events: {
        "safety.incident.new": onSafetyIncident,
        "safety.emergency.message.new": onEmergencyMessage,
      },
    })

    return () => {
      detach()
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
        maxWidth: 420,
        width: { xs: "calc(100% - 32px)", sm: 420 },
        maxHeight: "calc(100vh - 96px)",
        overflowY: "auto",
      }}
    >
      {alerts.map((alert) => {
        const mapUrl = mapsLink(alert.latitude, alert.longitude)

        return (
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
          <Box sx={{ bgcolor: "#fef2f2", borderBottom: "1px solid #fecaca", px: 2, py: 1.25 }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 36,
                  height: 36,
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
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ p: 1.75 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {(alert.riderName || alert.vehicleInfo || alert.tripStatus) ? (
                <Box sx={{ display: "grid", gap: 0.5, p: 1.1, borderRadius: 1.5, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  {alert.riderName ? (
                    <Typography variant="caption" sx={{ color: "#334155", display: "block", fontWeight: 800 }}>
                      Rider: {alert.riderName}
                      {alert.riderPhone ? ` · ${alert.riderPhone}` : ""}
                    </Typography>
                  ) : null}
                  {alert.vehicleInfo ? (
                    <Typography variant="caption" sx={{ color: "#475569", display: "block" }}>
                      Vehicle: {alert.vehicleInfo}
                    </Typography>
                  ) : null}
                  {alert.tripStatus ? (
                    <Typography variant="caption" sx={{ color: "#475569", display: "block" }}>
                      Trip status: {alert.tripStatus}
                    </Typography>
                  ) : null}
                </Box>
              ) : null}
              {alert.message ? (
                <Box sx={{ mt: 1, p: 1.25, borderRadius: 1.5, bgcolor: "#fff7ed", border: "1px solid #fed7aa" }}>
                  <Typography variant="body2" sx={{ fontSize: 12.5, color: "#7c2d12", fontWeight: 700, lineHeight: 1.45, wordBreak: "break-word" }}>
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
              {(alert.address || (alert.latitude != null && alert.longitude != null)) ? (
                <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 1, p: 1.1, borderRadius: 1.5, bgcolor: "#fef2f2", border: "1px solid #fecaca" }}>
                  <LocationOnIcon sx={{ color: "#dc2626", fontSize: 18, mt: 0.1 }} />
                  <Box sx={{ minWidth: 0 }}>
                    {alert.address ? (
                      <Typography variant="caption" sx={{ color: "#334155", display: "block", fontWeight: 800, lineHeight: 1.35 }}>
                        {alert.address}
                      </Typography>
                    ) : null}
                    {alert.latitude != null && alert.longitude != null ? (
                      <Typography variant="caption" sx={{ color: "#64748b", display: "block", mt: 0.3, fontFamily: "monospace" }}>
                        {Number(alert.latitude).toFixed(5)}, {Number(alert.longitude).toFixed(5)}
                      </Typography>
                    ) : null}
                  </Box>
                </Stack>
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
              <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
                <Button
                  size="small"
                  variant="contained"
                  sx={{ flex: 1, fontSize: 11, fontWeight: 900, textTransform: "none", bgcolor: "#dc2626", "&:hover": { bgcolor: "#b91c1c" } }}
                >
                  Open emergency incident
                </Button>
                {mapUrl ? (
                  <Button
                    size="small"
                    variant="outlined"
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    startIcon={<MapIcon sx={{ fontSize: 15 }} />}
                    onClick={(event) => event.stopPropagation()}
                    sx={{ fontSize: 11, fontWeight: 800, textTransform: "none", borderColor: "#fecaca", color: "#b91c1c" }}
                  >
                    Maps
                  </Button>
                ) : null}
              </Stack>
            </Box>
          </Stack>
        </Paper>
        )
      })}
    </Box>
  )
}
