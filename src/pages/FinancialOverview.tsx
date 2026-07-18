import React, { useState, useEffect, useMemo } from "react";
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
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import DownloadIcon from "@mui/icons-material/Download";
import PeriodSelector from "../components/PeriodSelector";
import type { PeriodOption } from "../components/PeriodSelector";
import type { Dayjs } from "dayjs";
import { getAdminFinanceAnalytics, getAdminRevenueSummary, listAdminPayouts } from "../services/api/adminApi";
import type { AdminFinanceAnalytics, AdminRevenueSummary, AdminPayout } from "../services/api/adminApi";

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

export default function FinancialOverviewPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodOption>("7days");
  const [customRange, setCustomRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [analytics, setAnalytics] = useState<AdminFinanceAnalytics | null>(null);
  const [revenue, setRevenue] = useState<AdminRevenueSummary | null>(null);
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currencySymbol = useMemo(() => {
    const c = analytics?.currency || revenue?.currency || "UGX";
    return c === "UGX" ? "USh" : c === "USD" ? "$" : c;
  }, [analytics?.currency, revenue?.currency]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, rev, pendingPayouts] = await Promise.all([
        getAdminFinanceAnalytics({ period: period as any }),
        getAdminRevenueSummary().catch(() => null),
        listAdminPayouts({ status: "pending", limit: 10 })
          .then((r) => r.items)
          .catch(() => []),
      ]);
      setAnalytics(data);
      setRevenue(rev);
      setPayouts(pendingPayouts);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load financial analytics");
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
      ["Metric", "Value"],
      ["Gross bookings", analytics.grossEarnings.toString()],
      ["Net revenue", netRevenue.toString()],
      ["Payouts (scheduled)", analytics.payoutsPending.toString()],
      ["Currency", analytics.currency],
      ["Pending payouts count", payouts.length.toString()],
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `financial_report_${period}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
  }, [analytics, payouts, currencySymbol]);

  const serviceRevenueData = useMemo(() => {
    if (revenue?.byService?.length) {
      const palette = ["#03cd8c", "#f77f00", "#3b82f6", "#8b5cf6", "#ef4444", "#10b981"];
      return revenue.byService.map((s, i) => ({
        name: s.serviceType,
        value: s.amount,
        color: palette[i % palette.length],
      }));
    }
    return [];
  }, [revenue]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
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
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Financial Overview
          </Typography>
          <Typography variant="caption" color="text.secondary">
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
            sx={{ borderRadius: 2, textTransform: "none", height: 40 }}
          >
            Export
          </Button>
        </Box>
      </Box>

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
              <Typography variant="caption" className="text-[11px] uppercase tracking-wide text-slate-500">
                {kpi.label}
              </Typography>
              <Typography variant="h6" className="font-semibold text-lg" color="text.primary">
                {kpi.value}
              </Typography>
              <Typography variant="caption" className="text-[11px]" sx={{ color: "success.main" }}>
                {kpi.subtitle}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box className="flex flex-col lg:flex-row gap-4">
        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2 h-[350px]">
            <Typography variant="subtitle2" className="font-semibold" color="text.primary">
              Revenue by service
            </Typography>
            <Divider className="!my-1" />
            {serviceRevenueData.length === 0 ? (
              <Box className="flex-1 flex items-center justify-center">
                <Typography variant="body2" color="text.secondary">
                  No service revenue data available
                </Typography>
              </Box>
            ) : (
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
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      fontSize: 11,
                      color: "#f8fafc",
                    }}
                    itemStyle={{ color: "#f8fafc" }}
                    formatter={(value) => `${currencySymbol}${value.toLocaleString()}`}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2 h-[350px]">
            <Typography variant="subtitle2" className="font-semibold" color="text.primary">
              Revenue by region
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Region breakdown is not available from the backend for this period.
            </Typography>
            <Divider className="!my-1" />
            <Box className="flex-1 flex items-center justify-center">
              <Typography variant="body2" color="text.secondary">
                No regional revenue data available
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
