import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
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
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import {
  listAdminReconciliationRuns,
  startAdminReconciliationRun,
  listAdminReconciliationRecords,
  resolveAdminReconciliationRecord,
  listAdminReconciliationProviders,
  type AdminReconciliationRun,
  type AdminReconciliationRecord,
} from "../services/api/adminApi";

const EV_GREEN = "#03cd8c";
const RUN_TYPES = ["PAYMENTS", "PAYOUTS", "CORPORATEPAY"];
const RUN_STATUSES = ["OPEN", "RUNNING", "COMPLETED", "FAILED"];
const RECORD_STATUSES = ["OPEN", "MATCHED", "VARIANCE", "RESOLVED", "IGNORED"];

const statusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case "COMPLETED":
    case "RESOLVED":
    case "MATCHED":
      return "success";
    case "FAILED":
    case "VARIANCE":
      return "error";
    case "RUNNING":
      return "info";
    case "OPEN":
      return "warning";
    default:
      return "default";
  }
};

function money(value?: number) {
  return Number(value ?? 0).toLocaleString("en-UG");
}

function dateRange(run: AdminReconciliationRun) {
  const start = run.periodStart ? new Date(run.periodStart).toLocaleDateString() : "-";
  const end = run.periodEnd ? new Date(run.periodEnd).toLocaleDateString() : "-";
  return `${start} -> ${end}`;
}

export default function FinanceReconciliationRunsPage() {
  const [runs, setRuns] = useState<AdminReconciliationRun[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("PAYMENTS");
  const [provider, setProvider] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [tolerance, setTolerance] = useState("0.01");
  const [submitting, setSubmitting] = useState(false);
  const [runTypeFilter, setRunTypeFilter] = useState("");
  const [runStatusFilter, setRunStatusFilter] = useState("");
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [records, setRecords] = useState<AdminReconciliationRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordStatusFilter, setRecordStatusFilter] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<AdminReconciliationRecord | null>(null);
  const [recordStatus, setRecordStatus] = useState("RESOLVED");
  const [recordResolution, setRecordResolution] = useState("");
  const [resolving, setResolving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [runsRes, providersRes] = await Promise.all([
        listAdminReconciliationRuns({
          type: runTypeFilter || undefined,
          status: runStatusFilter || undefined,
        }),
        listAdminReconciliationProviders(),
      ]);
      setRuns(Array.isArray(runsRes) ? runsRes : []);
      setProviders(providersRes.providers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reconciliation runs");
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [runStatusFilter, runTypeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadRecords = useCallback(async (runId: string) => {
    setRecordsLoading(true);
    setError(null);
    try {
      const res = await listAdminReconciliationRecords(runId, {
        status: recordStatusFilter || undefined,
      });
      setRecords(Array.isArray(res) ? res : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load records");
    } finally {
      setRecordsLoading(false);
    }
  }, [recordStatusFilter]);

  useEffect(() => {
    if (expandedRunId) void loadRecords(expandedRunId);
  }, [expandedRunId, loadRecords]);

  const metrics = useMemo(() => ({
    total: runs.length,
    open: runs.filter((run) => run.status === "OPEN" || run.status === "RUNNING").length,
    completed: runs.filter((run) => run.status === "COMPLETED").length,
    failed: runs.filter((run) => run.status === "FAILED").length,
  }), [runs]);

  const handleStart = async () => {
    const parsedTolerance = Number(tolerance);
    if (!periodStart || !periodEnd) {
      setError("Select a period start and period end before starting reconciliation.");
      return;
    }
    if (new Date(periodStart) > new Date(periodEnd)) {
      setError("Period start must be before period end.");
      return;
    }
    if (!Number.isFinite(parsedTolerance) || parsedTolerance < 0) {
      setError("Tolerance must be a valid non-negative number.");
      return;
    }
    setSubmitting(true);
    try {
      await startAdminReconciliationRun({
        type,
        periodStart,
        periodEnd,
        provider: provider || undefined,
        tolerance: parsedTolerance,
      });
      setOpen(false);
      setPeriodStart("");
      setPeriodEnd("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Start run failed");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRecords = (runId: string) => {
    if (expandedRunId === runId) {
      setExpandedRunId(null);
      setRecords([]);
      return;
    }
    setExpandedRunId(runId);
  };

  const handleResolve = async () => {
    if (!selectedRecord || !expandedRunId) return;
    setResolving(true);
    try {
      await resolveAdminReconciliationRecord(expandedRunId, selectedRecord.id, { status: recordStatus, resolution: recordResolution });
      setSelectedRecord(null);
      setRecordResolution("");
      await loadRecords(expandedRunId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resolve failed");
    } finally {
      setResolving(false);
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
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", pb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <SyncAltIcon sx={{ color: EV_GREEN }} />
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0 }}>Reconciliation Runs</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Start, inspect, and resolve payment and payout reconciliation runs from backend records.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={() => void load()} sx={{ borderRadius: 1, textTransform: "none" }}>Refresh</Button>
          <Button variant="contained" size="small" startIcon={<PlayArrowIcon />} onClick={() => setOpen(true)} sx={{ borderRadius: 1, textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>Start run</Button>
        </Stack>
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        <MetricCard label="Runs" value={metrics.total} icon={<SyncAltIcon />} color="#2563eb" />
        <MetricCard label="Open / running" value={metrics.open} icon={<PendingActionsIcon />} color="#f59e0b" />
        <MetricCard label="Completed" value={metrics.completed} icon={<TaskAltIcon />} color={EV_GREEN} />
        <MetricCard label="Failed" value={metrics.failed} icon={<ErrorOutlineIcon />} color="#ef4444" />
      </Box>

      <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)", mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel>Run type</InputLabel>
              <Select label="Run type" value={runTypeFilter} onChange={(event) => setRunTypeFilter(event.target.value)}>
                <MenuItem value="">All types</MenuItem>
                {RUN_TYPES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={runStatusFilter} onChange={(event) => setRunStatusFilter(event.target.value)}>
                <MenuItem value="">All statuses</MenuItem>
                {RUN_STATUSES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)", overflow: "hidden" }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Backend Runs</Typography>
          <Typography variant="caption" color="text.secondary">{runs.length} reconciliation runs loaded</Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Run</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Completed</TableCell>
                <TableCell align="right">Records</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 7 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>No reconciliation runs yet</Typography>
                    <Typography variant="body2" color="text.secondary">Start a run to populate this backend queue.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                runs.map((run) => (
                  <React.Fragment key={run.id}>
                    <TableRow hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{run.type}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>{run.id}</Typography>
                      </TableCell>
                      <TableCell>{dateRange(run)}</TableCell>
                      <TableCell><Chip size="small" label={run.status} color={statusColor(run.status) as any} /></TableCell>
                      <TableCell>{run.createdAt ? new Date(run.createdAt).toLocaleString() : "-"}</TableCell>
                      <TableCell>{run.completedAt ? new Date(run.completedAt).toLocaleString() : "-"}</TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="outlined" sx={{ borderRadius: 1, textTransform: "none" }} onClick={() => toggleRecords(run.id)}>
                          {expandedRunId === run.id ? "Hide records" : "View records"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} sx={{ p: 0, borderBottom: expandedRunId === run.id ? undefined : 0 }}>
                        <Collapse in={expandedRunId === run.id} unmountOnExit>
                          <Box sx={{ p: 2, bgcolor: "action.hover" }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 1.5, flexWrap: "wrap" }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Run Records</Typography>
                              <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>Record status</InputLabel>
                                <Select label="Record status" value={recordStatusFilter} onChange={(event) => setRecordStatusFilter(event.target.value)}>
                                  <MenuItem value="">All record statuses</MenuItem>
                                  {RECORD_STATUSES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                                </Select>
                              </FormControl>
                            </Box>
                            {recordsLoading ? <CircularProgress size={22} /> : (
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Record</TableCell>
                                    <TableCell>Internal</TableCell>
                                    <TableCell>Expected</TableCell>
                                    <TableCell>Settled</TableCell>
                                    <TableCell>Variance</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Action</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {records.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}>No records for this filter.</TableCell></TableRow>
                                  ) : (
                                    records.map((rec) => (
                                      <TableRow key={rec.id} hover>
                                        <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{rec.id}</TableCell>
                                        <TableCell>{rec.internalRecordType} {rec.internalRecordId}</TableCell>
                                        <TableCell>{money(rec.expectedAmount)}</TableCell>
                                        <TableCell>{money(rec.settledAmount)}</TableCell>
                                        <TableCell>{money(rec.variance)}</TableCell>
                                        <TableCell><Chip size="small" label={rec.status} color={statusColor(rec.status) as any} /></TableCell>
                                        <TableCell align="right">
                                          {rec.status !== "RESOLVED" && rec.status !== "IGNORED" ? (
                                            <Button size="small" variant="outlined" sx={{ borderRadius: 1, textTransform: "none" }} onClick={() => { setSelectedRecord(rec); setRecordStatus("RESOLVED"); setRecordResolution(""); }}>
                                              Resolve
                                            </Button>
                                          ) : "-"}
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Start reconciliation run</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Type" value={type} onChange={(event) => setType(event.target.value)} fullWidth size="small" helperText="PAYMENTS, PAYOUTS or CORPORATEPAY" />
          <Select value={provider} displayEmpty fullWidth size="small" onChange={(event) => setProvider(event.target.value)}>
            <MenuItem value=""><em>All providers</em></MenuItem>
            {providers.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </Select>
          <TextField label="Period start" type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          <TextField label="Period end" type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          <TextField label="Tolerance" type="number" value={tolerance} onChange={(event) => setTolerance(event.target.value)} fullWidth size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} size="small" sx={{ textTransform: "none" }}>Cancel</Button>
          <Button onClick={() => void handleStart()} variant="contained" size="small" disabled={submitting || !periodStart || !periodEnd} sx={{ textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>
            {submitting ? "Starting..." : "Start"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!selectedRecord} onClose={() => setSelectedRecord(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Resolve record</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2">Variance: {money(selectedRecord?.variance)}</Typography>
          <Select value={recordStatus} fullWidth size="small" onChange={(event) => setRecordStatus(event.target.value)}>
            <MenuItem value="RESOLVED">Resolved</MenuItem>
            <MenuItem value="IGNORED">Ignored</MenuItem>
          </Select>
          <TextField label="Resolution note" value={recordResolution} onChange={(event) => setRecordResolution(event.target.value)} fullWidth size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRecord(null)} size="small" sx={{ textTransform: "none" }}>Cancel</Button>
          <Button onClick={() => void handleResolve()} variant="contained" size="small" disabled={resolving} sx={{ textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>
            {resolving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function MetricCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)" }}>
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
