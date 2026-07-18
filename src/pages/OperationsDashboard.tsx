import React, { useState, useEffect, useMemo } from"react";
import { useNavigate } from"react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
} from"@mui/material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from"recharts";
import PeriodSelector, { PeriodOption } from '../components/PeriodSelector';
import dayjs from 'dayjs';
import { getAdminOperationsAnalytics, getAdminDashboard, getAdminRecentBookings } from '../services/api/adminApi';
import type { AdminOperationsAnalytics, AdminRecentBooking } from '../services/api/adminApi';

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

export default function OperationsDashboardPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodOption>('today');
  const [analytics, setAnalytics] = useState<AdminOperationsAnalytics | null>(null);
  const [dashboard, setDashboard] = useState<{ activeRides: number } | null>(null);
  const [recentRides, setRecentRides] = useState<AdminRecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, dashboardData, recentData] = await Promise.all([
        getAdminOperationsAnalytics({ period }),
        getAdminDashboard(),
        getAdminRecentBookings(50),
      ]);
      setAnalytics(analyticsData);
      setDashboard(dashboardData);
      const activeStatuses = ['searching', 'assigned', 'driver_en_route', 'arrived', 'active', 'in_progress'];
      const allRides = recentData?.rides ?? [];
      setRecentRides(allRides.filter((r) => activeStatuses.includes(String(r.status).toLowerCase())));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = window.setInterval(fetchAnalytics, 15000);
    return () => window.clearInterval(interval);
  }, [period]);

  const handlePeriodChange = (newPeriod: PeriodOption, range?: any) => {
    setPeriod(newPeriod);
  };

  const periodLabel =
    period === 'today'
      ? 'today'
      : period === '7days'
        ? 'last 7 days'
        : period === 'thisMonth'
          ? 'this month'
          : period === 'thisYear'
            ? 'this year'
            : 'custom range';

  const kpis = useMemo(() => {
    if (!analytics) return [];
    return [
      {
        label: 'Trips (Rides + Deliveries)',
        value: analytics.trips.total.toLocaleString(),
        subtitle: `${analytics.trips.completed} completed, ${dashboard?.activeRides ?? analytics.trips.active} active`,
        description: 'Total completed trip volume = rides + deliveries in the selected period.',
      },
      {
        label: 'Dispatches',
        value: analytics.dispatches.total.toLocaleString(),
        subtitle: `${analytics.dispatches.pending} pending`,
        description: 'Total dispatches created.',
      },
      {
        label: 'Online drivers',
        value: analytics.drivers.online.toString(),
        subtitle: `${analytics.drivers.total} total`,
        description: 'Number of drivers currently online/available.',
      },
    ];
  }, [analytics]);

  // Demand/supply and service-mix charts are shown only when the backend supplies
  // hourly / regional breakdowns. Static demo data has been removed.
  const demandSupplyData = useMemo(() => analytics?.hourly ?? [], [analytics]);
  const serviceMixData = useMemo(() => analytics?.regions ?? [], [analytics]);

  if (loading && !analytics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
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
          <Typography
            variant="h6"
            className="font-semibold tracking-tight"
            color="text.primary"
          >
            Operations Dashboard
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Real-time monitoring of operational KPIs and fleet performance.
          </Typography>
        </Box>
        <PeriodSelector value={period} onChange={handlePeriodChange} />
      </Box>

      {/* KPI row */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            elevation={1}
            sx={{
              border: "1px solid rgba(148,163,184,0.5)",
            }}
          >
            <CardContent className="p-3 flex flex-col gap-1">
              <Typography
                variant="caption"
                className="text-[11px] uppercase tracking-wide text-slate-500"
              >
                {kpi.label}
              </Typography>
              <Typography
                variant="h6"
                className="font-semibold text-lg"
              >
                {kpi.value}
              </Typography>
              <Typography
                variant="caption"
                className="text-[11px] text-emerald-500"
              >
                {kpi.subtitle}
              </Typography>
              <Typography
                variant="caption"
                className="text-[10px] text-slate-500 mt-1"
              >
                {kpi.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {recentRides.length > 0 && (
        <Card elevation={1} sx={{ border: "1px solid rgba(148,163,184,0.5)", mb: 4 }}>
          <CardContent className="p-4">
            <Box className="flex items-center justify-between mb-2">
              <Typography variant="subtitle2" className="font-semibold">
                Live active rides
              </Typography>
              <Chip size="small" label={`${recentRides.length} active`} sx={{ height: 20, fontSize: 10, bgcolor: '#03cd8c20', color: '#03cd8c' }} />
            </Box>
            <Divider className="!my-2" />
            <Box className="space-y-2">
              {recentRides.slice(0, 10).map((ride) => {
                const pickup = typeof ride.pickup === 'object' && ride.pickup ? (ride.pickup as Record<string, unknown>).address ?? ride.pickupAddress ?? '—' : ride.pickup ?? ride.pickupAddress ?? '—';
                const dropoff = typeof ride.destination === 'object' && ride.destination ? (ride.destination as Record<string, unknown>).address ?? ride.dropoffAddress ?? '—' : ride.destination ?? ride.dropoff ?? ride.dropoffAddress ?? '—';
                return (
                  <Box key={ride.id} className="flex items-center justify-between text-sm">
                    <Box>
                      <Typography variant="body2" className="font-semibold">{ride.id.slice(0, 8)}</Typography>
                      <Typography variant="caption" color="text.secondary">{String(pickup)} → {String(dropoff)}</Typography>
                    </Box>
                    <Chip size="small" label={ride.status} sx={{ height: 20, fontSize: 10 }} />
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      )}

      <Box className="flex flex-col lg:flex-row gap-4 mb-10">
        {/* Demand vs supply chart */}
        <Card
          elevation={1}
          sx={{
            flex: 2,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "linear-gradient(145deg, #0b1120, #020617)",
            color: "#e5e7eb",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2 h-[350px]">
            <Box className="flex items-center justify-between">
              <Typography
                variant="subtitle2"
                className="font-semibold text-slate-50"
              >
                Demand vs Supply ({periodLabel})
              </Typography>
              <Chip
                size="small"
                label="Rides & Deliveries"
                sx={{
                  fontSize: 10,
                  height: 22,
                  bgcolor: "#020617",
                  color: "#e5e7eb",
                }}
              />
            </Box>
            {demandSupplyData.length === 0 ? (
              <Box className="flex-1 flex items-center justify-center">
                <Typography variant="caption" className="text-[11px] text-slate-400">
                  Hourly demand/supply data is not available from the backend yet.
                </Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={demandSupplyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: "#e5e7eb" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="demand" stroke="#f77f00" strokeWidth={2} name="Demand (Trips)" />
                  <Line type="monotone" dataKey="supply" stroke="#03cd8c" strokeWidth={2} name="Supply (Drivers)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Cancellations & issues */}
        <Card
          elevation={1}
          sx={{
            flex: 1,
            border: "1px solid rgba(148,163,184,0.5)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Box className="flex items-center justify-between">
              <Typography
                variant="subtitle2"
                className="font-semibold"
              >
                Cancellations & issues
              </Typography>
              <Button
                size="small"
                variant="contained"
                onClick={() => navigate('/admin/ops?tab=queue')}
                sx={{
                  fontSize: 10,
                  textTransform: 'none',
                  bgcolor: EV_COLORS.primary,
                  '&:hover': { bgcolor: '#0fb589' },
                }}
              >
                Open queue
              </Button>
            </Box>
            <Typography
              variant="caption"
              className="text-[10px] text-slate-500 mb-1"
            >
              Turn metrics into action
            </Typography>
            <Divider className="!my-1" />
            <Box className="flex flex-col gap-2">
              <Typography variant="body2" className="text-[12px]">
                • Rider cancellations: —
              </Typography>
              <Typography variant="body2" className="text-[12px]">
                • Driver cancellations: —
              </Typography>
              <Typography variant="body2" className="text-[12px]">
                • Support tickets (24h): —
              </Typography>
            </Box>
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500 mt-1"
            >
              Cancellation and support metrics are not exposed by the backend yet.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Service mix chart */}
        <Card
          elevation={1}
          sx={{
            flex: 1,
            border: "1px solid rgba(148,163,184,0.5)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2 h-[300px]">
            <Typography
              variant="subtitle2"
              className="font-semibold"
            >
              Service Mix by Region
            </Typography>
            <Divider className="!my-1" />
            {serviceMixData.length === 0 ? (
              <Box className="flex-1 flex items-center justify-center">
                <Typography variant="caption" className="text-[11px] text-slate-500">
                  Regional service-mix data is not available from the backend yet.
                </Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceMixData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" fontSize={11} />
                  <YAxis dataKey="region" type="category" fontSize={11} width={60} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11, color: "#e5e7eb" }}
                  />
                  <Legend />
                  <Bar dataKey="rides" fill="#03cd8c" name="Rides" stackId="mix" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="deliveries" fill="#f77f00" name="Deliveries" stackId="mix" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
