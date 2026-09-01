import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Stack,
  Paper,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import MicIcon from "@mui/icons-material/Mic";
import {
  getAdminSafetyIncident,
  updateAdminSafetyIncident,
  createAdminSocket,
} from "../services/api/adminApi";
import type { AdminSafetyIncident } from "../services/api/adminApi";
import {
  adminGetSosSessionByIncident,
  type AdminSosSessionDetail,
} from "../services/api/adminChatApi";
import AdminTripCommunicationPanel from "../components/AdminTripCommunicationPanel";

function mapsLink(latitude?: number | null, longitude?: number | null): string | null {
  if (latitude == null || longitude == null) return null;
  return `https://www.google.com/maps?q=${Number(latitude)},${Number(longitude)}`;
}

type LiveLocation = {
  latitude: number;
  longitude: number;
  address?: string | null;
  updatedAt: number;
};

const statusColor: Record<string, string> = {
  PENDING: "warning",
  ACTIVE: "error",
  ACKNOWLEDGED: "info",
  RESOLVED: "success",
  ASSIGNED: "secondary",
};

export default function SosIncidentDetailPage() {
  const { incidentId = "" } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();

  const [incident, setIncident] = useState<AdminSafetyIncident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patching, setPatching] = useState(false);

  const [sos, setSos] = useState<AdminSosSessionDetail | null>(null);
  const [live, setLive] = useState<LiveLocation | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const inc = await getAdminSafetyIncident(incidentId);
      setIncident(inc);
      if (inc.latitude != null && inc.longitude != null) {
        setLive({ latitude: inc.latitude, longitude: inc.longitude, address: inc.address ?? null, updatedAt: Date.now() });
      }
      try {
        const detail = await adminGetSosSessionByIncident(incidentId);
        if (detail) {
          setSos(detail);
          setSessionStatus(detail.session?.status ?? null);
          setLive({
            latitude: detail.session.latitude,
            longitude: detail.session.longitude,
            address: detail.session.address ?? inc.address ?? null,
            updatedAt: Date.now(),
          });
        }
      } catch {
        // No active SOS session for this incident; location from incident still shown.
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load incident");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!incidentId) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  const patchStatus = async (status: string) => {
    if (!incident) return;
    setPatching(true);
    try {
      const next = await updateAdminSafetyIncident(incident.id, { status });
      setIncident(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setPatching(false);
    }
  };

  useEffect(() => {
    const socket = createAdminSocket();
    socket.connect();

    const onSessionUpdate = (payload: any) => {
      if (!payload) return;
      if (payload.incidentId && payload.incidentId !== incidentId) return;
      if (payload.sessionId && sos && payload.sessionId !== sos.session.id) return;
      if (payload.status) setSessionStatus(payload.status);
      const lat = payload.latitude ?? payload.session?.latitude;
      const lng = payload.longitude ?? payload.session?.longitude;
      if (lat != null && lng != null) {
        setLive({ latitude: lat, longitude: lng, address: payload.address ?? undefined, updatedAt: Date.now() });
      }
    };

    const onLocationUpdate = (payload: any) => {
      if (!payload) return;
      if (payload.incidentId && payload.incidentId !== incidentId) return;
      if (payload.sessionId && sos && payload.sessionId !== sos.session.id) return;
      const lat = payload.latitude ?? payload.lng;
      const lng = payload.longitude ?? payload.lng;
      if (lat == null || lng == null) return;
      setLive({ latitude: lat, longitude: lng, address: payload.address ?? undefined, updatedAt: Date.now() });
    };

    socket.on("sos.session.update", onSessionUpdate);
    socket.on("sos.location.update", onLocationUpdate);
    socket.on("connect", () => socket.emit("subscribe", { rooms: ["operations"] }));

    return () => {
      socket.off("sos.session.update", onSessionUpdate);
      socket.off("sos.location.update", onLocationUpdate);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId, sos?.session?.id]);

  const toggleAudio = () => {
    const url = incident?.audioUrl;
    if (!url) return;
    if (playingAudio) {
      audioRef.current?.pause();
      setPlayingAudio(false);
      return;
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlayingAudio(false);
    void audio.play().then(() => setPlayingAudio(true)).catch(() => setPlayingAudio(false));
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !incident) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!incident) return null;

  const reporterName = sos?.recipients?.find((r) => r.type === "ADMIN")?.name || "Reporter";

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate("/admin/safety")}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          SOS Incident
        </Typography>
        <Chip
          label={incident.status}
          color={(statusColor[incident.status] as any) ?? "default"}
          size="small"
        />
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Incident details
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 2, mt: 1 }}>
              <div>
                <Typography variant="caption" color="text.secondary">
                  Reporter
                </Typography>
                <Typography variant="body2">{reporterName}</Typography>
              </div>
              <div>
                <Typography variant="caption" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body2">{incident.type}</Typography>
              </div>
              <div>
                <Typography variant="caption" color="text.secondary">
                  Service
                </Typography>
                <Typography variant="body2">{incident.serviceType || "—"}</Typography>
              </div>
              <div>
                <Typography variant="caption" color="text.secondary">
                  Reported at
                </Typography>
                <Typography variant="body2">
                  {incident.createdAt ? new Date(incident.createdAt).toLocaleString() : "—"}
                </Typography>
              </div>
            </Box>
            {incident.description && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body2">{incident.description}</Typography>
              </Box>
            )}

            {incident.audioUrl && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  SOS voice note
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<MicIcon />}
                  onClick={toggleAudio}
                  sx={{ mt: 0.5 }}
                >
                  {playingAudio ? "Stop" : "Play"} voice note
                  {incident.audioDurationMs ? ` (${Math.round(incident.audioDurationMs / 1000)}s)` : ""}
                </Button>
              </Box>
            )}

            {live && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Reported location
                </Typography>
                <Typography variant="body2">
                  {live.latitude.toFixed(6)}, {live.longitude.toFixed(6)}
                  {live.address ? ` — ${live.address}` : ""}
                </Typography>
              </Box>
            )}

            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                disabled={patching || incident.status === "ACKNOWLEDGED"}
                onClick={() => patchStatus("ACKNOWLEDGED")}
                variant="contained"
                size="small"
              >
                Acknowledge
              </Button>
              <Button
                disabled={patching || incident.status === "RESOLVED"}
                onClick={() => patchStatus("RESOLVED")}
                color="success"
                variant="contained"
                size="small"
              >
                Resolve
              </Button>
              {live && mapsLink(live.latitude, live.longitude) && (
                <Button
                  href={mapsLink(live.latitude, live.longitude)!}
                  target="_blank"
                  rel="noreferrer"
                  variant="outlined"
                  size="small"
                >
                  Open in maps
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <MyLocationIcon color="error" />
              <Typography variant="subtitle2">Live emergency location</Typography>
              {sessionStatus && (
                <Chip label={`SOS call: ${sessionStatus}`} color="error" size="small" sx={{ ml: "auto" }} />
              )}
            </Stack>
            {live ? (
              <>
                <Typography component="div" variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  Lat {live.latitude.toFixed(6)} · Lng {live.longitude.toFixed(6)}
                </Typography>
                {live.address && (
                  <Typography variant="body2" color="text.secondary">
                    {live.address}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  Updated {new Date(live.updatedAt).toLocaleTimeString()}
                  {live.updatedAt > Date.now() - 10000 ? " · LIVE" : " · last known"}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No live location available.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Stack>

      <Paper sx={{ mt: 2, border: "1px solid", borderColor: "divider" }}>
        <AdminTripCommunicationPanel
          serviceType={incident.serviceType || "RIDE"}
          serviceId={incident.serviceId || undefined}
          driverId={incident.driverId || undefined}
          reporterUserId={incident.reporterUserId || undefined}
        />
      </Paper>
    </Box>
  );
}
