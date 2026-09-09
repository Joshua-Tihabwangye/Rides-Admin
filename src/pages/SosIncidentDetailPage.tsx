import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
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
  listAdminEmergencyMessages,
  getAdminIncidentHistory,
  updateAdminSafetyIncident,
  createAdminSocket,
  type AdminIncidentEventLog,
} from "../services/api/adminApi";
import type { AdminSafetyIncident } from "../services/api/adminApi";
import { ApiRequestError } from "../services/api/httpClient";
import {
  adminGetSosSessionByIncident,
  type AdminSosSessionDetail,
} from "../services/api/adminChatApi";
import AdminTripCommunicationPanel from "../components/AdminTripCommunicationPanel";
import RideRouteMap from "../components/rides/RideRouteMap";
import type { AdminRideStopResponse } from "../services/api/adminApi";

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
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [patching, setPatching] = useState(false);
  const [messages, setMessages] = useState<Awaited<ReturnType<typeof listAdminEmergencyMessages>>>([]);
  const [history, setHistory] = useState<AdminIncidentEventLog[]>([]);

  const [sos, setSos] = useState<AdminSosSessionDetail | null>(null);
  const [live, setLive] = useState<LiveLocation | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    setErrorStatus(null);
    try {
      const inc = await getAdminSafetyIncident(incidentId);
      setIncident(inc);
      try { setMessages(await listAdminEmergencyMessages(incidentId)); } catch { setMessages([]); }
      try {
        const historyEntries = await getAdminIncidentHistory(incidentId);
        setHistory(historyEntries ?? []);
      } catch { setHistory([]); }
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
      setErrorStatus(e instanceof ApiRequestError ? e.status : null);
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
      const lat = payload.latitude ?? payload.lat;
      const lng = payload.longitude ?? payload.lng;
      if (lat == null || lng == null) return;
      setLive({ latitude: lat, longitude: lng, address: payload.address ?? undefined, updatedAt: Date.now() });
    };

    const onEmergencyMessage = (payload: any) => {
      if (!payload || payload.incidentId !== incidentId || !payload.message) return;
      setMessages((current) => current.some((item) => item.id === payload.message.id) ? current : [...current, payload.message]);
    };

    socket.on("sos.session.update", onSessionUpdate);
    socket.on("sos.location.update", onLocationUpdate);
    socket.on("safety.emergency.message.new", onEmergencyMessage);
    socket.on("connect", () => socket.emit("subscribe", { rooms: ["operations"] }));

    return () => {
      socket.off("sos.session.update", onSessionUpdate);
      socket.off("sos.location.update", onLocationUpdate);
      socket.off("safety.emergency.message.new", onEmergencyMessage);
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
    if (errorStatus === 404) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="warning">
            This safety incident no longer exists or could not be found.
          </Alert>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={() => { setError(null); void load(); }}>
            Retry
          </Button>
        </Box>
      );
    }
    if (errorStatus === 403) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            You do not have permission to view this safety incident. Contact an administrator if you believe this is a mistake.
          </Alert>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={() => { setError(null); void load(); }}>
            Retry
          </Button>
        </Box>
      );
    }
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => { setError(null); void load(); }}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!incident) return null;

  const reporterName =
    sos?.session?.reporterName || incident.reporterUserId || "Reporter";

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
                <Typography variant="body2">
                  {incident.view?.reporter?.name || reporterName}
                  {incident.view?.reporter?.phone ? ` · ${incident.view.reporter.phone}` : ""}
                </Typography>
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
              {incident.view?.placeName ? (
                <div>
                  <Typography variant="caption" color="text.secondary">
                    Place
                  </Typography>
                  <Typography variant="body2">{incident.view.placeName}</Typography>
                </div>
              ) : null}
              <div>
                <Typography variant="caption" color="text.secondary">
                  Activations
                </Typography>
                <Typography variant="body2">
                  {incident.contextSnapshot?.activation?.count
                    ? `${incident.contextSnapshot.activation.count}`
                    : "1"}
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

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">Emergency communication</Typography>
              {messages.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>No text messages yet.</Typography>
              ) : messages.map((message) => (
                <Paper key={message.id} variant="outlined" sx={{ mt: 1, p: 1.25 }}>
                  <Typography variant="caption" color="text.secondary">
                    {message.senderRole} · {new Date(message.createdAt).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">{message.text}</Typography>
                </Paper>
              ))}
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">Status history</Typography>
              {history.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>No status events recorded.</Typography>
              ) : (
                history.map((event) => (
                  <Stack key={event.id} direction="row" spacing={1} alignItems="baseline" sx={{ mt: 0.5 }}>
                    <Typography variant="caption" sx={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                      {new Date(event.createdAt).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {event.eventType}
                    </Typography>
                    {event.actorUserId && (
                      <Typography variant="caption" color="text.secondary">
                        by {event.actorUserId}
                      </Typography>
                    )}
                    {event.data && Object.keys(event.data).length > 0 && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ flexGrow: 1, textAlign: "right", fontFamily: "monospace", fontSize: 11 }}
                      >
                        {JSON.stringify(event.data)}
                      </Typography>
                    )}
                  </Stack>
                ))
              )}
            </Box>

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

            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
              {incident.contextSnapshot?.ride?.rideId && (
                <Button
                  onClick={() => navigate(`/admin/rides/${incident.contextSnapshot!.ride!.rideId}`)}
                  variant="outlined"
                  size="small"
                  startIcon={<ArrowBackIcon sx={{ transform: "rotate(180deg)" }} />}
                >
                  Open full ride
                </Button>
              )}
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

        {incident.contextSnapshot?.ride ? (() => {
          const ride = incident.contextSnapshot!.ride!;
          const rideMapsLink =
            ride.pickup?.latitude != null && ride.pickup?.longitude != null
              ? mapsLink(ride.pickup.latitude, ride.pickup.longitude)
              : undefined;
          return (
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">Linked ride</Typography>
                  <Chip label={ride.status ?? "—"} color="primary" size="small" sx={{ ml: "auto" }} />
                </Stack>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 2 }}>
                  {ride.rider && (
                    <div>
                      <Typography variant="caption" color="text.secondary">Rider</Typography>
                      <Typography variant="body2">
                        {ride.rider.name || ride.rider.userId || "—"}
                        {ride.rider.phone ? ` · ${ride.rider.phone}` : ""}
                      </Typography>
                    </div>
                  )}
                  {ride.assignedDriver && (
                    <div>
                      <Typography variant="caption" color="text.secondary">Driver</Typography>
                      <Typography variant="body2">
                        {ride.assignedDriver.name || ride.assignedDriver.userId || "—"}
                        {ride.assignedDriver.phone ? ` · ${ride.assignedDriver.phone}` : ""}
                      </Typography>
                    </div>
                  )}
                  {ride.assignedVehicle && (
                    <div>
                      <Typography variant="caption" color="text.secondary">Vehicle</Typography>
                      <Typography variant="body2">
                        {[ride.assignedVehicle.make, ride.assignedVehicle.model].filter(Boolean).join(" ") || "—"}
                        {ride.assignedVehicle.plate ? ` · ${ride.assignedVehicle.plate}` : ""}
                      </Typography>
                    </div>
                  )}
                  <div>
                    <Typography variant="caption" color="text.secondary">Route</Typography>
                    <Typography variant="body2">
                      {ride.pickup?.address || "Pickup"} → {ride.destination?.address || "Dropoff"}
                    </Typography>
                    {(ride.estimatedDistanceKm != null || ride.estimatedDurationMinutes != null) && (
                      <Typography variant="caption" color="text.secondary">
                        {ride.estimatedDistanceKm != null ? `~${ride.estimatedDistanceKm} km` : ""}
                        {ride.estimatedDurationMinutes != null
                          ? ` · ~${ride.estimatedDurationMinutes} min`
                          : ""}
                      </Typography>
                    )}
                  </div>
                  <div>
                    <Typography variant="caption" color="text.secondary">Fare</Typography>
                    <Typography variant="body2">
                      {ride.fare?.estimatedFare != null
                        ? `${ride.fare.estimatedFare.toLocaleString()} ${ride.fare?.currency ?? ""}`
                        : "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Payment {ride.fare?.paymentStatus ?? "—"}
                      {ride.fare?.paymentMethod ? ` · ${ride.fare.paymentMethod}` : ""}
                    </Typography>
                  </div>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <RideRouteMap route={ride.route as Record<string, unknown> | undefined} stops={(ride.stops ?? []).map((stop, index) => ({
                    id: `${ride.rideId}-sos-${index}`,
                    sequence: stop.sequence ?? index + 1,
                    type: stop.type ?? "STOP",
                    address: stop.address ?? "",
                    latitude: stop.latitude ?? 0,
                    longitude: stop.longitude ?? 0,
                    status: stop.status ?? "UNKNOWN",
                  })) as AdminRideStopResponse[]} />
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">Stops</Typography>
                  {(ride.stops ?? []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No stops recorded.</Typography>
                  ) : (ride.stops ?? []).map((stop, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                      <Typography variant="body2" sx={{ minWidth: 56, fontWeight: 700 }}>{stop.type ?? `#${i + 1}`}</Typography>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>{stop.address || "—"}</Typography>
                      {stop.latitude != null && stop.longitude != null && mapsLink(stop.latitude, stop.longitude) && (
                        <Button
                          href={mapsLink(stop.latitude, stop.longitude)!}
                          target="_blank"
                          rel="noreferrer"
                          size="small"
                          variant="text"
                        >
                          Maps
                        </Button>
                      )}
                    </Stack>
                  ))}
                </Box>
                {rideMapsLink && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      href={rideMapsLink}
                      target="_blank"
                      rel="noreferrer"
                      variant="outlined"
                      size="small"
                    >
                      Open pickup in maps
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })() : null}

        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="subtitle2">People involved</Typography>
              <Chip
                size="small"
                label={incident.view?.placeName ?? incident.address ?? "Location unknown"}
                color="default"
                sx={{ ml: "auto", fontSize: 11 }}
              />
            </Stack>
            {!incident.view?.reporter && !incident.view?.rider && !incident.view?.driver && !incident.view?.vehicle ? (
              <Typography variant="body2" color="text.secondary">
                No linked party details recorded for this incident.
              </Typography>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 2 }}>
                {incident.view?.reporter?.name || incident.view?.reporter?.phone || incident.view?.reporter?.userId ? (
                  <div>
                    <Typography variant="caption" color="text.secondary">Reporter</Typography>
                    <Typography variant="body2">
                      {incident.view.reporter.name || incident.view.reporter.userId || "Reporter"}
                      {incident.view.reporter.phone ? ` · ${incident.view.reporter.phone}` : ""}
                    </Typography>
                    {incident.view.reporter.role ? (
                      <Typography variant="caption" color="text.secondary">{incident.view.reporter.role}</Typography>
                    ) : null}
                  </div>
                ) : null}
                {incident.view?.rider ? (
                  <div>
                    <Typography variant="caption" color="text.secondary">Rider</Typography>
                    <Typography variant="body2">
                      {incident.view.rider.name || incident.view.rider.userId || "—"}
                      {incident.view.rider.phone ? ` · ${incident.view.rider.phone}` : ""}
                    </Typography>
                    {incident.view.rider.userId ? (
                      <Typography variant="caption" color="text.secondary">{incident.view.rider.userId}</Typography>
                    ) : null}
                  </div>
                ) : null}
                {incident.view?.driver ? (
                  <div>
                    <Typography variant="caption" color="text.secondary">Driver</Typography>
                    <Typography variant="body2">
                      {incident.view.driver.name || incident.view.driver.userId || "—"}
                      {incident.view.driver.phone ? ` · ${incident.view.driver.phone}` : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {incident.view.driver.rating != null ? `★ ${incident.view.driver.rating.toFixed(1)}` : ""}
                      {incident.view.driver.driverId ? ` · ${incident.view.driver.driverId.slice(0, 8)}` : ""}
                    </Typography>
                  </div>
                ) : null}
                {incident.view?.vehicle ? (
                  <div>
                    <Typography variant="caption" color="text.secondary">Vehicle</Typography>
                    <Typography variant="body2">
                      {[incident.view.vehicle.vehicleType, incident.view.vehicle.make, incident.view.vehicle.model]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                      {incident.view.vehicle.plate ? ` · ${incident.view.vehicle.plate}` : ""}
                    </Typography>
                    {incident.view.vehicle.color ? (
                      <Typography variant="caption" color="text.secondary">{incident.view.vehicle.color}</Typography>
                    ) : null}
                  </div>
                ) : null}
                {incident.view?.coordinates?.latitude != null && incident.view?.coordinates?.longitude != null ? (
                  <div>
                    <Typography variant="caption" color="text.secondary">Coordinates</Typography>
                    <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
                      {Number(incident.view.coordinates.latitude).toFixed(6)},{" "}
                      {Number(incident.view.coordinates.longitude).toFixed(6)}
                    </Typography>
                    {incident.view.mapsUrl ? (
                      <Button href={incident.view.mapsUrl} target="_blank" rel="noreferrer" size="small" variant="text">
                        Open in maps
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </Box>
            )}
          </CardContent>
        </Card>

        {!incident.contextSnapshot?.ride && incident.view?.ride ? (
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Typography variant="subtitle2">Linked trip</Typography>
                <Chip label={incident.view.ride.status ?? "—"} color="primary" size="small" sx={{ ml: "auto" }} />
              </Stack>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 2 }}>
                <div>
                  <Typography variant="caption" color="text.secondary">Route</Typography>
                  <Typography variant="body2">
                    {incident.view.ride.pickup || "Pickup"} → {incident.view.ride.destination || "Dropoff"}
                  </Typography>
                </div>
                <div>
                  <Typography variant="caption" color="text.secondary">Trip id</Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: 12 }}>
                    {incident.view.ride.rideId}
                  </Typography>
                </div>
                <div>
                  <Typography variant="caption" color="text.secondary">Fare</Typography>
                  <Typography variant="body2">
                    {incident.view.ride.estimatedFare != null || incident.view.ride.finalFare != null
                      ? `${(incident.view.ride.finalFare ?? incident.view.ride.estimatedFare)?.toLocaleString()} ${incident.view.ride.currency ?? ""}`
                      : "—"}
                  </Typography>
                </div>
                <div>
                  <Typography variant="caption" color="text.secondary">Vehicle</Typography>
                  <Typography variant="body2">
                    {incident.view.vehicle?.plate || incident.view.vehicle?.vehicleType || "—"}
                  </Typography>
                </div>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Button
                  onClick={() => navigate(`/admin/rides/${incident.view!.ride!.rideId}`)}
                  variant="outlined"
                  size="small"
                >
                  Open full ride
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : null}

        {incident.contextSnapshot?.ride ? (() => {
          const ride = incident.contextSnapshot!.ride!;
          const rideMapsLink =
            ride.pickup?.latitude != null && ride.pickup?.longitude != null
              ? mapsLink(ride.pickup.latitude, ride.pickup.longitude)
              : undefined;
          return (
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">Linked ride</Typography>
                  <Chip label={ride.status ?? "—"} color="primary" size="small" sx={{ ml: "auto" }} />
                </Stack>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 2 }}>
                  {ride.rider && (
                    <div>
                      <Typography variant="caption" color="text.secondary">Rider</Typography>
                      <Typography variant="body2">
                        {ride.rider.name || ride.rider.userId || "—"}
                        {ride.rider.phone ? ` · ${ride.rider.phone}` : ""}
                      </Typography>
                    </div>
                  )}
                  {ride.assignedDriver && (
                    <div>
                      <Typography variant="caption" color="text.secondary">Driver</Typography>
                      <Typography variant="body2">
                        {ride.assignedDriver.name || ride.assignedDriver.userId || "—"}
                        {ride.assignedDriver.phone ? ` · ${ride.assignedDriver.phone}` : ""}
                      </Typography>
                    </div>
                  )}
                  {ride.assignedVehicle && (
                    <div>
                      <Typography variant="caption" color="text.secondary">Vehicle</Typography>
                      <Typography variant="body2">
                        {[ride.assignedVehicle.make, ride.assignedVehicle.model].filter(Boolean).join(" ") || "—"}
                        {ride.assignedVehicle.plate ? ` · ${ride.assignedVehicle.plate}` : ""}
                      </Typography>
                    </div>
                  )}
                  <div>
                    <Typography variant="caption" color="text.secondary">Route</Typography>
                    <Typography variant="body2">
                      {ride.pickup?.address || "Pickup"} → {ride.destination?.address || "Dropoff"}
                    </Typography>
                    {(ride.estimatedDistanceKm != null || ride.estimatedDurationMinutes != null) && (
                      <Typography variant="caption" color="text.secondary">
                        {ride.estimatedDistanceKm != null ? `~${ride.estimatedDistanceKm} km` : ""}
                        {ride.estimatedDurationMinutes != null
                          ? ` · ~${ride.estimatedDurationMinutes} min`
                          : ""}
                      </Typography>
                    )}
                  </div>
                  <div>
                    <Typography variant="caption" color="text.secondary">Fare</Typography>
                    <Typography variant="body2">
                      {ride.fare?.estimatedFare != null
                        ? `${ride.fare.estimatedFare.toLocaleString()} ${ride.fare?.currency ?? ""}`
                        : "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Payment {ride.fare?.paymentStatus ?? "—"}
                      {ride.fare?.paymentMethod ? ` · ${ride.fare.paymentMethod}` : ""}
                    </Typography>
                  </div>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <RideRouteMap route={ride.route as Record<string, unknown> | undefined} stops={(ride.stops ?? []).map((stop, index) => ({
                    id: `${ride.rideId}-sos-${index}`,
                    sequence: stop.sequence ?? index + 1,
                    type: stop.type ?? "STOP",
                    address: stop.address ?? "",
                    latitude: stop.latitude ?? 0,
                    longitude: stop.longitude ?? 0,
                    status: stop.status ?? "UNKNOWN",
                  })) as AdminRideStopResponse[]} />
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">Stops</Typography>
                  {(ride.stops ?? []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No stops recorded.</Typography>
                  ) : (ride.stops ?? []).map((stop, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                      <Typography variant="body2" sx={{ minWidth: 56, fontWeight: 700 }}>{stop.type ?? `#${i + 1}`}</Typography>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>{stop.address || "—"}</Typography>
                      {stop.latitude != null && stop.longitude != null && mapsLink(stop.latitude, stop.longitude) && (
                        <Button
                          href={mapsLink(stop.latitude, stop.longitude)!}
                          target="_blank"
                          rel="noreferrer"
                          size="small"
                          variant="text"
                        >
                          Maps
                        </Button>
                      )}
                    </Stack>
                  ))}
                </Box>
                {rideMapsLink && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      href={rideMapsLink}
                      target="_blank"
                      rel="noreferrer"
                      variant="outlined"
                      size="small"
                    >
                      Open pickup in maps
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })() : null}

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
                <Box sx={{ mt: 1, mb: 1 }}>
                  <iframe
                    title="Live emergency location map"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(`${live.latitude},${live.longitude}`)}&z=15&output=embed`}
                    style={{ border: 0, width: "100%", height: 240, borderRadius: 8 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </Box>
                <Typography component="div" variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  Lat {live.latitude.toFixed(6)} · Lng {live.longitude.toFixed(6)}
                </Typography>
                {(live.address || incident.view?.placeName) && (
                  <Typography variant="body2" color="text.secondary">
                    {live.address ?? incident.view?.placeName}
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
