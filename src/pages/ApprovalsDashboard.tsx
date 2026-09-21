import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
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
import type { SelectChangeEvent } from "@mui/material/Select";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import BlockIcon from "@mui/icons-material/Block";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import dayjs, { type Dayjs } from "dayjs";
import PeriodSelector from "../components/PeriodSelector";
import type { PeriodOption } from "../components/PeriodSelector";
import { listAdminApprovals, reviewAdminApproval } from "../services/api/adminApi";
import type { AdminApprovalResponse } from "../services/api/adminApi";

const EV_GREEN = "#03cd8c";
type StatusFilter = "all" | AdminApprovalResponse["status"];

function titleize(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusColor(status: AdminApprovalResponse["status"]) {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  return "warning";
}

function isInPeriod(timestamp: number, period: PeriodOption, customRange: [Dayjs | null, Dayjs | null]) {
  const value = dayjs(timestamp);
  const now = dayjs();
  if (period === "today") return value.isSame(now, "day");
  if (period === "7days") return value.isAfter(now.subtract(7, "day"));
  if (period === "thisMonth") return value.isSame(now, "month");
  if (period === "thisYear") return value.isSame(now, "year");
  if (period === "custom" && customRange[0] && customRange[1]) {
    return (value.isAfter(customRange[0], "day") || value.isSame(customRange[0], "day")) &&
      (value.isBefore(customRange[1], "day") || value.isSame(customRange[1], "day"));
  }
  return true;
}

export default function ApprovalsDashboardPage() {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState<AdminApprovalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<PeriodOption>("thisMonth");
  const [customRange, setCustomRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({ open: false, msg: "", severity: "success" });

  const fetchApprovals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminApprovals();
      setApprovals(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load approvals");
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchApprovals();
  }, []);

  const entityTypes = useMemo(() => Array.from(new Set(approvals.map((approval) => approval.entityType).filter(Boolean))).sort(), [approvals]);
  const counts = useMemo(() => ({
    all: approvals.length,
    pending: approvals.filter((approval) => approval.status === "pending").length,
    approved: approvals.filter((approval) => approval.status === "approved").length,
    rejected: approvals.filter((approval) => approval.status === "rejected").length,
  }), [approvals]);

  const filteredApprovals = useMemo(() => {
    const query = search.trim().toLowerCase();
    return approvals.filter((approval) => {
      if (statusFilter !== "all" && approval.status !== statusFilter) return false;
      if (typeFilter !== "all" && approval.entityType !== typeFilter) return false;
      if (!isInPeriod(approval.createdAt, period, customRange)) return false;
      const haystack = [approval.id, approval.entityType, approval.entityId, approval.status, approval.requestedBy, approval.reviewedBy, approval.notes]
        .join(" ")
        .toLowerCase();
      return !query || haystack.includes(query);
    });
  }, [approvals, customRange, period, search, statusFilter, typeFilter]);

  const selectedPendingCount = selectedIds.filter((id) => approvals.find((approval) => approval.id === id)?.status === "pending").length;

  const handleFilterChange = (event: SelectChangeEvent) => setTypeFilter(event.target.value);
  const toggleSelected = (approvalId: string) => {
    setSelectedIds((prev) => prev.includes(approvalId) ? prev.filter((id) => id !== approvalId) : [...prev, approvalId]);
  };

  const handleActionClick = async (approval: AdminApprovalResponse, decision: "approved" | "rejected") => {
    try {
      await reviewAdminApproval(approval.id, { decision });
      setApprovals((prev) => prev.map((item) => item.id === approval.id ? { ...item, status: decision, reviewedAt: Date.now() } : item));
      setSelectedIds((prev) => prev.filter((id) => id !== approval.id));
      setSnackbar({ open: true, msg: `Approval ${approval.id.slice(0, 8)} ${decision}.`, severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, msg: err instanceof Error ? err.message : "Review failed", severity: "error" });
    }
  };

  const bulkReview = async (decision: "approved" | "rejected") => {
    const targets = approvals.filter((approval) => selectedIds.includes(approval.id) && approval.status === "pending");
    if (targets.length === 0) return;
    try {
      await Promise.all(targets.map((approval) => reviewAdminApproval(approval.id, { decision })));
      const targetIds = new Set(targets.map((approval) => approval.id));
      setApprovals((prev) => prev.map((approval) => targetIds.has(approval.id) ? { ...approval, status: decision, reviewedAt: Date.now() } : approval));
      setSelectedIds([]);
      setSnackbar({ open: true, msg: `${targets.length} approvals ${decision}.`, severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, msg: err instanceof Error ? err.message : "Bulk review failed", severity: "error" });
    }
  };

  const exportCsv = () => {
    const rows = [
      ["ID", "Type", "Entity", "Status", "Requested By", "Reviewed By", "Created At"],
      ...filteredApprovals.map((approval) => [
        approval.id,
        approval.entityType,
        approval.entityId,
        approval.status,
        approval.requestedBy,
        approval.reviewedBy || "",
        new Date(approval.createdAt).toISOString(),
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "approvals.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", pb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <FactCheckIcon sx={{ color: EV_GREEN }} />
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0 }}>Approvals Dashboard</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Backend approval queue for companies, drivers, vehicles, documents, and policy exceptions.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={() => void fetchApprovals()} sx={{ borderRadius: 1, textTransform: "none" }}>Refresh</Button>
          <Button size="small" variant="outlined" onClick={() => navigate("/admin/approvals/history")} sx={{ borderRadius: 1, textTransform: "none" }}>History</Button>
        </Stack>
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        <MetricCard label="Pending" value={counts.pending} icon={<PendingActionsIcon />} active={statusFilter === "pending"} onClick={() => setStatusFilter("pending")} color="#f59e0b" />
        <MetricCard label="Approved" value={counts.approved} icon={<TaskAltIcon />} active={statusFilter === "approved"} onClick={() => setStatusFilter("approved")} color={EV_GREEN} />
        <MetricCard label="Rejected" value={counts.rejected} icon={<BlockIcon />} active={statusFilter === "rejected"} onClick={() => setStatusFilter("rejected")} color="#ef4444" />
        <MetricCard label="All cases" value={counts.all} icon={<FactCheckIcon />} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} color="#2563eb" />
      </Box>

      <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)", mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.2fr 220px 220px" }, gap: 2, alignItems: "center" }}>
            <TextField size="small" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search approval id, entity, requester, or notes" />
            <FormControl size="small">
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={typeFilter} onChange={handleFilterChange}>
                <MenuItem value="all">All types</MenuItem>
                {entityTypes.map((type) => <MenuItem key={type} value={type}>{titleize(type)}</MenuItem>)}
              </Select>
            </FormControl>
            <PeriodSelector
              value={period}
              onChange={(newPeriod, range) => {
                setPeriod(newPeriod);
                if (range) setCustomRange([range.start, range.end]);
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)", overflow: "hidden" }}>
        <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Approval Queue</Typography>
            <Typography variant="caption" color="text.secondary">{filteredApprovals.length} cases shown · {selectedPendingCount} pending selected</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={exportCsv} sx={{ borderRadius: 1, textTransform: "none" }}>Export</Button>
            <Button size="small" variant="outlined" color="error" disabled={selectedPendingCount === 0} onClick={() => void bulkReview("rejected")} sx={{ borderRadius: 1, textTransform: "none" }}>Reject selected</Button>
            <Button size="small" variant="contained" disabled={selectedPendingCount === 0} onClick={() => void bulkReview("approved")} sx={{ borderRadius: 1, textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>Approve selected</Button>
          </Stack>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={48}></TableCell>
                <TableCell>Approval</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested</TableCell>
                <TableCell>Reviewer</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredApprovals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 7 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>No approvals match this view</Typography>
                    <Typography variant="body2" color="text.secondary">Adjust the filters or period.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredApprovals.map((approval) => (
                  <TableRow key={approval.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/admin/approvals/${approval.id}`)}>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <Checkbox size="small" checked={selectedIds.includes(approval.id)} disabled={approval.status !== "pending"} onChange={() => toggleSelected(approval.id)} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: "monospace" }}>{approval.id.slice(0, 10)}</Typography>
                      <Typography variant="caption" color="text.secondary">{approval.notes || "No notes"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{titleize(approval.entityType)}</Typography>
                      <Typography variant="caption" sx={{ fontFamily: "monospace" }} color="text.secondary">{approval.entityId}</Typography>
                    </TableCell>
                    <TableCell><Chip size="small" color={statusColor(approval.status)} label={titleize(approval.status)} /></TableCell>
                    <TableCell>{new Date(approval.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{approval.reviewedBy || "-"}</TableCell>
                    <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                      {approval.status === "pending" ? (
                        <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                          <Button size="small" variant="outlined" color="error" onClick={() => void handleActionClick(approval, "rejected")} sx={{ borderRadius: 1, textTransform: "none" }}>Reject</Button>
                          <Button size="small" variant="contained" onClick={() => void handleActionClick(approval, "approved")} sx={{ borderRadius: 1, textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>Approve</Button>
                        </Stack>
                      ) : (
                        <Button size="small" variant="text" onClick={() => navigate(`/admin/approvals/${approval.id}`)} sx={{ textTransform: "none" }}>Open</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
}

function MetricCard({
  label,
  value,
  icon,
  active,
  color,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <Card
      elevation={active ? 2 : 1}
      onClick={onClick}
      sx={{
        borderRadius: 1,
        border: `1px solid ${active ? color : "rgba(148,163,184,0.45)"}`,
        cursor: "pointer",
        bgcolor: active ? `${color}10` : "background.paper",
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 1, bgcolor: `${color}18`, color }}>{icon}</Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: "uppercase" }}>{label}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>{value.toLocaleString()}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
