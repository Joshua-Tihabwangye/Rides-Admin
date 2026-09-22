import React, { useMemo, useState, useEffect } from "react";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import BusinessIcon from "@mui/icons-material/Business";
import PaymentsIcon from "@mui/icons-material/Payments";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import PeriodSelector, { type PeriodOption } from "../components/PeriodSelector";
import {
  getAdminSystemOverview,
  getAdminOperationsAnalytics,
  getAdminFinanceAnalytics,
  getAdminMonitoringSnapshot,
  type AdminAnalyticsPeriod,
  type AdminFinanceAnalytics,
  type AdminMonitoringSnapshot,
  type AdminOperationsAnalytics,
} from "../services/api/adminApi";

const EV_GREEN = "#03cd8c";
const DELIVERY_PURPLE = "#8b5cf6";

function periodRange(period: PeriodOption, customRange: [Dayjs | null, Dayjs | null]) {
  const now = dayjs();
  if (period === "today") return { start: now.startOf("day").toISOString(), end: now.endOf("day").toISOString() };
  if (period === "7days") return { start: now.subtract(7, "day").startOf("day").toISOString(), end: now.endOf("day").toISOString() };
  if (period === "thisMonth") return { start: now.startOf("month").toISOString(), end: now.endOf("month").toISOString() };
  if (period === "thisYear") return { start: now.startOf("year").toISOString(), end: now.endOf("year").toISOString() };
  const [start, end] = customRange;
  return {
    start: start ? start.startOf("day").toISOString() : undefined,
    end: end ? end.endOf("day").toISOString() : undefined,
  };
}

export default function AdminHomeDashboardPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodOption>("today");
  const [customRange, setCustomRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [tripTrendFilter, setTripTrendFilter] = useState<"Rides" | "Deliveries" | "Both">("Both");
  const [overview, setOverview] = useState<{
    totals?: { users?: number; riders?: number; drivers?: number; companies?: number; trips?: number };
    queues?: { approvals?: number; riskCases?: number; safetyIncidents?: number };
  } | null>(null);
  const [operationsAnalytics, setOperationsAnalytics] = useState<AdminOperationsAnalytics | null>(null);
  const [financeAnalytics, setFinanceAnalytics] = useState<AdminFinanceAnalytics | null>(null);
  const [monitoringSnapshot, setMonitoringSnapshot] = useState<AdminMonitoringSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const range = useMemo(() => periodRange(period, customRange), [customRange, period]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [ov, ops, fin, monitoring] = await Promise.all([
          getAdminSystemOverview(),
          getAdminOperationsAnalytics({ period: period as AdminAnalyticsPeriod, start: range.start, end: range.end }),
          getAdminFinanceAnalytics({ period: period as AdminAnalyticsPeriod, start: range.start, end: range.end }),
          getAdminMonitoringSnapshot().catch(() => null),
        ]);
        if (!cancelled) {
          setOverview(ov);
          setOperationsAnalytics(ops);
          setFinanceAnalytics(fin);
          setMonitoringSnapshot(monitoring);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [period, range.end, range.start]);

  const kpis = useMemo(() => {
    const totals = overview?.totals;
    const tripsTotal = operationsAnalytics?.trips?.total;
    const onlineDrivers = monitoringSnapshot?.onlineDrivers ?? 0;
    const driverTotal = operationsAnalytics?.drivers?.total ?? totals?.drivers ?? 0;
    const offlineDrivers = monitoringSnapshot?.offlineDrivers ?? Math.max(0, driverTotal - onlineDrivers);
    const activeCompanies = totals?.companies ?? 0;
    const grossBookings = financeAnalytics?.grossEarnings ?? 0;

    return [
      {
        label: "Trips",
        value: tripsTotal == null ? "-" : tripsTotal.toLocaleString(undefined, { maximumFractionDigits: 0 }),
        helper: `${operationsAnalytics?.trips?.completed ?? 0} completed · ${operationsAnalytics?.trips?.active ?? 0} active`,
        icon: <DashboardIcon />,
        color: "#2563eb",
        onClick: () => navigate("/admin/ops"),
      },
      {
        label: "Online drivers",
        value: onlineDrivers.toLocaleString(),
        helper: `${driverTotal.toLocaleString()} total drivers`,
        icon: <DirectionsCarIcon />,
        color: EV_GREEN,
        onClick: () => navigate("/admin/monitoring"),
      },
      {
        label: "Offline drivers",
        value: offlineDrivers.toLocaleString(),
        helper: "No fresh heartbeat inside 15s",
        icon: <DirectionsCarIcon />,
        color: "#64748b",
        onClick: () => navigate("/admin/monitoring"),
      },
      {
        label: "Companies",
        value: activeCompanies.toLocaleString(),
        helper: `${overview?.queues?.approvals ?? 0} approvals pending`,
        icon: <BusinessIcon />,
        color: "#f59e0b",
        onClick: () => navigate("/admin/companies"),
      },
      {
        label: "Gross bookings",
        value: `UGX ${Number(grossBookings).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        helper: `${financeAnalytics?.earningsCount ?? 0} finance transactions`,
        icon: <PaymentsIcon />,
        color: "#8b5cf6",
        onClick: () => navigate("/admin/finance"),
      },
    ];
  }, [financeAnalytics, monitoringSnapshot, navigate, operationsAnalytics, overview]);

  const tripTrends = useMemo(() => {
    const hourly = operationsAnalytics?.hourly;
    if (!Array.isArray(hourly) || hourly.length === 0) return [];
    return hourly.map((row) => ({
      hour: row.time ?? "",
      rides: Number(row.rides ?? 0),
      deliveries: Number(row.deliveries ?? 0),
      bookings: Number(row.bookings ?? 0),
    }));
  }, [operationsAnalytics]);

  const alerts = useMemo(() => {
    const queues = overview?.queues;
    if (!queues) return [];
    const driverTotal = overview?.totals?.drivers ?? operationsAnalytics?.drivers?.total ?? 0;
    const driverOnline = monitoringSnapshot?.onlineDrivers ?? 0;
    const offlineDrivers = monitoringSnapshot?.offlineDrivers ?? Math.max(0, driverTotal - driverOnline);

    return [
      { text: "Company approvals pending", count: queues.approvals ?? 0, severity: "medium", path: "/admin/approvals", action: "Review approvals" },
      { text: "Offline drivers", count: offlineDrivers, severity: "low", path: "/admin/monitoring", action: "Open monitoring" },
      { text: "Safety incidents open", count: queues.safetyIncidents ?? 0, severity: "high", path: "/admin/safety", action: "Open safety" },
      { text: "Risk cases", count: queues.riskCases ?? 0, severity: "medium", path: "/admin/risk", action: "Review risk" },
    ];
  }, [monitoringSnapshot, operationsAnalytics, overview]);

  const safetyHighlights = useMemo(() => [
    { label: "Completed trips", value: operationsAnalytics?.trips?.completed ?? 0 },
    { label: "Drivers online", value: `${monitoringSnapshot?.onlineDrivers ?? 0} / ${operationsAnalytics?.drivers?.total ?? overview?.totals?.drivers ?? 0}` },
    { label: "Drivers offline", value: monitoringSnapshot?.offlineDrivers ?? Math.max(0, (operationsAnalytics?.drivers?.total ?? overview?.totals?.drivers ?? 0) - (monitoringSnapshot?.onlineDrivers ?? 0)) },
    { label: "Open incidents", value: overview?.queues?.safetyIncidents ?? 0 },
  ], [monitoringSnapshot, operationsAnalytics, overview]);

  const financeSnapshot = useMemo(() => [
    { label: "Gross bookings", value: `UGX ${Number(financeAnalytics?.grossEarnings ?? 0).toLocaleString()}` },
    { label: "Payout queue", value: `UGX ${Number(financeAnalytics?.payoutsPending ?? 0).toLocaleString()}` },
    { label: "Open approvals", value: overview?.queues?.approvals ?? 0 },
  ], [financeAnalytics, overview]);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", pb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <DashboardIcon sx={{ color: EV_GREEN }} />
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0 }}>Home Dashboard</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Live operations, finance, safety, and approval indicators from backend aggregates.
          </Typography>
        </Box>
        <PeriodSelector
          value={period}
          customStart={customRange[0]}
          customEnd={customRange[1]}
          onChange={(newPeriod, rangeValue) => {
            setPeriod(newPeriod);
            if (rangeValue) setCustomRange([rangeValue.start, rangeValue.end]);
          }}
        />
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(5, 1fr)" }, gap: 2, mb: 3 }}>
        {kpis.map((kpi) => (
          <MetricCard key={kpi.label} {...kpi} loading={loading} />
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.6fr 1fr" }, gap: 3, mb: 3 }}>
        <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)", overflow: "hidden" }}>
          <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Ride & Delivery Trends</Typography>
              <Typography variant="caption" color="text.secondary">
                Ride and delivery demand from {tripTrends.length} backend bucket{tripTrends.length === 1 ? "" : "s"}
              </Typography>
            </Box>
            <ToggleButtonGroup
              value={tripTrendFilter}
              exclusive
              onChange={(_event, newValue) => newValue && setTripTrendFilter(newValue)}
              size="small"
            >
              <ToggleButton value="Rides" sx={{ textTransform: "none" }}>Rides</ToggleButton>
              <ToggleButton value="Deliveries" sx={{ textTransform: "none" }}>Deliveries</ToggleButton>
              <ToggleButton value="Both" sx={{ textTransform: "none" }}>Both</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Divider />
          <Box sx={{ height: 320, p: 2 }}>
            {loading ? (
              <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}><CircularProgress size={28} /></Box>
            ) : tripTrends.length === 0 ? (
              <Box sx={{ height: "100%", display: "grid", placeItems: "center", color: "text.secondary", textAlign: "center" }}>
                <Typography variant="body2">Trend data is not available from the backend for this period yet.</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tripTrends} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tripGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={EV_GREEN} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={EV_GREEN} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="deliveryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={DELIVERY_PURPLE} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={DELIVERY_PURPLE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend />
                  {tripTrendFilter !== "Deliveries" ? (
                    <Area type="monotone" dataKey="rides" name="Rides" stroke={EV_GREEN} strokeWidth={2} fill="url(#tripGradient)" />
                  ) : null}
                  {tripTrendFilter !== "Rides" ? (
                    <Area type="monotone" dataKey="deliveries" name="Deliveries" stroke={DELIVERY_PURPLE} strokeWidth={2} fill="url(#deliveryGradient)" />
                  ) : null}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Card>

        <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)", overflow: "hidden" }}>
          <Box sx={{ px: 2, py: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <WarningAmberIcon sx={{ color: "#f59e0b" }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Alerts & Approvals</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">Admin queues needing attention</Typography>
          </Box>
          <Divider />
          <Stack spacing={1.25} sx={{ p: 2 }}>
            {alerts.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No alert data loaded.</Typography>
            ) : alerts.map((item) => (
              <Box
                key={item.text}
                onClick={() => navigate(item.path)}
                sx={{
                  display: "flex",
                  gap: 1.5,
                  alignItems: "flex-start",
                  border: "1px solid rgba(148,163,184,0.35)",
                  borderRadius: 1,
                  p: 1.25,
                  cursor: "pointer",
                  "&:hover": { borderColor: EV_GREEN, bgcolor: "action.hover" },
                }}
              >
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: severityColor(item.severity), mt: 0.75, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.text}</Typography>
                    <Chip size="small" label={item.count} sx={{ bgcolor: `${severityColor(item.severity)}18`, color: severityColor(item.severity), fontWeight: 800 }} />
                  </Stack>
                  <Button size="small" onClick={(event) => { event.stopPropagation(); navigate(item.path); }} sx={{ mt: 0.5, p: 0, minWidth: 0, textTransform: "none", color: EV_GREEN }}>
                    {item.action}
                  </Button>
                </Box>
              </Box>
            ))}
          </Stack>
        </Card>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" }, gap: 3 }}>
        <SummaryPanel
          title="Safety & Quality"
          icon={<HealthAndSafetyIcon />}
          items={safetyHighlights}
          actionLabel="Open safety"
          onAction={() => navigate("/admin/safety")}
        />
        <SummaryPanel
          title="Finance Snapshot"
          icon={<PaymentsIcon />}
          items={financeSnapshot}
          actionLabel="Open finance"
          onAction={() => navigate("/admin/finance")}
        />
      </Box>
    </Box>
  );
}

function severityColor(severity: string) {
  if (severity === "high") return "#ef4444";
  if (severity === "medium") return "#f59e0b";
  if (severity === "low") return "#64748b";
  return "#94a3b8";
}

function MetricCard({
  label,
  value,
  helper,
  icon,
  color,
  onClick,
  loading,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <Card elevation={1} onClick={onClick} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)", cursor: "pointer", "&:hover": { borderColor: color, boxShadow: "0 8px 24px rgba(15,23,42,0.08)" } }}>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ display: "grid", placeItems: "center", width: 42, height: 42, borderRadius: 1, bgcolor: `${color}18`, color }}>{icon}</Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: "uppercase" }}>{label}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.2 }}>{loading ? "-" : value}</Typography>
            <Typography variant="caption" color="text.secondary">{loading ? "Loading backend data" : helper}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SummaryPanel({
  title,
  icon,
  items,
  actionLabel,
  onAction,
}: {
  title: string;
  icon: React.ReactNode;
  items: Array<{ label: string; value: string | number }>;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)" }}>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ color: EV_GREEN }}>{icon}</Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{title}</Typography>
          </Stack>
          <Button size="small" onClick={onAction} sx={{ textTransform: "none", color: EV_GREEN }}>{actionLabel}</Button>
        </Stack>
        <Divider sx={{ mb: 1.5 }} />
        <Stack spacing={1}>
          {items.map((item) => (
            <Box key={item.label} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">{item.label}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>{item.value}</Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
