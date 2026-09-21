import React, { useEffect, useMemo, useState } from "react";
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
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  listAdminDrivers,
  listAdminRiders,
  listAdminRiskCases,
  listAdminSafetyEmergencies,
  patchAdminDriver,
  patchAdminRider,
  updateAdminSafetyIncident,
} from "../services/api/adminApi";
import type { AdminDriverResponse, AdminRiskCaseResponse, AdminRiderResponse, AdminSafetyIncident } from "../services/api/adminApi";

const EV_GREEN = "#03cd8c";
const ACTIVE_SAFETY_STATUSES = new Set(["OPEN", "ACKNOWLEDGED", "RESPONDING"]);

type ReviewAccount = {
  id: string;
  name: string;
  type: "Rider" | "Driver";
  contact: string;
  status: string;
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

function mapsLink(incident: AdminSafetyIncident) {
  if (incident.latitude == null || incident.longitude == null) return null;
  return `https://www.google.com/maps?q=${Number(incident.latitude)},${Number(incident.longitude)}`;
}

function incidentCause(incident: AdminSafetyIncident) {
  if (incident.description) return incident.description;
  if (incident.sos) return "SOS was activated by the reporter.";
  return `${titleize(incident.type)} safety incident reported by ${incident.reporterUserId.slice(0, 8)}.`;
}

function riskCause(riskCase: AdminRiskCaseResponse) {
  const evidenceFlags = Array.isArray(riskCase.evidence?.flags) ? riskCase.evidence.flags.join(", ") : "";
  if (evidenceFlags) return evidenceFlags;
  if (riskCase.notes) return riskCase.notes;
  return `${titleize(riskCase.type)} raised for ${titleize(riskCase.subjectType)} ${riskCase.subjectId.slice(0, 8)}.`;
}

export default function SafetyOverviewDashboardPage() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<AdminSafetyIncident[]>([]);
  const [riskCases, setRiskCases] = useState<AdminRiskCaseResponse[]>([]);
  const [reviewAccounts, setReviewAccounts] = useState<ReviewAccount[]>([]);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ severity: "success" | "error"; message: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [incidentPage, cases, riders, drivers] = await Promise.all([
        listAdminSafetyEmergencies({ page: 1, limit: 100 }),
        listAdminRiskCases().catch(() => []),
        listAdminRiders().catch(() => []),
        listAdminDrivers().catch(() => []),
      ]);
      setIncidents(incidentPage?.items ?? []);
      setRiskCases(Array.isArray(cases) ? cases : []);
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
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const activeIncidents = useMemo(() => incidents.filter((incident) => ACTIVE_SAFETY_STATUSES.has(incident.status)), [incidents]);
  const openRiskCases = useMemo(() => riskCases.filter((riskCase) => (riskCase.status ?? "open") !== "resolved"), [riskCases]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && ACTIVE_SAFETY_STATUSES.has(incident.status)) ||
        incident.status === statusFilter;
      const query = search.trim().toLowerCase();
      const haystack = [
        incident.id,
        incident.type,
        incident.status,
        incident.reporterUserId,
        incident.driverId,
        incident.serviceType,
        incident.serviceId,
        incident.address,
        incident.description,
      ].join(" ").toLowerCase();
      return matchesStatus && (query.length === 0 || haystack.includes(query));
    });
  }, [incidents, search, statusFilter]);

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
            Live SOS incidents, review accounts, and risk signals from the database.
          </Typography>
        </Box>
        <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={() => void load()} sx={{ borderRadius: 999, textTransform: "none" }}>
          Refresh
        </Button>
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {notice ? <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice.message}</Alert> : null}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        <MetricCard icon={<ReportProblemIcon />} label="Active incidents" value={activeIncidents.length} helper="Open, acknowledged, responding" tone="error" onClick={() => setStatusFilter("ACTIVE")} active={statusFilter === "ACTIVE"} />
        <MetricCard icon={<LocalPoliceIcon />} label="Open risk cases" value={openRiskCases.length} helper="Risk queue requiring action" tone="warning" onClick={() => navigate("/admin/risk")} />
        <MetricCard icon={<VisibilityIcon />} label="Accounts in review" value={reviewAccounts.length} helper="Riders and drivers not active" tone="primary" />
        <MetricCard icon={<TaskAltIcon />} label="Resolved incidents" value={incidents.filter((incident) => incident.status === "RESOLVED").length} helper="Closed safety records" tone="success" onClick={() => setStatusFilter("RESOLVED")} active={statusFilter === "RESOLVED"} />
      </Box>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.4fr 240px" }, gap: 2 }}>
          <TextField size="small" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search incident, reporter, driver, address" />
          <TextField select size="small" label="Incident status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} SelectProps={{ native: true }}>
            <option value="ACTIVE">Active incidents</option>
            <option value="ALL">All incidents</option>
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESPONDING">Responding</option>
            <option value="RESOLVED">Resolved</option>
          </TextField>
        </Box>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.5fr 1fr" }, gap: 3, mb: 3 }}>
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
          <SectionHeader title="Safety Incident Queue" subtitle={`${filteredIncidents.length} incidents shown`} />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Incident</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Cause / reason</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reported</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredIncidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 7 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>No safety incidents match this view</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIncidents.map((incident) => {
                    const location = mapsLink(incident);
                    return (
                      <TableRow key={incident.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: "monospace" }}>{incident.id.slice(0, 8)}</Typography>
                          <Typography variant="caption" color="text.secondary">{incident.reporterUserId.slice(0, 8)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                            {incident.sos ? <Chip size="small" color="error" label="SOS" /> : null}
                            <Chip size="small" label={titleize(incident.type)} />
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 300 }}>{incidentCause(incident)}</TableCell>
                        <TableCell>{location ? <Button size="small" href={location} target="_blank" rel="noreferrer" sx={{ textTransform: "none" }}>Map</Button> : incident.address || "-"}</TableCell>
                        <TableCell><Chip size="small" color={incident.status === "RESOLVED" ? "success" : incident.status === "OPEN" ? "error" : "warning"} label={titleize(incident.status)} /></TableCell>
                        <TableCell>{formatDate(incident.createdAt)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            {incident.status !== "RESOLVED" ? <Button size="small" onClick={() => void updateIncident(incident, "RESOLVED")} sx={{ textTransform: "none" }}>Resolve</Button> : null}
                            <Button size="small" onClick={() => navigate(`/admin/safety/${incident.id}`)} sx={{ textTransform: "none" }}>Open</Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
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
                ) : (
                  reviewAccounts.slice(0, 12).map((account) => (
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
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <SectionHeader title="Safety-Linked Risk Cases" subtitle={`${openRiskCases.length} unresolved cases`} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Cause / reason</TableCell>
                <TableCell>Resolution means</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {riskCases.slice(0, 12).map((riskCase) => (
                <TableRow key={riskCase.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{riskCase.subjectId.slice(0, 10)}</Typography>
                    <Typography variant="caption" color="text.secondary">{titleize(riskCase.subjectType)}</Typography>
                  </TableCell>
                  <TableCell><Chip size="small" label={titleize(riskCase.type)} /></TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>{riskCause(riskCase)}</TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>{riskCase.status === "resolved" ? "Resolved" : "Review evidence, contact the subject, then resolve or keep under review."}</TableCell>
                  <TableCell><Chip size="small" color={riskCase.severity === "High" ? "error" : riskCase.severity === "Medium" ? "warning" : "success"} label={riskCase.severity} /></TableCell>
                  <TableCell><Chip size="small" color={riskCase.status === "resolved" ? "success" : riskCase.status === "under_review" ? "warning" : "default"} label={titleize(riskCase.status ?? "open")} /></TableCell>
                  <TableCell align="right"><Button size="small" onClick={() => navigate(`/admin/risk/${riskCase.id}`)} sx={{ textTransform: "none" }}>Open</Button></TableCell>
                </TableRow>
              ))}
              {riskCases.length === 0 ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>No risk cases found</TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
  tone,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  helper: string;
  tone: "error" | "warning" | "primary" | "success";
  onClick?: () => void;
  active?: boolean;
}) {
  const color = tone === "error" ? "#ef4444" : tone === "warning" ? "#f59e0b" : tone === "primary" ? "#2563eb" : EV_GREEN;
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
