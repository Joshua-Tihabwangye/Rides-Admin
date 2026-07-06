import React, { useState, useEffect, useMemo } from"react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
} from"@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from"recharts";
import { useNavigate } from"react-router-dom";
import DownloadIcon from"@mui/icons-material/Download";
import TableChartIcon from"@mui/icons-material/TableChart";
import ShowChartIcon from"@mui/icons-material/ShowChart";
import PeriodSelector from"../components/PeriodSelector";
import type { PeriodOption } from"../components/PeriodSelector";
import type { Dayjs } from"dayjs";
import { getAdminFinanceAnalytics, getAdminRevenueSummary, listAdminPayouts } from"../services/api/adminApi";
import type { AdminFinanceAnalytics, AdminRevenueSummary, AdminPayout } from"../services/api/adminApi";

const EV_COLORS = {
  primary:"#03cd8c",
  secondary:"#f77f00",
};

export default function FinancialOverviewPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodOption>("7days");
  const [customRange, setCustomRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [regionViewMode, setRegionViewMode] = useState<'table' | 'chart'>('table');
  const [analytics, setAnalytics] = useState<AdminFinanceAnalytics | null>(null);
  const [revenue, setRevenue] = useState<AdminRevenueSummary | null>(null);
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currencySymbol = useMemo(() => {
    const c = analytics?.currency || revenue?.currency || 'UGX';
    return c === 'UGX' ? 'USh' : c === 'USD' ? '$' : c;
  }, [analytics?.currency, revenue?.currency]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, rev, pendingPayouts] = await Promise.all([
        getAdminFinanceAnalytics({ period: period as any }),
        getAdminRevenueSummary({ period: period as any }).catch(() => null),
        listAdminPayouts({ status: 'pending', limit: 10 }).then(r => r.items).catch(() => []),
      ]);
      setAnalytics(data);
      setRevenue(rev);
      setPayouts(pendingPayouts);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load financial analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const handleExport = () => {
    if (!analytics) return;
    const netRevenue = Math.max(0, analytics.grossEarnings - analytics.payoutsPending);
    const csvContent = [
      ['Metric', 'Value'],
      ['Gross bookings', analytics.grossEarnings.toString()],
      ['Net revenue', netRevenue.toString()],
      ['Payouts (scheduled)', analytics.payoutsPending.toString()],
      ['Currency', analytics.currency],
      ['Pending payouts count', payouts.length.toString()],
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `financial_report_${period}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegionClick = (region: string) => {
    navigate(`/admin/reports?region=${encodeURIComponent(region)}&tab=financials`);
  };

  const kpis = useMemo(() => {
    if (!analytics) return [];
    const netRevenue = Math.max(0, analytics.grossEarnings - analytics.payoutsPending);
    return [
      {
        label: "Gross bookings",
        value: `${currencySymbol}${analytics.grossEarnings.toLocaleString()}`,
        subtitle: `${payouts.length} pending payouts`,
      },
      {
        label: "EVzone net revenue",
        value: `${currencySymbol}${netRevenue.toLocaleString()}`,
        subtitle: "Estimated gross less payout liability",
      },
      {
        label: "Payouts (scheduled)",
        value: `${currencySymbol}${analytics.payoutsPending.toLocaleString()}`,
        subtitle: "Next 7 days",
      },
    ];
  }, [analytics]);

  const serviceRevenueData = useMemo(() => {
    if (revenue?.byService?.length) {
      const palette = ["#03cd8c", "#f77f00", "#3b82f6", "#8b5cf6", "#ef4444", "#10b981"];
      return revenue.byService.map((s, i) => ({ name: s.serviceType, value: s.amount, color: palette[i % palette.length] }));
    }
    return [
      { name: "Rides", value: 82000, color: "#03cd8c" },
      { name: "Deliveries", value: 32000, color: "#f77f00" },
      { name: "Rental", value: 14420, color: "#3b82f6" },
    ];
  }, [revenue]);

  const regionLineData = useMemo(() => {
    const baseData = [
      { month: 'Jan', eastAfrica: 45000, westAfrica: 32000 },
      { month: 'Feb', eastAfrica: 52000, westAfrica: 38000 },
      { month: 'Mar', eastAfrica: 61000, westAfrica: 42000 },
      { month: 'Apr', eastAfrica: 58000, westAfrica: 45000 },
      { month: 'May', eastAfrica: 67000, westAfrica: 48000 },
      { month: 'Jun', eastAfrica: 74000, westAfrica: 54420 },
    ];
    let multiplier = 1;
    if (period === 'today') multiplier = 0.2;
    else if (period === '7days') multiplier = 1;
    else if (period === 'thisMonth') multiplier = 4;
    else if (period === 'thisYear') multiplier = 48;
    else if (period === 'custom') multiplier = 2.5;

    return baseData.map(d => ({
      ...d,
      eastAfrica: Math.round(d.eastAfrica * multiplier / 4),
      westAfrica: Math.round(d.westAfrica * multiplier / 4),
    }));
  }, [period]);

  if (loading) {
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
            Financial Overview
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Gross bookings, EVzone net revenue and payouts across services and regions.
          </Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <PeriodSelector
            value={period}
            onChange={(newPeriod, range) => {
              setPeriod(newPeriod);
              if (range) setCustomRange([range.start, range.end]);
            }}
            customStart={customRange[0]}
            customEnd={customRange[1]}
          />
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            size="small"
            onClick={handleExport}
            sx={{ borderRadius: 2, textTransform: 'none', height: 40 }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* KPI row */}
      <Box className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            elevation={2}
            sx={{
              borderRadius: 2,
              border: "1px solid rgba(148,163,184,0.3)",
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
                color="text.primary"
              >
                {kpi.value}
              </Typography>
              <Typography
                variant="caption"
                className="text-[11px]"
                sx={{ color: 'success.main' }}
              >
                {kpi.subtitle}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box className="flex flex-col lg:flex-row gap-4">
        {/* By service breakdown - Pie Chart */}
        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2 h-[350px]">
            <Typography
              variant="subtitle2"
              className="font-semibold"
              color="text.primary"
            >
              Revenue by service
            </Typography>
            <Divider className="!my-1" />
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceRevenueData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceRevenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11, color: "#f8fafc" }}
                  itemStyle={{ color: "#f8fafc" }}
                  formatter={(value) => `${currencySymbol}${value.toLocaleString()}`}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By region breakdown with toggle */}
        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2" sx={{ height: regionViewMode === 'chart' ? 350 : 'auto' }}>
            <Box className="flex items-center justify-between">
              <Box>
                <Typography
                  variant="subtitle2"
                  className="font-semibold"
                  color="text.primary"
                >
                  Revenue by region
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Click a region to view detailed reports.
                </Typography>
              </Box>
              <ToggleButtonGroup
                value={regionViewMode}
                exclusive
                onChange={(e, newMode) => newMode && setRegionViewMode(newMode)}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    padding: '4px 8px',
                    '&.Mui-selected': {
                      bgcolor: EV_COLORS.primary,
                      color: 'white',
                      '&:hover': {
                        bgcolor: '#02b87d',
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="table" aria-label="table view">
                  <TableChartIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="chart" aria-label="chart view">
                  <ShowChartIcon fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Divider className="!my-1" />

            {regionViewMode === 'table' ? (
              <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Region</TableCell>
                      <TableCell align="right">Gross</TableCell>
                      <TableCell align="right">Net</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleRegionClick('East Africa')}
                    >
                      <TableCell>East Africa</TableCell>
                      <TableCell align="right">${(74000).toLocaleString()}</TableCell>
                      <TableCell align="right">${(14200).toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleRegionClick('West Africa')}
                    >
                      <TableCell>West Africa</TableCell>
                      <TableCell align="right">${(54420).toLocaleString()}</TableCell>
                      <TableCell align="right">${(10480).toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ flex: 1, minHeight: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={regionLineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11, color: "#f8fafc" }}
                      labelStyle={{ color: "#f8fafc" }}
                      formatter={(value) => [`$${value.toLocaleString()}`, '']}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="eastAfrica"
                      stroke={EV_COLORS.primary}
                      strokeWidth={2}
                      name="East Africa"
                      dot={{ fill: EV_COLORS.primary, strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="westAfrica"
                      stroke={EV_COLORS.secondary}
                      strokeWidth={2}
                      name="West Africa"
                      dot={{ fill: EV_COLORS.secondary, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
