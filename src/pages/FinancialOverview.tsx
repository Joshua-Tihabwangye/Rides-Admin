import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
  Typography,
} from "@mui/material";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import PeriodSelector from "../components/PeriodSelector";
import type { PeriodOption } from "../components/PeriodSelector";
import {
  getAdminAnalyticsCompanies,
  getAdminAnalyticsTimeseries,
  getAdminFinanceAnalytics,
  getAdminRevenueSummary,
  listAdminPayouts,
} from "../services/api/adminApi";
import type {
  AdminAnalyticsCompanyPoint,
  AdminAnalyticsTimeseriesPoint,
  AdminFinanceAnalytics,
  AdminPayout,
  AdminRevenueSummary,
} from "../services/api/adminApi";

const PALETTE = ["#03cd8c", "#f77f00", "#2563eb", "#8b5cf6", "#ef4444", "#14b8a6"];

type RangeQuery = { start: string; end: string };

function periodRange(period: PeriodOption, customRange: [Dayjs | null, Dayjs | null]): RangeQuery {
  const now = dayjs();
  if (period === "today") return { start: now.startOf("day").toISOString(), end: now.endOf("day").toISOString() };
  if (period === "7days") return { start: now.subtract(7, "day").startOf("day").toISOString(), end: now.endOf("day").toISOString() };
  if (period === "thisMonth") return { start: now.startOf("month").toISOString(), end: now.endOf("month").toISOString() };
  if (period === "thisYear") return { start: now.startOf("year").toISOString(), end: now.endOf("year").toISOString() };
  const [start, end] = customRange;
  if (start && end) return { start: start.startOf("day").toISOString(), end: end.endOf("day").toISOString() };
  return { start: now.subtract(7, "day").startOf("day").toISOString(), end: now.endOf("day").toISOString() };
}

function currencySymbol(currency?: string) {
  if (currency === "UGX") return "USh";
  if (currency === "USD") return "$";
  return currency || "UGX";
}

function formatMoney(value: number, currency?: string) {
  return `${currencySymbol(currency)} ${Number(value || 0).toLocaleString()}`;
}

function compactNumber(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value ?? 0);
}

function titleize(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function FinancialOverviewPage() {
  const [period, setPeriod] = useState<PeriodOption>("7days");
  const [customRange, setCustomRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [analytics, setAnalytics] = useState<AdminFinanceAnalytics | null>(null);
  const [revenue, setRevenue] = useState<AdminRevenueSummary | null>(null);
  const [timeseries, setTimeseries] = useState<AdminAnalyticsTimeseriesPoint[]>([]);
  const [companies, setCompanies] = useState<AdminAnalyticsCompanyPoint[]>([]);
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => periodRange(period, customRange), [period, customRange]);
  const currency = analytics?.currency || revenue?.currency || "UGX";

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [financeData, trendData, companyData, revenueData, pendingPayouts] = await Promise.all([
        getAdminFinanceAnalytics({ period, start: range.start, end: range.end }),
        getAdminAnalyticsTimeseries(period, { start: range.start, end: range.end }).catch(() => []),
        getAdminAnalyticsCompanies(period, { start: range.start, end: range.end }).catch(() => []),
        getAdminRevenueSummary({ from: range.start, to: range.end }).catch(() => null),
        listAdminPayouts({ status: "PENDING", limit: 10 }).then((r) => r.items).catch(() => []),
      ]);
      setAnalytics(financeData);
      setTimeseries(Array.isArray(trendData) ? trendData : []);
      setCompanies(Array.isArray(companyData) ? companyData : []);
      setRevenue(revenueData);
      setPayouts(Array.isArray(pendingPayouts) ? pendingPayouts : []);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load financial analytics");
      setAnalytics(null);
      setTimeseries([]);
      setCompanies([]);
      setRevenue(null);
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  }, [period, range]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const kpis = useMemo(() => {
    const grossEarnings = Number(analytics?.grossEarnings ?? 0);
    const payoutsPending = Number(analytics?.payoutsPending ?? 0);
    const netRevenue = Math.max(0, grossEarnings - payoutsPending);
    return [
      { label: "Gross bookings", value: formatMoney(grossEarnings, currency), helper: `${analytics?.earningsCount ?? 0} paid transaction${analytics?.earningsCount === 1 ? "" : "s"}`, tone: "#03cd8c" },
      { label: "Estimated net", value: formatMoney(netRevenue, currency), helper: "Gross bookings less pending payouts", tone: "#2563eb" },
      { label: "Pending payouts", value: formatMoney(payoutsPending, currency), helper: `${payouts.length} payout${payouts.length === 1 ? "" : "s"} awaiting processing`, tone: "#f77f00" },
    ];
  }, [analytics, currency, payouts.length]);

  const serviceRevenueData = useMemo(() => {
    const services = Array.isArray(revenue?.byService) ? revenue.byService : [];
    return services.map((service, index) => ({
      name: titleize(service.serviceType || "Unknown"),
      value: Number(service.amount ?? 0),
      color: PALETTE[index % PALETTE.length],
    }));
  }, [revenue]);

  const companyChartData = useMemo(
    () =>
      companies
        .slice(0, 8)
        .map((company) => ({ name: company.name, revenue: Number(company.payouts ?? 0), trips: company.trips }))
        .filter((company) => company.revenue > 0 || company.trips > 0),
    [companies],
  );

  const handleExport = () => {
    const csvContent = [
      ["Metric", "Value"],
      ["Gross bookings", String(analytics?.grossEarnings ?? 0)],
      ["Paid transactions", String(analytics?.earningsCount ?? 0)],
      ["Pending payouts", String(analytics?.payoutsPending ?? 0)],
      ["Currency", currency],
      ["Period start", range.start],
      ["Period end", range.end],
    ].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `financial_report_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 5 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0 }}>Financial Overview</Typography>
          <Typography variant="body2" color="text.secondary">Real booking revenue, payout exposure, service mix, and company performance from the backend.</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
          <PeriodSelector
            value={period}
            onChange={(newPeriod, rangeValue) => {
              setPeriod(newPeriod);
              if (rangeValue) setCustomRange([rangeValue.start, rangeValue.end]);
            }}
            customStart={customRange[0]}
            customEnd={customRange[1]}
          />
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => void fetchAnalytics()} sx={{ textTransform: "none", borderRadius: 999 }}>Refresh</Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport} sx={{ textTransform: "none", borderRadius: 999, bgcolor: "#03cd8c", "&:hover": { bgcolor: "#0fb589" } }}>Export</Button>
        </Stack>
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
        {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.5fr 1fr" }, gap: 3, mb: 3 }}>
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ height: 360 }}>
            <SectionTitle title="Revenue trend" subtitle={`${timeseries.length} database bucket${timeseries.length === 1 ? "" : "s"}`} />
            {timeseries.length === 0 ? <EmptyChart message="No paid ride revenue found for this period." /> : (
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={timeseries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="revenue" tickFormatter={(value) => compactNumber(Number(value))} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="transactions" orientation="right" tickFormatter={(value) => Number(value).toLocaleString()} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value, name) =>
                      name === "Transactions"
                        ? [Number(value).toLocaleString(), "Transactions"]
                        : [formatMoney(Number(value), currency), "Revenue"]
                    }
                  />
                  <Legend />
                  <Line yAxisId="revenue" type="monotone" dataKey="revenue" name="Revenue" stroke="#03cd8c" strokeWidth={3} dot={false} />
                  <Line yAxisId="transactions" type="monotone" dataKey="transactions" name="Transactions" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ height: 360 }}>
            <SectionTitle title="Service mix" subtitle="Revenue grouped by service" />
            {serviceRevenueData.length === 0 ? <EmptyChart message="No service revenue breakdown is available for this period." /> : (
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie data={serviceRevenueData} cx="50%" cy="48%" innerRadius={58} outerRadius={86} paddingAngle={3} dataKey="value">
                    {serviceRevenueData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(Number(value), currency)} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.4fr 1fr" }, gap: 3 }}>
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ height: 360 }}>
            <SectionTitle title="Company revenue" subtitle="Top companies/direct rider groups by completed ride revenue" />
            {companyChartData.length === 0 ? <EmptyChart message="No company revenue records found for this period." /> : (
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={companyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis tickFormatter={(value) => compactNumber(Number(value))} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatMoney(Number(value), currency)} />
                  <Bar dataKey="revenue" name="Revenue" fill="#03cd8c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Pending payout queue</Typography>
            <Typography variant="caption" color="text.secondary">Latest payout records awaiting action</Typography>
          </Box>
          <Divider />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Payout</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payouts.length === 0 ? <TableRow><TableCell colSpan={3} align="center" sx={{ py: 5 }}>No pending payouts.</TableCell></TableRow> : payouts.map((payout) => (
                  <TableRow key={payout.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{payout.id.slice(0, 8)}</Typography>
                      <Typography variant="caption" color="text.secondary">{payout.createdAt ? new Date(payout.createdAt).toLocaleString() : "-"}</Typography>
                    </TableCell>
                    <TableCell>{formatMoney(Number(payout.amount ?? 0), payout.currency || currency)}</TableCell>
                    <TableCell><Chip size="small" label={payout.status} color="warning" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
}

function KpiCard({ label, value, helper, tone }: { label: string; value: string; helper: string; tone: string }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: `${tone}66`, bgcolor: `${tone}0f` }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: "uppercase" }}>{label}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, my: 0.5 }}>{value}</Typography>
        <Typography variant="body2" color="text.secondary">{helper}</Typography>
      </CardContent>
    </Card>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{title}</Typography>
      <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
    </Box>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <Box sx={{ height: "85%", display: "flex", alignItems: "center", justifyContent: "center", color: "text.secondary", textAlign: "center", px: 3 }}>
      <Typography variant="body2">{message}</Typography>
    </Box>
  );
}
