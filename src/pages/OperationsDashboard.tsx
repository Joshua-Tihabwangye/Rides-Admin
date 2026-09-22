import React, { useEffect, useMemo, useState } from "react";
import type { Dayjs } from "dayjs";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import TimelineIcon from "@mui/icons-material/Timeline";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PeriodSelector, { PeriodOption } from "../components/PeriodSelector";
import {
  getAdminDashboard,
  getAdminOperationsAnalytics,
  listAdminRides,
} from "../services/api/adminApi";
import type {
  AdminDashboardCounts,
  AdminOperationsAnalytics,
  AdminRideListItemResponse,
} from "../services/api/adminApi";

const EV_GREEN = "#03cd8c";
const EV_ORANGE = "#f77f00";
const ACTIVE_RIDE_STATUSES = new Set([
  "SEARCHING",
  "OFFERED",
  "ACCEPTED",
  "DRIVER_ASSIGNED",
  "DRIVER_EN_ROUTE",
  "ARRIVED",
  "WAITING",
  "VERIFIED",
  "IN_PROGRESS",
]);

const PERIOD_LABELS: Record<PeriodOption, string> = {
  today: "Today",
  "7days": "Last 7 days",
  thisMonth: "This month",
  thisYear: "This year",
  custom: "Custom range",
};

function formatNumber(value?: number): string {
  return Number(value ?? 0).toLocaleString();
}

function customDateRange(range: [Dayjs | null, Dayjs | null]) {
  const [start, end] = range;
  return {
    start: start ? start.startOf("day").toISOString() : undefined,
    end: end ? end.endOf("day").toISOString() : undefined,
  };
}

function formatMoney(value?: number, currency = "UGX"): string {
  if (value == null || Number.isNaN(Number(value))) return "-";
  return `${currency} ${Number(value).toLocaleString("en-UG")}`;
}

function formatAge(value?: string): string {
  if (!value) return "-";
  const created = new Date(value).getTime();
  if (!Number.isFinite(created)) return "-";
  const minutes = Math.max(0, Math.floor((Date.now() - created) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function statusTone(status: string): "default" | "primary" | "success" | "warning" | "error" {
  const normalized = status.toUpperCase();
  if (normalized.includes("CANCEL") || normalized.includes("FAILED")) return "error";
  if (normalized.includes("PROGRESS") || normalized.includes("ARRIVED")) return "success";
  if (normalized.includes("EN_ROUTE") || normalized.includes("ACCEPTED")) return "primary";
  if (normalized.includes("SEARCH") || normalized.includes("OFFER")) return "warning";
  return "default";
}

function ChartEmpty({ text }: { text: string }) {
  return (
    <Box sx={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Typography variant="body2" color="text.secondary">{text}</Typography>
    </Box>
  );
}

export default function OperationsDashboardPage() {
  const navigate = useNavigate();
  const [summaryPeriod, setSummaryPeriod] = useState<PeriodOption>("today");
  const [demandPeriod, setDemandPeriod] = useState<PeriodOption>("today");
  const [mixPeriod, setMixPeriod] = useState<PeriodOption>("today");
  const [summaryRange, setSummaryRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [demandRange, setDemandRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [mixRange, setMixRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [summary, setSummary] = useState<AdminOperationsAnalytics | null>(null);
  const [demandAnalytics, setDemandAnalytics] = useState<AdminOperationsAnalytics | null>(null);
  const [mixAnalytics, setMixAnalytics] = useState<AdminOperationsAnalytics | null>(null);
  const [dashboard, setDashboard] = useState<AdminDashboardCounts | null>(null);
  const [activeRides, setActiveRides] = useState<AdminRideListItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedKpi, setSelectedKpi] = useState<"trips" | "dispatches" | "drivers" | "activeRides">("activeRides");

  const load = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    setError(null);
    try {
      const summaryQuery = summaryPeriod === "custom" ? customDateRange(summaryRange) : {};
      const demandQuery = demandPeriod === "custom" ? customDateRange(demandRange) : {};
      const mixQuery = mixPeriod === "custom" ? customDateRange(mixRange) : {};
      const [summaryData, demandData, mixData, dashboardData, ridesData] = await Promise.all([
        getAdminOperationsAnalytics({ period: summaryPeriod, ...summaryQuery }),
        getAdminOperationsAnalytics({ period: demandPeriod, ...demandQuery }),
        getAdminOperationsAnalytics({ period: mixPeriod, ...mixQuery }),
        getAdminDashboard(),
        listAdminRides({ page: 1, limit: 100 }),
      ]);
      setSummary(summaryData);
      setDemandAnalytics(demandData);
      setMixAnalytics(mixData);
      setDashboard(dashboardData);
      setActiveRides(
        (ridesData.items ?? [])
          .filter((ride) => ACTIVE_RIDE_STATUSES.has(String(ride.status).toUpperCase()))
          .slice(0, 12),
      );
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err?.message ?? "Failed to load operations data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void load();
    const interval = window.setInterval(() => void load(), 20000);
    return () => window.clearInterval(interval);
  }, [summaryPeriod, demandPeriod, mixPeriod, summaryRange, demandRange, mixRange]);

  const handlePeriodChange =
    (setPeriod: (period: PeriodOption) => void, setRange: (range: [Dayjs | null, Dayjs | null]) => void) =>
    (period: PeriodOption, range?: { start: Dayjs; end: Dayjs }) => {
      setPeriod(period);
      if (range) setRange([range.start, range.end]);
    };

  const demandData = useMemo(
    () => (demandAnalytics?.hourly ?? []).map((row) => ({
      time: row.time ?? "-",
      demand: Number(row.demand ?? 0),
      supply: Number(row.supply ?? 0),
      rides: Number(row.rides ?? 0),
      deliveries: Number(row.deliveries ?? 0),
    })),
    [demandAnalytics],
  );

  const serviceMixData = useMemo(() => {
    const explicit = mixAnalytics?.serviceMix ?? [];
    if (explicit.length) {
      return explicit.map((row) => ({
        service: row.service ?? "Unknown",
        total: Number(row.total ?? 0),
        completed: Number(row.completed ?? 0),
        active: Number(row.active ?? 0),
      }));
    }
    return (mixAnalytics?.regions ?? []).map((row) => ({
      service: row.region ?? "All",
      total: Number(row.rides ?? 0) + Number(row.deliveries ?? 0),
      completed: 0,
      active: 0,
    }));
  }, [mixAnalytics]);

  const kpis = [
    {
      key: "trips" as const,
      label: "Total trip volume",
      value: formatNumber(summary?.trips.total),
      helper: `${formatNumber(summary?.trips.completed)} completed · ${formatNumber(dashboard?.activeRides ?? summary?.trips.active)} ride jobs active`,
      icon: <TimelineIcon fontSize="small" />,
      accent: EV_GREEN,
    },
    {
      key: "dispatches" as const,
      label: "Dispatches",
      value: formatNumber(summary?.dispatches.total),
      helper: `${formatNumber(summary?.dispatches.pending)} pending offers`,
      icon: <LocalShippingIcon fontSize="small" />,
      accent: EV_ORANGE,
    },
    {
      key: "drivers" as const,
      label: "Online drivers",
      value: formatNumber(summary?.drivers.online),
      helper: `${formatNumber(summary?.drivers.total)} drivers in fleet`,
      icon: <PeopleAltIcon fontSize="small" />,
      accent: "#2563eb",
    },
    {
      key: "activeRides" as const,
      label: "Active rides",
      value: formatNumber(activeRides.length),
      helper: "Currently moving or awaiting driver action",
      icon: <DirectionsCarIcon fontSize="small" />,
      accent: "#64748b",
    },
  ];

  if (loading && !summary) {
    return (
      <Box sx={{ minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} size="small" sx={{ textTransform: "none" }}>
          Back
        </Button>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Operations Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Live ride flow, dispatch health, and service demand from backend data.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <PeriodSelector
            value={summaryPeriod}
            onChange={handlePeriodChange(setSummaryPeriod, setSummaryRange)}
            customStart={summaryRange[0]}
            customEnd={summaryRange[1]}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={refreshing ? <CircularProgress size={14} /> : <RefreshIcon />}
            onClick={() => void load(true)}
            disabled={refreshing}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid item xs={12} sm={6} lg={3} key={kpi.label}>
            <Card
              variant="outlined"
              onClick={() => setSelectedKpi(kpi.key)}
              sx={{
                height: "100%",
                borderRadius: 2,
                cursor: "pointer",
                borderColor: selectedKpi === kpi.key ? kpi.accent : "divider",
                bgcolor: selectedKpi === kpi.key ? `${kpi.accent}0f` : "background.paper",
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
                      {kpi.label}
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>{kpi.value}</Typography>
                  </Box>
                  <Box sx={{ color: kpi.accent, bgcolor: `${kpi.accent}18`, borderRadius: 2, p: 1, display: "flex" }}>
                    {kpi.icon}
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{kpi.helper}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1.5} sx={{ mb: 1.5 }}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" fontWeight={800}>{selectedKpi === "activeRides" ? "Live active rides" : selectedKpi === "trips" ? "Trip volume details" : selectedKpi === "dispatches" ? "Dispatch details" : "Driver supply details"}</Typography>
                <Chip size="small" label={selectedKpi === "activeRides" ? `${activeRides.length} active` : "Selected card"} sx={{ bgcolor: "#dcfce7", color: "#047857" }} />
              </Stack>
              <Typography variant="body2" color="text.secondary">Click a summary card above to inspect its current backend data.</Typography>
            </Box>
            <Button size="small" onClick={() => navigate(selectedKpi === "drivers" ? "/admin/monitoring" : selectedKpi === "dispatches" ? "/admin/matching" : "/admin/rides")} sx={{ textTransform: "none" }}>
              Open related page
            </Button>
          </Stack>
          <Divider sx={{ mb: 1.5 }} />
          {selectedKpi === "activeRides" ? (
            <ActiveRidesTable rides={activeRides} navigate={navigate} />
          ) : selectedKpi === "trips" ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}><MetricBox label="Total" value={formatNumber(summary?.trips.total)} /></Grid>
              <Grid item xs={12} sm={4}><MetricBox label="Completed" value={formatNumber(summary?.trips.completed)} /></Grid>
              <Grid item xs={12} sm={4}><MetricBox label="Active/open" value={formatNumber(summary?.trips.active)} /></Grid>
            </Grid>
          ) : selectedKpi === "dispatches" ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><MetricBox label="Dispatches created" value={formatNumber(summary?.dispatches.total)} /></Grid>
              <Grid item xs={12} sm={6}><MetricBox label="Pending offers" value={formatNumber(summary?.dispatches.pending)} /></Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><MetricBox label="Online drivers" value={formatNumber(summary?.drivers.online)} /></Grid>
              <Grid item xs={12} sm={6}><MetricBox label="Fleet drivers" value={formatNumber(summary?.drivers.total)} /></Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>Demand vs supply</Typography>
                  <Typography variant="body2" color="text.secondary">Ride and delivery demand compared with current online driver supply.</Typography>
                </Box>
                <PeriodSelector
                  value={demandPeriod}
                  onChange={handlePeriodChange(setDemandPeriod, setDemandRange)}
                  customStart={demandRange[0]}
                  customEnd={demandRange[1]}
                />
              </Stack>
              {demandData.length === 0 ? <ChartEmpty text={`No demand data for ${PERIOD_LABELS[demandPeriod]}.`} /> : (
                <Box sx={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={demandData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="demand" name="Demand" stroke={EV_ORANGE} strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="supply" name="Online supply" stroke={EV_GREEN} strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row", lg: "column" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center", lg: "stretch" }} spacing={1} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>Service mix</Typography>
                  <Typography variant="body2" color="text.secondary">Volume by service line for the selected period.</Typography>
                </Box>
                <PeriodSelector
                  value={mixPeriod}
                  onChange={handlePeriodChange(setMixPeriod, setMixRange)}
                  customStart={mixRange[0]}
                  customEnd={mixRange[1]}
                />
              </Stack>
              {serviceMixData.length === 0 ? <ChartEmpty text={`No service data for ${PERIOD_LABELS[mixPeriod]}.`} /> : (
                <Box sx={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceMixData} layout="vertical" margin={{ top: 10, right: 16, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="service" width={78} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" name="Completed" stackId="service" fill={EV_GREEN} radius={[0, 4, 4, 0]} />
                      <Bar dataKey="active" name="Active/open" stackId="service" fill={EV_ORANGE} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {lastUpdated ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
          Last updated {lastUpdated.toLocaleTimeString()}
        </Typography>
      ) : null}
    </Box>
  );
}


function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.default" }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
      <Typography variant="h5" fontWeight={800}>{value}</Typography>
    </Box>
  );
}

function ActiveRidesTable({ rides, navigate }: { rides: AdminRideListItemResponse[]; navigate: (path: string) => void }) {
  if (rides.length === 0) return <Alert severity="info">No active rides are currently returned by the backend.</Alert>;
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Ride</TableCell>
            <TableCell>Rider</TableCell>
            <TableCell>Driver</TableCell>
            <TableCell>Service</TableCell>
            <TableCell>Fare</TableCell>
            <TableCell>Payment</TableCell>
            <TableCell>Age</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rides.map((ride) => (
            <TableRow key={ride.id} hover>
              <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{ride.id.slice(0, 8)}</TableCell>
              <TableCell>{ride.riderName || ride.riderId?.slice(0, 8) || "-"}</TableCell>
              <TableCell>{ride.driverName || "Unassigned"}</TableCell>
              <TableCell>
                <Typography variant="body2">{ride.category || "Ride"}</Typography>
                <Typography variant="caption" color="text.secondary">{ride.mode || ride.tripType || "-"}</Typography>
              </TableCell>
              <TableCell>{formatMoney(Number(ride.finalFare ?? ride.estimatedFare ?? 0), ride.currency)}</TableCell>
              <TableCell>{ride.paymentStatus || "-"}</TableCell>
              <TableCell>{formatAge(ride.createdAt)}</TableCell>
              <TableCell><Chip size="small" label={ride.status} color={statusTone(ride.status)} variant="outlined" /></TableCell>
              <TableCell align="right"><Button size="small" onClick={() => navigate(`/admin/rides/${ride.id}`)} sx={{ textTransform: "none" }}>View</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
