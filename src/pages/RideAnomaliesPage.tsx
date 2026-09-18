import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { ChipProps, SelectChangeEvent } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import RouteIcon from "@mui/icons-material/Route";
import SpeedIcon from "@mui/icons-material/Speed";
import TimelineIcon from "@mui/icons-material/Timeline";
import { getAdminRideAnomalies } from "../services/api/adminApi";
import type { AdminRideAnomalyItem } from "../services/api/adminApi";

const FLAG_OPTIONS = [
  { value: "", label: "All anomalies" },
  { value: "ROUTE_DEVIATION", label: "Route deviation" },
  { value: "EXCESS_DURATION", label: "Excess duration" },
  { value: "EXCESS_DISTANCE", label: "Excess distance" },
  { value: "LOW_CONFIDENCE", label: "Low confidence" },
  { value: "MISSING_BREADCRUMBS", label: "Missing breadcrumbs" },
];

function readAnomalyItems(value: unknown): AdminRideAnomalyItem[] {
  if (Array.isArray(value)) return value as AdminRideAnomalyItem[];
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items as AdminRideAnomalyItem[];
  if (record.data) return readAnomalyItems(record.data);
  return [];
}

function labelize(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function flagColor(flag: string): ChipProps["color"] {
  if (flag.includes("MISSING") || flag.includes("LOW")) return "error";
  if (flag.includes("EXCESS") || flag.includes("ROUTE")) return "warning";
  return "default";
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function formatMetric(value: number | undefined, suffix: string) {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toLocaleString()} ${suffix}` : "-";
}

function rideShortId(rideId?: string) {
  return rideId ? rideId.slice(0, 8) : "Unknown";
}

export default function RideAnomaliesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminRideAnomalyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flag, setFlag] = useState("");

  const load = useCallback((selectedFlag: string) => {
    setLoading(true);
    setError(null);
    getAdminRideAnomalies(selectedFlag || undefined, 200)
      .then((res) => {
        const nextItems = readAnomalyItems(res);
        setItems(nextItems);
        setTotal(typeof res.total === "number" ? res.total : nextItems.length);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load anomalies");
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(flag);
  }, [flag, load]);

  const summary = useMemo(() => {
    const routeDeviation = items.filter((item) => item.anomalyFlags?.includes("ROUTE_DEVIATION")).length;
    const lowConfidence = items.filter((item) => item.anomalyFlags?.includes("LOW_CONFIDENCE")).length;
    const missingBreadcrumbs = items.filter((item) => item.anomalyFlags?.includes("MISSING_BREADCRUMBS")).length;
    const breadcrumbTotal = items.reduce((sum, item) => sum + (item.breadcrumbCount ?? 0), 0);
    return {
      routeDeviation,
      lowConfidence,
      missingBreadcrumbs,
      avgBreadcrumbs: items.length ? Math.round(breadcrumbTotal / items.length) : 0,
    };
  }, [items]);

  const selectedLabel = FLAG_OPTIONS.find((option) => option.value === flag)?.label ?? "All anomalies";

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <ReportProblemIcon color="warning" />
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0 }}>
              Ride Anomalies
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Review route, distance, duration, and GPS evidence exceptions from completed ride actuals.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => load(flag)}
          disabled={loading}
          sx={{ borderRadius: 999, textTransform: "none" }}
        >
          Refresh
        </Button>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        <SummaryTile icon={<TimelineIcon />} label="Visible anomalies" value={total} helper={selectedLabel} />
        <SummaryTile icon={<RouteIcon />} label="Route deviations" value={summary.routeDeviation} helper="Path variance flags" />
        <SummaryTile icon={<SpeedIcon />} label="Low confidence" value={summary.lowConfidence} helper="Weak actuals evidence" />
        <SummaryTile icon={<ReportProblemIcon />} label="Missing GPS" value={summary.missingBreadcrumbs} helper={`${summary.avgBreadcrumbs} avg breadcrumbs`} />
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel id="anomaly-flag-label">Anomaly type</InputLabel>
            <Select
              labelId="anomaly-flag-label"
              label="Anomaly type"
              value={flag}
              onChange={(event: SelectChangeEvent) => setFlag(event.target.value)}
            >
              {FLAG_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            Showing the latest 200 anomaly records from backend trip actuals.
          </Typography>
        </Stack>
      </Paper>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Anomaly Evidence
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Click inspect to open the ride timeline, route, payments, and incident context.
            </Typography>
          </Box>
          <Chip size="small" label={`${items.length} loaded`} />
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ride</TableCell>
                <TableCell>Anomaly flags</TableCell>
                <TableCell align="right">Distance</TableCell>
                <TableCell align="right">Duration</TableCell>
                <TableCell>Confidence</TableCell>
                <TableCell align="right">Breadcrumbs</TableCell>
                <TableCell>Computed</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 7 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 7 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      No anomalies found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try a different anomaly type or refresh after more rides are completed.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const flags = Array.isArray(item.anomalyFlags) ? item.anomalyFlags : [];
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                          {rideShortId(item.rideId)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75 }}>
                          {flags.length ? (
                            flags.map((itemFlag) => (
                              <Chip key={itemFlag} size="small" color={flagColor(itemFlag)} label={labelize(itemFlag)} />
                            ))
                          ) : (
                            <Chip size="small" color="success" label="No active flags" />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{formatMetric(item.actualDistanceKm, "km")}</TableCell>
                      <TableCell align="right">{formatMetric(item.actualDurationMinutes, "min")}</TableCell>
                      <TableCell>
                        <Chip size="small" label={item.confidence ? labelize(item.confidence) : "Unknown"} />
                      </TableCell>
                      <TableCell align="right">{item.breadcrumbCount?.toLocaleString() ?? "-"}</TableCell>
                      <TableCell>{formatDateTime(item.computedAt)}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          endIcon={<ArrowForwardIcon />}
                          onClick={() => navigate(`/admin/rides/${item.rideId}`)}
                          disabled={!item.rideId}
                          sx={{ textTransform: "none" }}
                        >
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 1.5, bgcolor: "rgba(3, 205, 140, 0.12)", color: "#029b6d" }}>
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            {label}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            {value.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {helper}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
