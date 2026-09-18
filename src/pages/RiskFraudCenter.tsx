import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
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
import DownloadIcon from "@mui/icons-material/Download";
import GppMaybeIcon from "@mui/icons-material/GppMaybe";
import RefreshIcon from "@mui/icons-material/Refresh";
import RuleIcon from "@mui/icons-material/Rule";
import SearchIcon from "@mui/icons-material/Search";
import { listAdminRiskCases, patchAdminRiskCase } from "../services/api/adminApi";
import type { AdminRiskCaseResponse } from "../services/api/adminApi";

const EV_GREEN = "#03cd8c";

function formatDate(value?: number | string | null) {
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

function evidenceText(value: unknown) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item != null)
      .slice(0, 6)
      .map(([key, item]) => `${titleize(key)}: ${Array.isArray(item) ? item.join(", ") : String(item)}`)
      .join(" · ");
  }
  return String(value);
}

function caseCause(riskCase: AdminRiskCaseResponse) {
  const evidence = riskCase.evidence ?? {};
  const flagText = evidenceText((evidence as Record<string, unknown>).flags);
  if (flagText) return flagText;
  if (riskCase.notes) return riskCase.notes;
  return `${titleize(riskCase.type)} raised for ${titleize(riskCase.subjectType)} ${riskCase.subjectId.slice(0, 8)}`;
}

function caseResolution(riskCase: AdminRiskCaseResponse) {
  if (riskCase.status === "resolved") {
    return riskCase.resolvedAt ? `Resolved ${formatDate(riskCase.resolvedAt)}` : "Resolved";
  }
  if (riskCase.status === "under_review") {
    return "Under review: validate evidence, contact the subject, then resolve or reopen.";
  }
  return "Open: assign reviewer, inspect evidence, decide whether to mark under review or resolve.";
}

export default function RiskFraudCenterPage() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [cases, setCases] = useState<AdminRiskCaseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminRiskCases();
      setCases(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load risk cases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCases();
  }, []);

  const filteredCases = useMemo(() => {
    return cases.filter((riskCase) => {
      const matchesType = typeFilter === "All" || riskCase.type === typeFilter;
      const matchesSeverity = severityFilter === "All" || riskCase.severity.toLowerCase() === severityFilter.toLowerCase();
      const matchesStatus = statusFilter === "All" || (riskCase.status ?? "open") === statusFilter;
      const query = search.trim().toLowerCase();
      const haystack = [
        riskCase.id,
        riskCase.subjectId,
        riskCase.subjectType,
        riskCase.type,
        riskCase.severity,
        riskCase.status,
        riskCase.notes,
        evidenceText(riskCase.evidence),
      ].join(" ").toLowerCase();
      return matchesType && matchesSeverity && matchesStatus && (query.length === 0 || haystack.includes(query));
    });
  }, [cases, typeFilter, severityFilter, statusFilter, search]);

  const kpis = useMemo(() => {
    const open = cases.filter((riskCase) => (riskCase.status ?? "open") === "open").length;
    const underReview = cases.filter((riskCase) => riskCase.status === "under_review").length;
    const resolved = cases.filter((riskCase) => riskCase.status === "resolved").length;
    const high = cases.filter((riskCase) => riskCase.severity === "High").length;
    return [
      { label: "All cases", value: cases.length, filter: "All", helper: "Database risk queue" },
      { label: "Open", value: open, filter: "open", helper: `${high} high severity` },
      { label: "Under review", value: underReview, filter: "under_review", helper: "Assigned investigation" },
      { label: "Resolved", value: resolved, filter: "resolved", helper: "Closed cases" },
    ];
  }, [cases]);

  const typeOptions = useMemo(() => {
    const types = Array.from(new Set(cases.map((riskCase) => riskCase.type).filter(Boolean)));
    return ["All", ...types.sort((a, b) => a.localeCompare(b))];
  }, [cases]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]);
  };

  const bulkUpdate = async (status: "under_review" | "resolved") => {
    const targets = cases.filter((riskCase) => selectedIds.includes(riskCase.id));
    if (targets.length === 0) return;
    try {
      await Promise.all(targets.map((riskCase) => patchAdminRiskCase(riskCase.id, { status })));
      await fetchCases();
      setSelectedIds([]);
    } catch (err: any) {
      setError(err?.message ?? "Failed to update risk cases");
    }
  };

  const exportCsv = () => {
    const rows = [
      ["ID", "Subject", "Type", "Severity", "Status", "Cause", "Resolution", "Created At"],
      ...filteredCases.map((riskCase) => [
        riskCase.id,
        riskCase.subjectId,
        riskCase.type,
        riskCase.severity,
        riskCase.status ?? "open",
        caseCause(riskCase),
        caseResolution(riskCase),
        formatDate(riskCase.createdAt),
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "risk-cases.csv";
    link.click();
    URL.revokeObjectURL(url);
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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <GppMaybeIcon color="warning" />
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0 }}>
              Risk & Fraud Center
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Risk cases from the database with anomaly type, reason, and resolution state.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={exportCsv} sx={{ textTransform: "none", borderRadius: 999 }}>
            Export
          </Button>
          <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={() => void fetchCases()} sx={{ textTransform: "none", borderRadius: 999 }}>
            Refresh
          </Button>
        </Stack>
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        {kpis.map((kpi) => (
          <Paper
            key={kpi.label}
            variant="outlined"
            onClick={() => setStatusFilter(kpi.filter)}
            sx={{
              p: 2,
              borderRadius: 2,
              cursor: "pointer",
              borderColor: statusFilter === kpi.filter ? EV_GREEN : "divider",
              bgcolor: statusFilter === kpi.filter ? "rgba(3, 205, 140, 0.06)" : "background.paper",
              "&:hover": { borderColor: EV_GREEN, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)" },
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
              {kpi.label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
              {kpi.value.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {kpi.helper}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.4fr repeat(3, 1fr)" }, gap: 2 }}>
          <TextField
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search case, subject, reason, evidence"
            InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} /> }}
          />
          <TextField select size="small" label="Type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} SelectProps={{ native: true }}>
            {typeOptions.map((value) => <option key={value} value={value}>{titleize(value)}</option>)}
          </TextField>
          <TextField select size="small" label="Severity" value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} SelectProps={{ native: true }}>
            {["All", "Low", "Medium", "High"].map((value) => <option key={value} value={value}>{value}</option>)}
          </TextField>
          <TextField select size="small" label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} SelectProps={{ native: true }}>
            <option value="All">All</option>
            <option value="open">Open</option>
            <option value="under_review">Under review</option>
            <option value="resolved">Resolved</option>
          </TextField>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ flexWrap: "wrap", gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredCases.length} of {cases.length} cases
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="contained" disabled={selectedIds.length === 0} onClick={() => void bulkUpdate("under_review")} sx={{ textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#02ad77" } }}>
              Mark under review
            </Button>
            <Button size="small" variant="outlined" disabled={selectedIds.length === 0} onClick={() => void bulkUpdate("resolved")} sx={{ textTransform: "none" }}>
              Resolve selected
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Risk Case Queue
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Case type, cause, and resolution path are displayed from backend notes and evidence.
          </Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>Subject</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Cause / reason</TableCell>
                <TableCell>Resolution means</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 7 }}>
                    <RuleIcon color="disabled" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>No risk cases match the current filters</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCases.map((riskCase) => (
                  <TableRow key={riskCase.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/admin/risk/${riskCase.id}`)}>
                    <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
                      <Checkbox checked={selectedIds.includes(riskCase.id)} onChange={() => toggleSelected(riskCase.id)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{riskCase.subjectId.slice(0, 10)}</Typography>
                      <Typography variant="caption" color="text.secondary">{titleize(riskCase.subjectType)}</Typography>
                    </TableCell>
                    <TableCell><Chip size="small" label={titleize(riskCase.type)} /></TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>{caseCause(riskCase)}</TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>{caseResolution(riskCase)}</TableCell>
                    <TableCell>
                      <Chip size="small" color={riskCase.severity === "High" ? "error" : riskCase.severity === "Medium" ? "warning" : "success"} label={riskCase.severity} />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" color={riskCase.status === "resolved" ? "success" : riskCase.status === "under_review" ? "warning" : "default"} label={titleize(riskCase.status ?? "open")} />
                    </TableCell>
                    <TableCell>{formatDate(riskCase.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={(event) => { event.stopPropagation(); navigate(`/admin/risk/${riskCase.id}`); }} sx={{ textTransform: "none" }}>
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
