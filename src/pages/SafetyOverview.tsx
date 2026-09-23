import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import ShieldIcon from "@mui/icons-material/Shield";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PeriodSelector from "../components/PeriodSelector";
import type { PeriodOption } from "../components/PeriodSelector";
import {
  createAdminSocket,
  listAdminDrivers,
  listAdminRiders,
  listAdminRiskCases,
  listAdminSafetyEmergencies,
  patchAdminDriver,
  patchAdminRider,
  updateAdminSafetyIncident,
} from "../services/api/adminApi";
import type { AdminDriverResponse, AdminRiskCaseResponse, AdminRiderResponse, AdminSafetyIncident } from "../services/api/adminApi";
import { attachAdminRealtimeSocket } from "../services/adminRealtime";

const EV_GREEN = "#03cd8c";
const ACTIVE_SAFETY_STATUSES = new Set(["OPEN", "ACKNOWLEDGED", "RESPONDING"]);
const CATEGORY_COLORS = {
  SOS: "#ef4444",
  TRIP_ANOMALY: "#f97316",
  SAFETY: "#2563eb",
  RISK: "#8b5cf6",
  RESOLVED: "#10b981",
};

type CategoryFilter = "ALL" | "SOS" | "TRIP_ANOMALY" | "SAFETY" | "RISK";

type ReviewAccount = {
  id: string;
  name: string;
  type: "Rider" | "Driver";
  contact: string;
  status: string;
};

type SafetyRow = {
  id: string;
  category: Exclude<CategoryFilter, "ALL">;
  title: string;
  subject: string;
  cause: string;
  status: string;
  severity?: string;
  location: string;
  reportedAt: string | number | null | undefined;
  resolutionMeans: string;
  details: string[];
  openPath: string;
  source: "incident" | "risk";
  incident?: AdminSafetyIncident;
};

function fullRiderName(rider: AdminRiderResponse) {
  return rider.fullName || `${rider.firstName ?? ""} ${rider.lastName ?? ""}`.trim() || rider.email || rider.phone || "Rider";
}

function formatDate(value?: string | number | null) {
  if (value == null) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function titleize(value?: string | null) {
  if (!value) return "-";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function periodRange(period: PeriodOption, customRange: [Dayjs | null, Dayjs | null]) {
  const now = dayjs();
  if (period === "today") return { start: now.startOf("day").toISOString(), end: now.endOf("day").toISOString() };
  if (period === "7days") return { start: now.subtract(7, "day").startOf("day").toISOString(), end: now.endOf("day").toISOString() };
  if (period === "thisMonth") return { start: now.startOf("month").toISOString(), end: now.endOf("month").toISOString() };
  if (period === "thisYear") return { start: now.startOf("year").toISOString(), end: now.endOf("year").toISOString() };
  const [start, end] = customRange;
  if (start && end) return { start: start.startOf("day").toISOString(), end: end.endOf("day").toISOString() };
  return { start: now.subtract(7, "day").startOf("day").toISOString(), end: now.endOf("day").toISOString() };
}

function mapsLink(incident: AdminSafetyIncident) {
  if (incident.view?.mapsUrl) return incident.view.mapsUrl;
  const latitude = incident.view?.coordinates?.latitude ?? incident.latitude;
  const longitude = incident.view?.coordinates?.longitude ?? incident.longitude;
  if (latitude == null || longitude == null) return null;
  return `https://www.google.com/maps?q=${Number(latitude)},${Number(longitude)}`;
}

function incidentCause(incident: AdminSafetyIncident) {
  if (incident.description) return incident.description;
  if (incident.sos) return "SOS was activated and emergency contacts/support were notified where available.";
  return `${titleize(incident.type)} safety incident reported by ${incident.reporterUserId.slice(0, 8)}.`;
}

function riskCause(riskCase: AdminRiskCaseResponse) {
  const flags = Array.isArray(riskCase.evidence?.flags) ? riskCase.evidence.flags.join(", ") : "";
  if (flags) return flags;
  if (riskCase.notes) return riskCase.notes;
  return `${titleize(riskCase.type)} raised for ${titleize(riskCase.subjectType)} ${riskCase.subjectId.slice(0, 8)}.`;
}

function isTripAnomaly(riskCase: AdminRiskCaseResponse) {
  const haystack = [riskCase.type, riskCase.notes, JSON.stringify(riskCase.evidence ?? {})].join(" ").toLowerCase();
  return haystack.includes("trip") || haystack.includes("ride") || haystack.includes("distance") || haystack.includes("duration");
}

function incidentToRow(incident: AdminSafetyIncident): SafetyRow {
  const reporter = incident.view?.reporter?.name || incident.contextSnapshot?.reporter?.name || incident.reporterUserId.slice(0, 8);
  const reporterPhone = incident.view?.reporter?.phone || incident.contextSnapshot?.reporter?.phone;
  const driver = incident.view?.driver?.name || incident.contextSnapshot?.ride?.assignedDriver?.name;
  const rider = incident.view?.rider?.name || incident.contextSnapshot?.ride?.rider?.name;
  const vehicle = incident.view?.vehicle?.plate || incident.contextSnapshot?.ride?.assignedVehicle?.plate;
  const pickup = incident.view?.ride?.pickup || incident.contextSnapshot?.ride?.pickup?.address;
  const destination = incident.view?.ride?.destination || incident.contextSnapshot?.ride?.destination?.address;
  const contacts = incident.notifiedContacts?.length ?? 0;
  const mapUrl = mapsLink(incident);
  return {
    id: incident.id,
    category: incident.sos ? "SOS" : "SAFETY",
    title: incident.sos ? "SOS incident" : titleize(incident.type),
    subject: reporter,
    cause: incidentCause(incident),
    status: incident.status,
    location: mapUrl || incident.view?.placeName || incident.address || "No location captured",
    reportedAt: incident.createdAt,
    resolutionMeans: incident.status === "RESOLVED" ? "Resolved" : "Open the SOS detail, verify contacts, coordinate help, then resolve once the reporter is safe.",
    details: [
      reporterPhone ? `Reporter ${reporterPhone}` : "",
      rider ? `Rider ${rider}` : "",
      driver ? `Driver ${driver}` : "",
      vehicle ? `Vehicle ${vehicle}` : "",
      pickup || destination ? `Route ${pickup || "-"} -> ${destination || "-"}` : "",
      contacts ? `${contacts} notified contact${contacts === 1 ? "" : "s"}` : "No notified contacts recorded",
    ].filter(Boolean),
    openPath: `/admin/safety/${incident.id}`,
    source: "incident",
    incident,
  };
}

function riskToRow(riskCase: AdminRiskCaseResponse): SafetyRow {
  const tripAnomaly = isTripAnomaly(riskCase);
  return {
    id: riskCase.id,
    category: tripAnomaly ? "TRIP_ANOMALY" : "RISK",
    title: tripAnomaly ? "Trip anomaly" : titleize(riskCase.type),
    subject: `${titleize(riskCase.subjectType)} ${riskCase.subjectId.slice(0, 8)}`,
    cause: riskCause(riskCase),
    status: riskCase.status ?? "open",
    severity: riskCase.severity,
    location: "Derived from trip/risk evidence",
    reportedAt: riskCase.createdAt,
    resolutionMeans: riskCase.status === "resolved" ? "Resolved" : "Review evidence, contact the subject, document the reason, then resolve or keep under review.",
    details: [riskCase.notes || "Database risk signal", `Subject ${riskCase.subjectId.slice(0, 8)}`],
    openPath: `/admin/risk/${riskCase.id}`,
    source: "risk",
  };
}

function inRange(value: string | number, range: { start: string; end: string }) {
  const timestamp = new Date(value).getTime();
  return !Number.isNaN(timestamp) && timestamp >= new Date(range.start).getTime() && timestamp <= new Date(range.end).getTime();
}

export default function SafetyOverviewDashboardPage() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<AdminSafetyIncident[]>([]);
  const [riskCases, setRiskCases] = useState<AdminRiskCaseResponse[]>([]);
  const [reviewAccounts, setReviewAccounts] = useState<ReviewAccount[]>([]);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [period, setPeriod] = useState<PeriodOption>("today");
  const [customRange, setCustomRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ severity: "success" | "error"; message: string } | null>(null);

  const selectedRange = useMemo(() => periodRange(period, customRange), [period, customRange]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [incidentPage, sosPage, cases, riders, drivers] = await Promise.all([
        listAdminSafetyEmergencies({ page: 1, limit: 100, fromDate: selectedRange.start, toDate: selectedRange.end }),
        listAdminSafetyEmergencies({ page: 1, limit: 100, sos: true }),
        listAdminRiskCases().catch(() => []),
        listAdminRiders().catch(() => []),
        listAdminDrivers().catch(() => []),
      ]);
      const mergedIncidents = new Map<string, AdminSafetyIncident>();
      for (const incident of incidentPage?.items ?? []) mergedIncidents.set(incident.id, incident);
      for (const incident of sosPage?.items ?? []) mergedIncidents.set(incident.id, incident);
      setIncidents([...mergedIncidents.values()]);
      setRiskCases((Array.isArray(cases) ? cases : []).filter((riskCase) => inRange(riskCase.createdAt, selectedRange)));
      const riderReview: ReviewAccount[] = (Array.isArray(riders) ? riders : [])
        .filter((rider: AdminRiderResponse) => rider.status !== "active")
        .map((rider: AdminRiderResponse) => ({
          id: rider.userId,
          name: fullRiderName(rider),
          type: "Rider",
          contact: rider.phone || rider.email || "-",
          status: rider.status,
        }));
      const driverReview: ReviewAccount[] = (Array.isArray(drivers) ? drivers : [])
        .filter((driver: AdminDriverResponse) => driver.status !== "active")
        .map((driver: AdminDriverResponse) => ({
          id: driver.driverId,
          name: driver.fullName || driver.phone || "Driver",
          type: "Driver",
          contact: driver.phone || driver.email || "-",
          status: driver.status,
        }));
      setReviewAccounts([...riderReview, ...driverReview]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load safety data");
      setIncidents([]);
      setRiskCases([]);
      setReviewAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRange]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const refresh = () => {
      void load();
    };
    const detach = attachAdminRealtimeSocket(createAdminSocket(), {
      rooms: ["operations"],
      events: {
        "safety.incident.new": refresh,
        "safety.incident.updated": refresh,
        "sos.session.update": refresh,
        "safety.emergency.message.new": refresh,
      },
    });
    return () => {
      detach();
    };
  }, [load]);

  const rows = useMemo(() => [...incidents.map(incidentToRow), ...riskCases.map(riskToRow)], [incidents, riskCases]);
  const sosRows = useMemo(() => rows.filter((row) => row.category === "SOS"), [rows]);
  const activeIncidents = useMemo(() => incidents.filter((incident) => ACTIVE_SAFETY_STATUSES.has(incident.status)), [incidents]);
  const openRiskCases = useMemo(() => riskCases.filter((riskCase) => (riskCase.status ?? "open") !== "resolved"), [riskCases]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesCategory = categoryFilter === "ALL" || row.category === categoryFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && row.source === "incident" && ACTIVE_SAFETY_STATUSES.has(row.status)) ||
        row.status?.toUpperCase() === statusFilter ||
        (statusFilter === "ACTIVE" && row.source === "risk" && row.status !== "resolved");
      const haystack = [row.id, row.category, row.title, row.subject, row.cause, row.status, row.details.join(" ")].join(" ").toLowerCase();
      return matchesCategory && matchesStatus && (query.length === 0 || haystack.includes(query));
    });
  }, [categoryFilter, rows, search, statusFilter]);

  const approveAccount = async (account: ReviewAccount) => {
    setNotice(null);
    try {
      if (account.type === "Rider") await patchAdminRider(account.id, { status: "active" });
      else await patchAdminDriver(account.id, { status: "active" });
      setReviewAccounts((prev) => prev.filter((item) => !(item.id === account.id && item.type === account.type)));
      setNotice({ severity: "success", message: `${account.name} marked active.` });
    } catch (err) {
      setNotice({ severity: "error", message: err instanceof Error ? err.message : "Failed to update account" });
    }
  };

  const updateIncident = async (incident: AdminSafetyIncident, status: string) => {
    setNotice(null);
    try {
      await updateAdminSafetyIncident(incident.id, { status });
      await load();
      setNotice({ severity: "success", message: `Incident ${incident.id.slice(0, 8)} updated.` });
    } catch (err) {
      setNotice({ severity: "error", message: err instanceof Error ? err.message : "Failed to update incident" });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <HealthAndSafetyIcon sx={{ color: EV_GREEN }} />
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0 }}>Safety Overview</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            SOS incidents, trip anomalies, and safety risk signals loaded from the database.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
          <PeriodSelector
            value={period}
            onChange={(newPeriod, range) => {
              setPeriod(newPeriod);
              if (range) setCustomRange([range.start, range.end]);
            }}
            customStart={customRange[0]}
            customEnd={customRange[1]}
          />
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={() => void load()} sx={{ borderRadius: 999, textTransform: "none" }}>
            Refresh
          </Button>
        </Stack>
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {notice ? <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice.message}</Alert> : null}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(5, 1fr)" }, gap: 2, mb: 3 }}>
        <MetricCard icon={<ReportProblemIcon />} label="SOS incidents" value={sosRows.length} helper="Emergency activations" color={CATEGORY_COLORS.SOS} onClick={() => setCategoryFilter("SOS")} active={categoryFilter === "SOS"} />
        <MetricCard icon={<ShieldIcon />} label="Trip anomalies" value={rows.filter((row) => row.category === "TRIP_ANOMALY").length} helper="Distance, duration, route risk" color={CATEGORY_COLORS.TRIP_ANOMALY} onClick={() => setCategoryFilter("TRIP_ANOMALY")} active={categoryFilter === "TRIP_ANOMALY"} />
        <MetricCard icon={<HealthAndSafetyIcon />} label="Safety incidents" value={activeIncidents.length} helper="Open, acknowledged, responding" color={CATEGORY_COLORS.SAFETY} onClick={() => { setCategoryFilter("SAFETY"); setStatusFilter("ACTIVE"); }} active={categoryFilter === "SAFETY" && statusFilter === "ACTIVE"} />
        <MetricCard icon={<LocalPoliceIcon />} label="Open risk cases" value={openRiskCases.length} helper="Risk queue requiring action" color={CATEGORY_COLORS.RISK} onClick={() => setCategoryFilter("RISK")} active={categoryFilter === "RISK"} />
        <MetricCard icon={<TaskAltIcon />} label="Resolved" value={incidents.filter((incident) => incident.status === "RESOLVED").length} helper="Closed safety records" color={CATEGORY_COLORS.RESOLVED} onClick={() => setStatusFilter("RESOLVED")} active={statusFilter === "RESOLVED"} />
      </Box>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.4fr 220px 220px" }, gap: 2 }}>
          <TextField size="small" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search SOS, reporter, driver, cause, route" />
          <TextField select size="small" label="Category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)} SelectProps={{ native: true }}>
            <option value="ALL">All categories</option>
            <option value="SOS">SOS</option>
            <option value="TRIP_ANOMALY">Trip anomalies</option>
            <option value="SAFETY">Safety incidents</option>
            <option value="RISK">Other risk cases</option>
          </TextField>
          <TextField select size="small" label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} SelectProps={{ native: true }}>
            <option value="ACTIVE">Active / unresolved</option>
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESPONDING">Responding</option>
            <option value="RESOLVED">Resolved</option>
          </TextField>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", mb: 3 }}>
        <SectionHeader title="SOS Incidents" subtitle={`${sosRows.length} SOS records from the backend`} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>SOS</TableCell>
                <TableCell>Reporter / parties</TableCell>
                <TableCell>Route and location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reported</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sosRows.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>No SOS incidents in this period.</TableCell></TableRow>
              ) : sosRows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: "monospace" }}>{row.id.slice(0, 8)}</Typography>
                    <Chip size="small" color="error" label="SOS" sx={{ mt: 0.5 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.subject}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.details.join(" | ")}</Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 360 }}>{renderLocation(row)}</TableCell>
                  <TableCell><StatusChip status={row.status} /></TableCell>
                  <TableCell>{formatDate(row.reportedAt)}</TableCell>
                  <TableCell align="right"><Button size="small" onClick={() => navigate(row.openPath)} sx={{ textTransform: "none" }}>Open full details</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.5fr 1fr" }, gap: 3, mb: 3 }}>
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
          <SectionHeader title="Classified Incident Queue" subtitle={`${filteredRows.length} safety records shown`} />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Record</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Cause / reason</TableCell>
                  <TableCell>Resolution means</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reported</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 7 }}><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>No safety records match this view</Typography></TableCell></TableRow>
                ) : filteredRows.map((row) => (
                  <TableRow key={`${row.source}-${row.id}`} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{row.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.subject}</Typography>
                    </TableCell>
                    <TableCell><CategoryChip category={row.category} /></TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>{row.cause}</TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>{row.resolutionMeans}</TableCell>
                    <TableCell><StatusChip status={row.status} severity={row.severity} /></TableCell>
                    <TableCell>{formatDate(row.reportedAt)}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {row.incident && row.incident.status !== "RESOLVED" ? <Button size="small" onClick={() => void updateIncident(row.incident!, "RESOLVED")} sx={{ textTransform: "none" }}>Resolve</Button> : null}
                        <Button size="small" onClick={() => navigate(row.openPath)} sx={{ textTransform: "none" }}>Open</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
          <SectionHeader title="Accounts Needing Review" subtitle={`${reviewAccounts.length} backend accounts`} />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Account</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reviewAccounts.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6 }}>No accounts currently need review</TableCell></TableRow>
                ) : reviewAccounts.slice(0, 12).map((account) => (
                  <TableRow key={`${account.type}-${account.id}`} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{account.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{account.contact}</Typography>
                    </TableCell>
                    <TableCell>{account.type}</TableCell>
                    <TableCell><Chip size="small" label={titleize(account.status)} /></TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Button size="small" onClick={() => navigate(account.type === "Rider" ? `/admin/riders/${account.id}` : `/admin/drivers/${account.id}`)} sx={{ textTransform: "none" }}>Open</Button>
                        <Button size="small" variant="outlined" onClick={() => void approveAccount(account)} sx={{ textTransform: "none" }}>Activate</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
}

function renderLocation(row: SafetyRow) {
  if (row.source === "incident" && row.incident) {
    const url = mapsLink(row.incident);
    if (url) return <Button size="small" href={url} target="_blank" rel="noreferrer" sx={{ textTransform: "none" }}>Open map</Button>;
  }
  return <Typography variant="body2">{row.location}</Typography>;
}

function CategoryChip({ category }: { category: Exclude<CategoryFilter, "ALL"> }) {
  const label = category === "SOS" ? "SOS" : category === "TRIP_ANOMALY" ? "Trip anomaly" : category === "SAFETY" ? "Safety incident" : "Risk case";
  const color = CATEGORY_COLORS[category];
  return <Chip size="small" label={label} sx={{ bgcolor: `${color}18`, color, fontWeight: 700 }} />;
}

function StatusChip({ status, severity }: { status: string; severity?: string }) {
  const normalized = status?.toLowerCase();
  const color = normalized === "resolved" ? "success" : normalized === "open" ? "error" : normalized === "responding" || normalized === "under_review" ? "warning" : "default";
  const label = severity ? `${severity} | ${titleize(status)}` : titleize(status);
  return <Chip size="small" color={color} label={label} />;
}

function MetricCard({
  icon,
  label,
  value,
  helper,
  color,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  helper: string;
  color: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 2,
        cursor: onClick ? "pointer" : "default",
        borderColor: active ? color : "divider",
        bgcolor: active ? `${color}12` : "background.paper",
        "&:hover": onClick ? { borderColor: color, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)" } : undefined,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 1.5, bgcolor: `${color}18`, color }}>{icon}</Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: "uppercase" }}>{label}</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>{value.toLocaleString()}</Typography>
          <Typography variant="caption" color="text.secondary">{helper}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{title}</Typography>
        <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
      </Box>
      <Divider />
    </>
  );
}
