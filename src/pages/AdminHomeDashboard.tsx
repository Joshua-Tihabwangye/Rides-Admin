// @ts-nocheck
import React, { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  LineChart,
  Line,
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
// Establishes AdminMainLayout, navigation, theming and the main dashboard.
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - AppBar shows EVZONE ADMIN brand, Home/Profile/Search nav, global search,
//      and a Light theme toggle.
//    - Dashboard shows 4 KPI cards, an operations heatmap card, an Alerts
//      card, and Safety/Finance cards. Card corners should be gently rounded
//      (radius ~8–10px), not fully pill-shaped.
// 2) Theme toggle
//    - Toggle to Dark; expect background, AppBar and cards to shift to darker
//      palettes while content remains readable and layout unchanged.
//    - Toggle back to Light; no loss of state.
// 3) Global search
//    - Type a term and submit; expect a console log placeholder.
// 4) Nav buttons
//    - Home appears active; Profile/Search just log to console (ready for
//      router wiring).
// 5) Responsiveness
//    - KPI cards stack on mobile, become 2x2 grid on sm+.

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};


import { useNavigate } from "react-router-dom";
import PeriodSelector from "../components/PeriodSelector";

export default function AdminHomeDashboardPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("today");

  const [kpis] = useState([
    { label: "Trips today", value: "1,248", trend: "+12% vs yesterday" },
    { label: "Active drivers now", value: "342", trend: "82% utilisation" },
    { label: "Active companies", value: "57", trend: "+4 new this week" },
    { label: "Gross bookings", value: "$18,420", trend: "+9% vs last week" },
  ]);

  const [tripTrends] = useState([
    { hour: "6AM", trips: 45, bookings: 1200 },
    { hour: "8AM", trips: 156, bookings: 3800 },
    { hour: "10AM", trips: 198, bookings: 4500 },
    { hour: "12PM", trips: 220, bookings: 5200 },
    { hour: "2PM", trips: 178, bookings: 4100 },
    { hour: "4PM", trips: 234, bookings: 5600 },
    { hour: "6PM", trips: 267, bookings: 6300 },
    { hour: "8PM", trips: 145, bookings: 3400 },
    { hour: "10PM", trips: 78, bookings: 1800 },
  ]);

  const [alerts] = useState([
    { text: "6 company approvals pending", path: "/admin/approvals" },
    { text: "14 drivers awaiting document re-check", path: "/admin/drivers?tab=review" },
    { text: "3 high severity incidents open", path: "/admin/safety" },
    { text: "1 region with abnormal cancellation spike", path: "/admin/ops" },
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
        <Chip
          size="small"
          label="Today"
          sx={{
            bgcolor: "background.paper", // Default or specific color
            border: "1px solid",
            borderColor: "divider",
            fontSize: 10,
          }}
        />
      </Box>

      {/* KPI cards with reduced corner radius */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {kpis.map((kpi, index) => (
          <Card
            key={kpi.label}
            elevation={2}
            sx={{
              borderRadius: 2,
              border: index === 0
                ? `1px solid ${EV_COLORS.primary}44`
                : index === 1
                  ? `1px solid ${EV_COLORS.secondary}44`
                  : "1px solid rgba(148,163,184,0.45)",
              // Use sx prop for dynamic background if needed, or stick to simple colors
              // background: ... (keeping complex gradients as they are specific to this dashboard's look)
              background:
                index === 0
                  ? "linear-gradient(145deg, #ecfdf5, #f0fdf4)"
                  : index === 1
                    ? "linear-gradient(145deg, #fff7ed, #fffbeb)"
                    : "linear-gradient(145deg, #ffffff, #f9fafb)",
              // Ensure dark mode compatibility if possible, or leave as is if these are specific "light" colors
              // Ideally these gradients should adapt to dark mode too.
              // For now, I will keep them as requested, but I should probably check if isDark is available or just let theme handle it?
              // The original code used fixed colors. I will assume these are fine for now or add comments.
              // Actually, let's try to make them theme-aware using 'bgcolor'.
              // But gradients are hard to map. I'll leave them for now to preserve the specific look.
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
          }}
        >
          <CardContent className="p-4 h-full flex flex-col gap-2">
            <Box className="flex items-center justify-between">
              <Typography
                variant="subtitle2"
                className="font-semibold text-slate-50"
              >
                Trip Trends Today
              </Typography>
              <Box className="flex items-center gap-1">
                <PeriodSelector
                  value={period}
                  onChange={(newPeriod) => setPeriod(newPeriod)}
                />
                <Chip
                  size="small"
                  label="Rides & Delivery"
                  sx={{
                    fontSize: 10,
                    height: 22,
                    bgcolor: EV_COLORS.primary,
                    color: "#020617",
                  }}
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
            <Typography
              variant="subtitle2"
              className="font-semibold mb-1"
              color="text.primary"
            >
              Alerts & approvals
            </Typography>
            <Typography
              variant="caption"
              className="text-[11px] mb-2"
              color="text.secondary"
            >
              Items that may need Admin attention.
            </Typography>
            <Box className="flex flex-col gap-1 text-[12px]">
              {alerts.map((item) => (
                <Box
                  key={item.text}
                  onClick={() => navigate(item.path)}
                  className="flex items-start gap-2 rounded-md px-2 py-1 cursor-pointer transition-colors"
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <Box
                    component="span"
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "4px",
                      bgcolor: "#facc15",
                      mt: "6px",
                    }}
                  />
                  <Typography variant="body2" className="text-[12px]" color="text.primary">
                    {item.text}
                  </Typography>
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
          </CardContent>
        </Card>

        {/* Finance snapshot */}
        <Card
          elevation={2}
          sx={{
            flex: 1,
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
