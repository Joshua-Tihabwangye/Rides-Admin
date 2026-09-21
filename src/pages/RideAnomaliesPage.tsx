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
  { value: "TRIP_DISTANCE_ANOMALY", label: "Distance anomaly" },
  { value: "TRIP_DURATION_ANOMALY", label: "Duration anomaly" },
  { value: "GPS_INSUFFICIENT", label: "Insufficient GPS" },
];

const FLAG_DETAILS: Record<string, { label: string; cause: string; resolution: string }> = {
  TRIP_DISTANCE_ANOMALY: {
    label: "Distance anomaly",
    cause: "Actual route distance differs from the quoted trip distance beyond the allowed tolerance.",
    resolution: "Review the ride route and fare evidence, then keep or resolve the linked risk case.",
  },
  TRIP_DURATION_ANOMALY: {
    label: "Duration anomaly",
    cause: "Server lifecycle duration is too short or differs materially from the quoted duration.",
    resolution: "Audit start, arrival, pause, and completion events before closing the exception.",
  },
  GPS_INSUFFICIENT: {
    label: "Insufficient GPS",
    cause: "The trip completed with too few usable GPS breadcrumbs to verify actual movement confidently.",
    resolution: "Check driver location permissions/network history and request support review if repeated.",
  },
};

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
  if (flag.includes("GPS")) return "error";
  if (flag.includes("DURATION")) return "warning";
  if (flag.includes("DISTANCE")) return "primary";
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

function primaryFlag(flags: string[]) {
  return flags.find((flag) => Boolean(FLAG_DETAILS[flag])) ?? flags[0] ?? "";
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
    const distance = items.filter((item) => item.anomalyFlags?.includes("TRIP_DISTANCE_ANOMALY")).length;
    const duration = items.filter((item) => item.anomalyFlags?.includes("TRIP_DURATION_ANOMALY")).length;
    const gps = items.filter((item) => item.anomalyFlags?.includes("GPS_INSUFFICIENT")).length;
    const breadcrumbTotal = items.reduce((sum, item) => sum + (item.breadcrumbCount ?? 0), 0);
    return {
      distance,
      duration,
      gps,
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
            Database trip actuals with anomaly type, cause, and resolution path.
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
        <SummaryTile icon={<TimelineIcon />} label="Visible anomalies" value={total} helper={selectedLabel} active={flag === ""} onClick={() => setFlag("")} />
        <SummaryTile icon={<RouteIcon />} label="Distance anomalies" value={summary.distance} helper="Actual vs quoted distance" active={flag === "TRIP_DISTANCE_ANOMALY"} onClick={() => setFlag("TRIP_DISTANCE_ANOMALY")} />
        <SummaryTile icon={<SpeedIcon />} label="Duration anomalies" value={summary.duration} helper="Lifecycle timing variance" active={flag === "TRIP_DURATION_ANOMALY"} onClick={() => setFlag("TRIP_DURATION_ANOMALY")} />
        <SummaryTile icon={<ReportProblemIcon />} label="Insufficient GPS" value={summary.gps} helper={`${summary.avgBreadcrumbs} avg breadcrumbs`} active={flag === "GPS_INSUFFICIENT"} onClick={() => setFlag("GPS_INSUFFICIENT")} />
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
              Each row is loaded from the persisted trip actuals table.
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
                <TableCell>Anomaly type</TableCell>
                <TableCell>Reason / cause</TableCell>
                <TableCell>Resolution means</TableCell>
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
                  <TableCell colSpan={10} align="center" sx={{ py: 7 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 7 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      No anomalies found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try another anomaly type or refresh after completed rides are verified.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const flags = Array.isArray(item.anomalyFlags) ? item.anomalyFlags : [];
                  const selected = primaryFlag(flags);
                  const detail = FLAG_DETAILS[selected] ?? {
                    label: selected ? labelize(selected) : "No active flags",
                    cause: "The backend did not provide an anomaly flag for this actual.",
                    resolution: "Open the ride and review the full timeline before closing.",
                  };
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
                              <Chip key={itemFlag} size="small" color={flagColor(itemFlag)} label={FLAG_DETAILS[itemFlag]?.label ?? labelize(itemFlag)} />
                            ))
                          ) : (
                            <Chip size="small" color="success" label="No active flags" />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 280 }}>{detail.cause}</TableCell>
                      <TableCell sx={{ maxWidth: 280 }}>{detail.resolution}</TableCell>
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
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  helper: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 2,
        cursor: onClick ? "pointer" : "default",
        borderColor: active ? "#03cd8c" : "divider",
        bgcolor: active ? "rgba(3, 205, 140, 0.06)" : "background.paper",
        "&:hover": onClick ? { borderColor: "#03cd8c", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)" } : undefined,
      }}
    >
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
