import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
  Stack,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import QueueIcon from "@mui/icons-material/Queue";
import SmsFailedIcon from "@mui/icons-material/SmsFailed";
import {
  listAdminDrivers,
  listAdminRiders,
  listAdminRiskCases,
  listAdminSafetyEmergencies,
  patchAdminDriver,
  patchAdminRider,
  updateAdminSafetyIncident,
  readAdminBackendAccessToken,
  createAdminSocket,
} from "../services/api/adminApi";
import type { AdminRiskCaseResponse, AdminSafetyIncident } from "../services/api/adminApi";
import AdminTripCommunicationPanel from "../components/AdminTripCommunicationPanel";

function currentAdminUserId(): string | null {
  try {
    const token = readAdminBackendAccessToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

function mapsLink(latitude?: number | null, longitude?: number | null): string | null {
  if (latitude == null || longitude == null) return null;
  return `https://www.google.com/maps?q=${Number(latitude)},${Number(longitude)}`;
}

const OPEN_SOS_STATUSES = ["OPEN", "ACKNOWLEDGED", "RESPONDING"];

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel?.toLowerCase()) {
    case "high":
    case "high risk":
      return "error";
    case "medium":
      return "warning";
    case "low":
      return "success";
    default:
      return "default";
  }
};

const INCIDENT_COLORS = ["#ef4444", "#f97316", "#3b82f6", "#a855f7", "#10b981", "#f59e0b"];

type UserUnderReview = {
  id: string;
  backendId: string;
  name: string;
  type: "Rider" | "Driver";
  city: string;
  reason: string;
  riskLevel: string;
};

export default function SafetyOverviewDashboardPage() {
  const navigate = useNavigate();
  const [usersUnderReview, setUsersUnderReview] = useState<UserUnderReview[]>([]);
  const [riskCases, setRiskCases] = useState<AdminRiskCaseResponse[]>([]);
  const [incidents, setIncidents] = useState<AdminSafetyIncident[]>([]);
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
  const [contactIncidentId, setContactIncidentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [riders, drivers, cases, incidentPage] = await Promise.all([
          listAdminRiders(),
          listAdminDrivers(),
          listAdminRiskCases().catch(() => []),
          listAdminSafetyEmergencies(),
        ]);
        setIncidents(incidentPage?.items ?? []);

        // "Under review" is the real backend account status, not an invented
        // verification label. Only non-active users are listed and the shown
        // reason is the actual status from the backend.
        const underReviewRiders: UserUnderReview[] = riders
          .filter((r) => r.status !== "active")
          .map((r) => ({
            id: r.userId,
            backendId: r.userId,
            name: r.fullName || `${r.firstName || ""} ${r.lastName || ""}`.trim() || r.email || "Rider",
            type: "Rider",
            city: r.city || "Unknown",
            reason: r.status,
            riskLevel: "—",
          }));

        const underReviewDrivers: UserUnderReview[] = drivers
          .filter((d) => d.status !== "active")
          .map((d) => ({
            id: d.driverId,
            backendId: d.driverId,
            name: d.fullName,
            type: "Driver",
            city: d.city || "Unknown",
            reason: d.status,
            riskLevel: "—",
          }));

        setUsersUnderReview([...underReviewRiders, ...underReviewDrivers]);
        setRiskCases(cases);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load safety overview data");
        setUsersUnderReview([]);
        setRiskCases([]);
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
    // Poll so open SOS alerts show up without a manual refresh.
    const poll = window.setInterval(() => {
      listAdminSafetyEmergencies()
        .then((page) => setIncidents(page?.items ?? []))
        .catch(() => undefined);
    }, 30000);
    return () => window.clearInterval(poll);
  }, []);

  // Realtime SOS acceleration: new/updated incidents push a refetch so the red
  // alert appears immediately. Realtime is NOT the source of truth — the same
  // data is re-hydrated from the backend on load and by the 30 s poll, so a
  // reload or reconnect still shows every active incident.
  useEffect(() => {
    let socket: ReturnType<typeof createAdminSocket> | null = null;
    const refetchIncidents = () => {
      listAdminSafetyEmergencies()
        .then((page) => {
          setIncidents(page?.items ?? []);
          setError(null);
        })
        .catch(() => undefined);
    };
    try {
      socket = createAdminSocket();
      socket.on("safety.incident.new", refetchIncidents);
      socket.on("admin.safety.incidents.updated", refetchIncidents);
      socket.connect();
    } catch {
      socket = null;
    }
    return () => {
      if (socket) {
        socket.off("safety.incident.new", refetchIncidents);
        socket.off("admin.safety.incidents.updated", refetchIncidents);
        socket.disconnect();
      }
    };
  }, []);

  const openSosCount = useMemo(() => incidents.filter((i) => i.sos && i.status === "OPEN").length, [incidents]);
  const openCount = useMemo(() => incidents.filter((i) => i.status === "OPEN").length, [incidents]);
  const activeSos = useMemo(
    () => incidents.filter((i) => i.sos && OPEN_SOS_STATUSES.includes(i.status)),
    [incidents],
  );
  const contactIncident = useMemo(
    () => incidents.find((i) => i.id === contactIncidentId) ?? null,
    [contactIncidentId, incidents],
  );

  // Auto-open the communication panel for the first active SOS incident so an
  // operator can reach the driver the moment an alert lands. One panel is
  // mounted at a time (closing it or reselecting restores a single context).
  useEffect(() => {
    if (contactIncidentId) return;
    const firstActive = activeSos[0];
    if (firstActive) {
      setContactIncidentId(firstActive.id);
    }
  }, [activeSos, contactIncidentId]);

  const refreshIncidents = async () => {
    try {
      const page = await listAdminSafetyEmergencies();
      setIncidents(page?.items ?? []);
    } catch {
      // keep current list; polling will retry
    }
  };

  const transitionIncident = async (
    incident: AdminSafetyIncident,
    status: string,
    assignedToUserId?: string,
  ) => {
    try {
      await updateAdminSafetyIncident(incident.id, {
        status,
        ...(assignedToUserId ? { assignedToUserId } : {}),
      });
      await refreshIncidents();
    } catch (error) {
      alert(
        error instanceof Error
          ? `Failed to update incident ${incident.id.slice(0, 8)}: ${error.message}`
          : "Failed to update incident. Please try again.",
      );
    }
  };

  const assignToMe = (incident: AdminSafetyIncident) => {
    const adminUserId = currentAdminUserId();
    if (!adminUserId) {
      alert("Could not determine your admin user id. Please sign in again.");
      return;
    }
    void transitionIncident(incident, incident.status || "OPEN", adminUserId);
  };

  const INCIDENT_KPIS = useMemo(
    () => [
      {
        label: "Total incidents",
        value: incidents.length,
        note: "SOS & safety incidents",
      },
      {
        label: "Open incidents",
        value: openCount,
        note: `${openSosCount} SOS currently open`,
      },
      {
        label: "Users under review",
        value: usersUnderReview.length,
        note: `${usersUnderReview.filter((u) => u.type === "Rider").length} riders · ${usersUnderReview.filter((u) => u.type === "Driver").length} drivers`,
      },
    ],
    [incidents.length, openCount, openSosCount, usersUnderReview]
  );

  const incidentData = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach((incident) => {
      counts[incident.type] = (counts[incident.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count], index) => ({
      type,
      count,
      color: INCIDENT_COLORS[index % INCIDENT_COLORS.length],
    }));
  }, [incidents]);

  const handleUserClick = (user: UserUnderReview) => {
    if (user.type === "Driver") {
      navigate(`/admin/drivers/${user.id}`);
    } else {
      navigate(`/admin/riders/${user.id}`);
    }
  };

  const handleApproveUser = async (user: UserUnderReview, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (user.type === "Rider") {
        await patchAdminRider(user.backendId, { status: "active" });
      } else {
        await patchAdminDriver(user.backendId, { status: "active" });
      }
      setUsersUnderReview((prev) => prev.filter((u) => !(u.id === user.id && u.type === user.type)));
    } catch (error) {
      console.error("Failed to approve user from safety queue.", error);
      alert("Failed to approve user. Please try again.");
    }
  };

  const handleViewQueue = () => {
    navigate("/admin/risk?view=queue");
  };

  const handleSeeMoreIncidents = () => {
    navigate("/admin/risk");
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2 flex-wrap">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Safety Overview
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Incidents, SOS activity and users under review across all regions.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<QueueIcon fontSize="small" />}
          onClick={handleViewQueue}
          sx={{ textTransform: "none", fontSize: 11, borderRadius: 2 }}
        >
          View risk queue
        </Button>
      </Box>

      {activeSos.length > 0 ? (
        <Box className="mb-4 flex flex-col gap-3">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              bgcolor: "#7f1d1d",
              border: "2px solid #dc2626",
              borderRadius: 2,
              px: 2.5,
              py: 1.5,
            }}
          >
            <SmsFailedIcon sx={{ color: "#fecaca", fontSize: 28 }} />
            <Typography variant="subtitle1" className="font-black tracking-wide text-red-100">
              {activeSos.length === 1 ? "1 ACTIVE SOS INCIDENT" : `${activeSos.length} ACTIVE SOS INCIDENTS`} — requires immediate attention
            </Typography>
          </Box>
          {activeSos.map((incident) => {
            const attempts = incident.notifiedContacts ?? [];
            const sent = attempts.filter((a) => a.status === "SENT").length;
            const location = mapsLink(incident.latitude, incident.longitude);
            return (
              <Card
                key={incident.id}
                elevation={6}
                sx={{
                  borderRadius: 2,
                  border: "2px solid #dc2626",
                  bgcolor: "#fef2f2",
                  boxShadow: "0 0 0 3px rgba(220,38,38,0.2)",
                }}
              >
                <CardContent className="p-4 flex flex-col gap-2">
                  <Box className="flex items-center justify-between gap-2 flex-wrap">
                    <Box className="flex items-center gap-2 flex-wrap">
                      <Chip size="small" color="error" label="SOS" sx={{ fontWeight: 800 }} />
                      <Typography variant="subtitle2" className="font-mono font-black text-red-900">
                        {incident.id}
                      </Typography>
                      <Chip
                        size="small"
                        label={incident.status}
                        color={incident.status === "RESOLVED" ? "success" : "error"}
                        sx={{ fontWeight: 700 }}
                      />
                      {incident.assignedToUserId ? (
                        <Chip size="small" label={`Assigned: ${incident.assignedToUserId.slice(0, 8)}`} sx={{ fontWeight: 600 }} />
                      ) : null}
                    </Box>
                    <Box className="flex items-center gap-1 flex-wrap">
                      {incident.status !== "OPEN" ? (
                        <Button size="small" variant="outlined" color="warning" onClick={() => void transitionIncident(incident, "OPEN")} sx={{ fontSize: 10, textTransform: "none" }}>
                          Reopen
                        </Button>
                      ) : null}
                      {incident.status === "OPEN" ? (
                        <Button size="small" variant="contained" color="warning" onClick={() => void transitionIncident(incident, "ACKNOWLEDGED")} sx={{ fontSize: 10, textTransform: "none" }}>
                          Acknowledge
                        </Button>
                      ) : null}
                      {incident.status === "ACKNOWLEDGED" ? (
                        <Button size="small" variant="contained" color="info" onClick={() => void transitionIncident(incident, "RESPONDING")} sx={{ fontSize: 10, textTransform: "none" }}>
                          Responding
                        </Button>
                      ) : null}
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        disabled={!incident.serviceType || !incident.serviceId}
                        onClick={() => setContactIncidentId(incident.id)}
                        sx={{ fontSize: 10, textTransform: "none" }}
                        title={incident.serviceType && incident.serviceId ? "Chat & call the driver and reporter" : "No linked trip to communicate over"}
                      >
                        Chat &amp; call
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => assignToMe(incident)} sx={{ fontSize: 10, textTransform: "none" }}>
                        Assign to me
                      </Button>
                      <Button size="small" variant="contained" color="success" onClick={() => void transitionIncident(incident, "RESOLVED")} sx={{ fontSize: 10, textTransform: "none" }}>
                        Resolve
                      </Button>
                    </Box>
                  </Box>
                  <Box className="grid gap-1 text-[12px] text-red-950/80">
                    <Typography variant="body2" className="text-[12px]">
                      <b>Reporter:</b> {incident.reporterUserId}
                      {incident.driverId ? ` · Driver: ${incident.driverId}` : ""}
                      {incident.serviceType ? ` · Service: ${incident.serviceType}${incident.serviceId ? ` (${incident.serviceId})` : ""}` : ""}
                    </Typography>
                    <Typography variant="body2" className="text-[12px]">
                      <b>Reported:</b> {incident.createdAt ? new Date(incident.createdAt).toLocaleString() : "-"}
                      {incident.address ? ` · ${incident.address}` : ""}
                    </Typography>
                    <Typography variant="body2" className="text-[12px]">
                      <b>Location:</b>{" "}
                      {incident.latitude != null && incident.longitude != null
                        ? `${Number(incident.latitude).toFixed(5)}, ${Number(incident.longitude).toFixed(5)}`
                        : "Not shared"}
                      {location ? (
                        <a href={location} target="_blank" rel="noreferrer" className="ml-2 font-black text-red-700 underline">
                          Open in Maps
                        </a>
                      ) : null}
                    </Typography>
                    {incident.description ? (
                      <Typography variant="body2" className="text-[12px]">
                        <b>Description:</b> {incident.description}
                      </Typography>
                    ) : null}
                    <Typography variant="body2" className="text-[12px]">
                      <b>Contact delivery:</b>{" "}
                      {attempts.length === 0
                        ? "No contact notification attempts recorded"
                        : `${sent}/${attempts.length} delivered by SMS · ${attempts
                            .filter((a) => a.status !== "SENT")
                            .map((a) => `${a.name || "contact"} (${a.providerResult?.error || a.status || "FAILED"})`)
                            .join(" · ")}`}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      ) : null}

      {contactIncident ? (
        <Card
          elevation={3}
          sx={{
            mb: 3,
            borderRadius: 2,
            border: "1px solid rgba(37,99,235,0.4)",
            bgcolor: "background.paper",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Box className="flex items-center justify-between gap-2 flex-wrap">
              <Box className="flex items-center gap-2 flex-wrap">
                <Chip
                  size="small"
                  color="primary"
                  label="CONTACT"
                  sx={{ fontWeight: 800, fontSize: 10, height: 20 }}
                />
                <Typography variant="subtitle2" className="font-mono font-bold text-slate-800">
                  {contactIncident.id}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {contactIncident.serviceType || "RIDE"}
                  {contactIncident.serviceId ? ` · ${contactIncident.serviceId}` : ""}
                  {contactIncident.driverId ? ` · driver ${contactIncident.driverId.slice(0, 8)}` : ""}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="text"
                onClick={() => setContactIncidentId(null)}
                sx={{ fontSize: 10, textTransform: "none" }}
              >
                Close
              </Button>
            </Box>
            <AdminTripCommunicationPanel
              key={contactIncident.id}
              serviceType={contactIncident.serviceType ?? "RIDE"}
              serviceId={contactIncident.serviceId}
              driverId={contactIncident.driverId}
              reporterUserId={contactIncident.reporterUserId}
            />
          </CardContent>
        </Card>
      ) : null}

      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {INCIDENT_KPIS.map((kpi) => (
          <Card
            key={kpi.label}
            elevation={2}
            onClick={() => navigate("/admin/risk")}
            sx={{
              borderRadius: 2,
              border: "1px solid rgba(148,163,184,0.3)",
              bgcolor: "background.paper",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: 4,
                borderColor: "primary.main",
              },
            }}
          >
            <CardContent className="p-3 flex flex-col gap-1">
              <Typography variant="caption" className="text-[11px] uppercase tracking-wide text-slate-500">
                {kpi.label}
              </Typography>
              <Typography variant="h6" className="font-semibold text-lg" color="text.primary">
                {kpi.value}
              </Typography>
              <Typography variant="caption" className="text-[11px] text-amber-700">
                {kpi.note}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box className="flex flex-col lg:flex-row gap-4 mb-4">
        <Card
          elevation={2}
          sx={{
            flex: 2,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "linear-gradient(145deg, #0b1120, #020617)",
            color: "#e5e7eb",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2 h-[350px]">
            <Box className="flex items-center justify-between">
              <Typography variant="subtitle2" className="font-semibold text-slate-50">
                Incident Distribution
              </Typography>
              <Button
                variant="text"
                size="small"
                sx={{ textTransform: "none", fontSize: 11, color: "#93c5fd" }}
                onClick={handleSeeMoreIncidents}
              >
                See full incidents
              </Button>
            </Box>
            {incidentData.length === 0 ? (
              <Box className="flex-1 flex items-center justify-center">
                <Typography variant="body2" color="text.secondary">
                  No incident data available
                </Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incidentData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                  <XAxis type="number" fontSize={11} stroke="#94a3b8" />
                  <YAxis dataKey="type" type="category" fontSize={11} stroke="#94a3b8" width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    labelStyle={{ color: "#e5e7eb" }}
                  />
                  <Bar dataKey="count" name="Incidents" radius={[0, 4, 4, 0]}>
                    {incidentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography variant="subtitle2" className="font-semibold" color="text.primary">
              Safety playbook
            </Typography>
            <Divider className="!my-1" />
            <Typography variant="body2" className="text-[12px] text-slate-500">
              • Critical incidents must be acknowledged within 5 minutes and fully handled within 24 hours.
            </Typography>
            <Typography variant="body2" className="text-[12px] text-slate-500">
              • Drivers flagged by the system (high cancellations, repeated complaints) should be routed through
              retraining before reactivation.
            </Typography>
            <Typography variant="body2" className="text-[12px] text-slate-500">
              • Riders exhibiting abuse or fraud patterns should be escalated to risk for review and possible ban.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card
        elevation={2}
        sx={{
          borderRadius: 2,
          border: "1px solid rgba(148,163,184,0.3)",
          bgcolor: "background.paper",
        }}
      >
        <CardContent className="p-4 flex flex-col gap-2">
          <Box className="flex items-center justify-between">
            <Typography variant="subtitle2" className="font-semibold" color="text.primary">
              SOS &amp; emergency incidents ({incidents.length})
            </Typography>
            <Chip
              size="small"
              color={openSosCount > 0 ? "error" : "default"}
              label={`${incidents.filter((i) => i.sos).length} SOS · ${openCount} open`}
            />
          </Box>
          <Divider className="!my-1" />
          {incidents.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No incidents reported
              </Typography>
              <Typography variant="caption" color="text.disabled">
                New SOS alerts appear here within seconds of being triggered
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 380 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Contacts</TableCell>
                    <TableCell>Reported</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incidents.map((incident) => {
                    const attempts = incident.notifiedContacts ?? [];
                    const sent = attempts.filter((a) => a.status === "SENT").length;
                    const expanded = expandedIncident === incident.id;
                    return (
                      <React.Fragment key={incident.id}>
                        <TableRow
                          hover
                          onClick={() => setExpandedIncident(expanded ? null : incident.id)}
                          sx={{ cursor: "pointer" }}
                        >
                          <TableCell sx={{ fontSize: 11 }}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              {incident.sos ? <Chip size="small" color="error" label="SOS" /> : null}
                              <Typography variant="caption" className="ml-1 font-mono">
                                {incident.id.slice(0, 8)}
                              </Typography>
                              <Button
                                size="small"
                                variant="text"
                                sx={{ fontSize: 10, textTransform: "none", minWidth: 0, p: 0.25 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/admin/safety/${incident.id}`);
                                }}
                              >
                                View
                              </Button>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ fontSize: 11 }}>{incident.type}</TableCell>
                          <TableCell sx={{ fontSize: 11 }}>
                            <Chip size="small" color={incident.status === "OPEN" ? "error" : incident.status === "RESOLVED" ? "success" : "default"} label={incident.status} />
                          </TableCell>
                          <TableCell sx={{ fontSize: 11 }}>
                            {incident.address ||
                              (incident.latitude != null && incident.longitude != null
                                ? `${Number(incident.latitude).toFixed(5)}, ${Number(incident.longitude).toFixed(5)}`
                                : "Location not shared")}
                          </TableCell>
                          <TableCell sx={{ fontSize: 11 }}>
                            {attempts.length === 0
                              ? "—"
                              : `${sent}/${attempts.length} SMS delivered`}
                          </TableCell>
                          <TableCell sx={{ fontSize: 11 }}>
                            {incident.createdAt ? new Date(incident.createdAt).toLocaleString() : "-"}
                          </TableCell>
                        </TableRow>
                        {expanded ? (
                          <TableRow>
                            <TableCell colSpan={6} sx={{ bgcolor: "rgba(148,163,184,0.06)", py: 1.5 }}>
                              <Box className="grid gap-1 text-[12px]">
                                {incident.description ? (
                                  <Typography variant="body2" className="text-[12px] text-slate-600">
                                    <b>Description:</b> {incident.description}
                                  </Typography>
                                ) : null}
                                <Typography variant="body2" className="text-[12px] text-slate-600">
                                  <b>Reporter:</b> {incident.reporterUserId}
                                  {incident.serviceType
                                    ? ` · Service: ${incident.serviceType}${incident.serviceId ? ` (${incident.serviceId})` : ""}`
                                    : ""}
                                </Typography>
                                <Box className="mt-1">
                                  <Typography variant="caption" className="text-[11px] font-semibold text-slate-500">
                                    Contact notification attempts
                                  </Typography>
                                  {attempts.length === 0 ? (
                                    <Typography variant="body2" className="text-[12px] text-slate-500">
                                      No contact notification attempts recorded.
                                    </Typography>
                                  ) : (
                                    <Box className="mt-1 flex flex-col gap-1">
                                      {attempts.map((attempt, index) => (
                                        <Box
                                          key={`${attempt.phone}-${index}`}
                                          className="flex items-center gap-2 rounded-md bg-white px-2 py-1 border border-slate-200"
                                        >
                                          <Chip
                                            size="small"
                                            color={attempt.status === "SENT" ? "success" : "error"}
                                            label={attempt.status === "SENT" ? "SENT" : "FAILED"}
                                            sx={{ fontSize: 9, height: 18, fontWeight: 600 }}
                                          />
                                          <span className="font-medium text-slate-700">
                                            {attempt.name || "Contact"} · {attempt.phone || "no number"}
                                          </span>
                                          <span className="text-[10px] text-slate-400">
                                            {attempt.source ?? "USER"} · {attempt.provider ?? "NONE"}
                                            {attempt.providerResult?.error ? ` · ${attempt.providerResult.error}` : ""}
                                            {attempt.attemptedAt
                                              ? ` · ${new Date(attempt.attemptedAt).toLocaleString()}`
                                              : ""}
                                          </span>
                                        </Box>
                                      ))}
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Box className="flex flex-col lg:flex-row gap-4">
        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Box className="flex items-center justify-between">
              <Typography variant="subtitle2" className="font-semibold" color="text.primary">
                Users under review ({usersUnderReview.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<QueueIcon fontSize="small" />}
                onClick={handleViewQueue}
                sx={{ textTransform: "none", fontSize: 11, borderRadius: 2 }}
              >
                View queue
              </Button>
            </Box>
            <Divider className="!my-1" />
            {usersUnderReview.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No users under review
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  All users have been approved
                </Typography>
              </Box>
            ) : (
              <Box className="flex flex-col gap-2 text-[12px]" sx={{ maxHeight: 300, overflowY: "auto" }}>
                {usersUnderReview.map((u) => (
                  <Box
                    key={`${u.type}-${u.id}`}
                    className="flex flex-col rounded-md px-2 py-2 hover:bg-black/5 cursor-pointer"
                    onClick={() => handleUserClick(u)}
                  >
                    <Box className="flex items-center justify-between">
                      <Box className="flex items-center gap-2">
                        <span className="font-medium">{u.name}</span>
                        <Chip
                          size="small"
                          label={u.riskLevel}
                          color={getRiskColor(u.riskLevel)}
                          sx={{ fontSize: 9, height: 18, fontWeight: 600 }}
                        />
                      </Box>
                      <Box className="flex items-center gap-1">
                        <Chip size="small" label={u.type} sx={{ fontSize: 10, height: 20 }} />
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={(e) => handleApproveUser(u, e)}
                          sx={{ fontSize: 9, minWidth: "auto", px: 1, py: 0.25, height: 20, textTransform: "none" }}
                        >
                          Approve
                        </Button>
                      </Box>
                    </Box>
                    <span style={{ color: "var(--ev-text-secondary, #64748b)" }} className="text-[11px]">
                      {u.city} · {u.reason}
                    </span>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography variant="subtitle2" className="font-semibold" color="text.primary">
              Recent risk cases
            </Typography>
            <Divider className="!my-1" />
            {riskCases.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No risk cases
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ bgcolor: "transparent" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {riskCases.slice(0, 8).map((c) => (
                      <TableRow
                        key={c.id}
                        hover
                        onClick={() => navigate(`/admin/risk/${c.id}`)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>{c.type}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={c.severity}
                            color={getRiskColor(c.severity)}
                            sx={{ fontSize: 9, height: 18 }}
                          />
                        </TableCell>
                        <TableCell>{c.status ?? "open"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
