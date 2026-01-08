// @ts-nocheck
import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// A2 – Admin Home / Global Dashboard (v2, tighter card corners)
// Route: /admin or /admin/home

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};


import { useNavigate } from "react-router-dom";
import PeriodSelector from "../components/PeriodSelector";

export default function AdminHomeDashboardPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("today");
  const [tripTrendFilter, setTripTrendFilter] = useState<"Rides" | "Delivery" | "Both">("Both");

  const periodMultiplier: Record<string, number> = {
    today: 0.25,
    "7days": 0.6,
    "30days": 1,
    thisMonth: 1.1,
    custom: 0.8,
  };

  const kpis = useMemo(() => {
    const m = periodMultiplier[period] ?? 1;
    return [
      {
        label: "Trips",
        value: (1248 * m).toLocaleString(undefined, { maximumFractionDigits: 0 }),
        trend: m >= 1 ? "+12% vs previous period" : "Softer vs previous period",
        onClick: () => navigate("/admin/ops"),
        subtitle: "Selected period",
      },
      {
        label: "Active drivers",
        value: Math.round(342 * m).toLocaleString(),
        trend: `${Math.round(82 * m)}% utilisation`,
        onClick: () => navigate("/admin/drivers"),
        subtitle: "Online now",
      },
      {
        label: "Active companies",
        value: Math.round(57 * m).toString(),
        trend: m >= 1 ? "+4 new this period" : "Stable vs previous period",
        onClick: () => navigate("/admin/companies"),
        subtitle: "Company approvals / active companies list",
      },
      {
        label: "Gross bookings",
        value: `$${Math.round(18420 * m).toLocaleString()}`,
        trend: m >= 1 ? "+9% vs previous period" : "Flat vs previous period",
        onClick: () => navigate("/admin/finance"),
        subtitle: "Finance report view",
      },
    ];
  }, [period, navigate]);

  const tripTrends = useMemo(() => {
    const m = periodMultiplier[period] ?? 1;
    const base = [
      { hour: "6AM", rides: 30, deliveries: 15, bookings: 1200 },
      { hour: "8AM", rides: 104, deliveries: 52, bookings: 3800 },
      { hour: "10AM", rides: 132, deliveries: 66, bookings: 4500 },
      { hour: "12PM", rides: 147, deliveries: 73, bookings: 5200 },
      { hour: "2PM", rides: 119, deliveries: 59, bookings: 4100 },
      { hour: "4PM", rides: 156, deliveries: 78, bookings: 5600 },
      { hour: "6PM", rides: 178, deliveries: 89, bookings: 6300 },
      { hour: "8PM", rides: 97, deliveries: 48, bookings: 3400 },
      { hour: "10PM", rides: 52, deliveries: 26, bookings: 1800 },
    ];
    return base.map((row) => {
      const rides = Math.round(row.rides * m);
      const deliveries = Math.round(row.deliveries * m);
      let trips = 0;
      if (tripTrendFilter === "Rides") {
        trips = rides;
      } else if (tripTrendFilter === "Delivery") {
        trips = deliveries;
      } else {
        trips = rides + deliveries;
      }
      return {
        ...row,
        rides,
        deliveries,
        trips,
        bookings: Math.round(row.bookings * m),
      };
    });
  }, [period, tripTrendFilter]);

  const [alerts] = useState([
    { text: "Company approvals pending", count: 6, severity: "medium", path: "/admin/approvals", action: "Review approvals" },
    { text: "Drivers awaiting document re-check", count: 14, severity: "low", path: "/admin/drivers?tab=review", action: "Review approvals" },
    { text: "High severity incidents open", count: 3, severity: "high", path: "/admin/safety", action: "Open incident queue" },
    { text: "Region with abnormal cancellation spike", count: 1, severity: "medium", path: "/admin/ops", action: "View region" },
  ]);

  const [safetyHighlights] = useState([
    "Avg rider rating: 4.83",
    "Safety incidents: 5 (0 critical)",
    "SOS activations today: 1",
  ]);

  const [financeSnapshot] = useState([
    "EVzone share today: $4,980",
    "Payouts scheduled this week: $21,300",
    "Top city by revenue: Kampala",
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "#ef4444";
      case "medium": return "#f77f00";
      case "low": return "#facc15";
      default: return "#94a3b8";
    }
  };

  return (
    <Box>
      {/* Page title header */}
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography
            variant="h6"
            className="font-semibold tracking-tight"
            color="text.primary"
          >
            Home · Global Dashboard
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Daily overview of Rides & Logistics performance across all regions.
          </Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <PeriodSelector value={period} onChange={(newPeriod) => setPeriod(newPeriod)} />
        </Box>
      </Box>

      {/* KPI cards with reduced corner radius */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {kpis.map((kpi, index) => (
          <Card
            key={kpi.label}
            elevation={2}
            onClick={kpi.onClick}
            sx={{
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
                borderColor: EV_COLORS.primary,
              },
              border: index === 0
                ? `1px solid ${EV_COLORS.primary}44`
                : index === 1
                  ? `1px solid ${EV_COLORS.secondary}44`
                  : "1px solid rgba(148,163,184,0.45)",
              background:
                index === 0
                  ? "linear-gradient(145deg, #ecfdf5, #f0fdf4)"
                  : index === 1
                    ? "linear-gradient(145deg, #fff7ed, #fffbeb)"
                    : "linear-gradient(145deg, #ffffff, #f9fafb)",
            }}
          >
            <CardContent className="p-4 flex flex-col gap-2">
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
                className="text-[11px] text-emerald-600"
              >
                {kpi.trend}
              </Typography>
              {kpi.subtitle && (
                <Typography
                  variant="caption"
                  className="text-[10px] text-slate-500 mt-1"
                >
                  {kpi.subtitle}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box className="flex flex-col lg:flex-row gap-4 mb-4">
        {/* Operations map placeholder */}
        <Card
          elevation={2}
          sx={{
            flex: 2,
            minHeight: 260,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.45)",
            background: "linear-gradient(145deg, #0b1120, #020617)",
            color: "#e5e7eb",
            transition: 'box-shadow 0.2s',
            '&:hover': {
              boxShadow: 4,
            }
          }}
        >
          <CardContent className="p-4 h-full flex flex-col gap-2">
            <Box className="flex items-center justify-between flex-wrap gap-2">
              <Typography
                variant="subtitle2"
                className="font-semibold text-slate-50"
              >
                Trip Trends
              </Typography>
              <Box className="flex items-center gap-2 flex-wrap">
                <ToggleButtonGroup
                  value={tripTrendFilter}
                  exclusive
                  onChange={(e, newValue) => newValue && setTripTrendFilter(newValue)}
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      fontSize: 10,
                      padding: '4px 8px',
                      color: '#94a3b8',
                      borderColor: '#334155',
                      '&.Mui-selected': {
                        bgcolor: EV_COLORS.primary,
                        color: '#020617',
                        '&:hover': {
                          bgcolor: EV_COLORS.primary,
                        },
                      },
                    },
                  }}
                >
                  <ToggleButton value="Rides">Rides</ToggleButton>
                  <ToggleButton value="Delivery">Delivery</ToggleButton>
                  <ToggleButton value="Both">Both</ToggleButton>
                </ToggleButtonGroup>
                <PeriodSelector
                  value={period}
                  onChange={(newPeriod) => setPeriod(newPeriod)}
                />
              </Box>
            </Box>
            <Box sx={{ flex: 1, minHeight: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tripTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tripGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#03cd8c" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#03cd8c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#334155" />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#334155" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: "#e5e7eb" }}
                    itemStyle={{ color: "#03cd8c" }}
                  />
                  <Area type="monotone" dataKey="trips" stroke="#03cd8c" strokeWidth={2} fill="url(#tripGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Alerts & approvals */}
        <Card
          elevation={2}
          sx={{
            flex: 1,
            minHeight: 260,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.45)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 h-full flex flex-col">
            <Box className="flex items-center justify-between mb-1">
              <Typography
                variant="subtitle2"
                className="font-semibold"
                color="text.primary"
              >
                Alerts & approvals
              </Typography>
              <Button
                size="small"
                onClick={() => navigate("/admin/approvals")}
                sx={{ fontSize: 10, minWidth: 'auto', textTransform: 'none' }}
              >
                View all
              </Button>
            </Box>
            <Typography
              variant="caption"
              className="text-[11px] mb-2"
              color="text.secondary"
            >
              Items that may need Admin attention.
            </Typography>
            <Box className="flex flex-col gap-2 text-[12px] flex-1">
              {alerts.map((item) => (
                <Box
                  key={item.text}
                  onClick={() => navigate(item.path)}
                  className="flex items-start gap-2 rounded-md px-2 py-2 cursor-pointer transition-colors"
                  sx={{ 
                    '&:hover': { bgcolor: 'action.hover' },
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: getSeverityColor(item.severity),
                      mt: "4px",
                      flexShrink: 0,
                    }}
                  />
                  <Box className="flex-1">
                    <Box className="flex items-center gap-2 mb-1">
                      <Typography variant="body2" className="text-[12px] font-medium" color="text.primary">
                        {item.text}
                      </Typography>
                      <Chip
                        label={item.count}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: 9,
                          bgcolor: getSeverityColor(item.severity) + '20',
                          color: getSeverityColor(item.severity),
                        }}
                      />
                    </Box>
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                      sx={{
                        fontSize: 9,
                        textTransform: 'none',
                        padding: '2px 8px',
                        minWidth: 'auto',
                        color: EV_COLORS.primary,
                      }}
                    >
                      {item.action}
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card >
      </Box >

      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Safety highlights */}
        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.45)",
            // background: "linear-gradient(145deg, #eff6ff, #eef2ff)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography
              variant="subtitle2"
              className="font-semibold"
              color="text.primary"
            >
              Safety & quality
            </Typography>
            <Divider className="!my-1" />
            <Box className="flex flex-col gap-1">
              {safetyHighlights.map((item) => (
                <Typography
                  key={item}
                  variant="body2"
                  className="text-[12px]"
                  color="text.primary"
                >
                  • {item}
                </Typography>
              ))}
            </Box>
            <Box className="mt-2 pt-2 border-t border-divider">
              <Typography variant="caption" className="text-[10px] text-slate-500">
                Key metrics: Ratings, incidents, SOS activations
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Finance snapshot */}
        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.45)",
            // background: "linear-gradient(145deg, #fefce8, #fffbeb)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography
              variant="subtitle2"
              className="font-semibold"
              color="text.primary"
            >
              Finance snapshot
            </Typography>
            <Divider className="!my-1" />
            {financeSnapshot.map((item) => (
              <Typography
                key={item}
                variant="body2"
                className="text-[12px]"
                color="text.primary"
              >
                • {item}
              </Typography>
            ))}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
