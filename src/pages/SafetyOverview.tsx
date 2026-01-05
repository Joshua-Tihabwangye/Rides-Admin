// @ts-nocheck
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import PeriodSelector, { PeriodOption } from '../components/PeriodSelector';

const BASE_INCIDENT_KPIS = [
  { label: "Total incidents", value: 18, note: "+3 vs previous period" },
  { label: "Critical incidents", value: 1, note: "All handled" },
  { label: "SOS activations", value: 2, note: "0 unresolved" },
  { label: "Users under review", value: 7, note: "4 riders · 3 drivers" },
];

const BASE_INCIDENT_CITIES = [
  { city: "Kampala", region: "East Africa", incidents: 7 },
  { city: "Lagos", region: "West Africa", incidents: 5 },
  { city: "Nairobi", region: "East Africa", incidents: 3 },
  { city: "Accra", region: "West Africa", incidents: 3 },
];

const BASE_USERS_UNDER_REVIEW = [
  {
    id: 1,
    name: "John Okello",
    type: "Rider",
    city: "Kampala",
    reason: "Multiple low ratings",
  },
  {
    id: 2,
    name: "Michael Driver",
    type: "Driver",
    city: "Kampala",
    reason: "High cancellation rate",
  },
  {
    id: 3,
    name: "Samuel K.",
    type: "Rider",
    city: "Lagos",
    reason: "Refund disputes",
  },
];

export default function SafetyOverviewDashboardPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodOption>('today');

  const handlePeriodChange = (newPeriod: PeriodOption) => {
    setPeriod(newPeriod);
  };

  const periodMultiplier: Record<PeriodOption, number> = {
    today: 0.25,
    '7days': 0.6,
    '30days': 1,
    thisMonth: 1.1,
    custom: 0.8,
  };

  const INCIDENT_KPIS = useMemo(() => {
    const m = periodMultiplier[period] ?? 1;
    return BASE_INCIDENT_KPIS.map((kpi) => {
      if (kpi.label === "Total incidents") {
        return { ...kpi, value: Math.max(1, Math.round(18 * m)) };
      }
      if (kpi.label === "Critical incidents") {
        return { ...kpi, value: Math.max(0, Math.round(1 * m)) };
      }
      if (kpi.label === "SOS activations") {
        return { ...kpi, value: Math.max(0, Math.round(2 * m)) };
      }
      if (kpi.label === "Users under review") {
        return { ...kpi, value: Math.max(0, Math.round(7 * m)) };
      }
      return kpi;
    });
  }, [period]);

  const handleUserClick = (user) => {
    // Navigate to rider or driver management based on type
    if (user.type === 'Driver') {
      navigate('/admin/drivers?tab=review');
    } else {
      navigate('/admin/riders?tab=review');
    }
  };

  const handleSeeMoreIncidents = () => {
    navigate("/admin/risk");
  };

  const handleCityClick = (city: string) => {
    navigate(`/admin/risk?city=${city}`);
  }

  const incidentData = useMemo(() => {
    const m = periodMultiplier[period] ?? 1;
    return [
      { type: "Accident", count: Math.max(0, Math.round(8 * m)), color: "#ef4444" },
      { type: "Harassment", count: Math.max(0, Math.round(4 * m)), color: "#f97316" },
      { type: "Lost Item", count: Math.max(0, Math.round(3 * m)), color: "#3b82f6" },
      { type: "Dispute", count: Math.max(0, Math.round(3 * m)), color: "#a855f7" },
    ];
  }, [period]);

  const INCIDENT_CITIES = useMemo(
    () =>
      BASE_INCIDENT_CITIES.map((city) => {
        const m = periodMultiplier[period] ?? 1;
        return { ...city, incidents: Math.max(0, Math.round(city.incidents * m)) };
      }),
    [period],
  );

  const USERS_UNDER_REVIEW = useMemo(() => BASE_USERS_UNDER_REVIEW, []);

  return (
    <Box>
      {/* Header / Title */}
      <Box className="pb-4 flex items-center justify-between gap-2 flex-wrap">
        <Box>
          <Typography
            variant="h6"
            className="font-semibold tracking-tight"
            color="text.primary"
          >
            Safety Overview
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Incidents, SOS activity and users under review across all regions.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* Categories in dropdowns as requested */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value="All Regions"
              displayEmpty
              sx={{ fontSize: 12, borderRadius: 2, bgcolor: 'background.paper', height: 40 }}
            >
              <MenuItem value="All Regions">All Regions</MenuItem>
              <MenuItem value="East Africa">East Africa</MenuItem>
              <MenuItem value="West Africa">West Africa</MenuItem>
            </Select>
          </FormControl>
          <PeriodSelector value={period} onChange={handlePeriodChange} />
        </Box>
      </Box>

      {/* KPI row */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {INCIDENT_KPIS.map((kpi) => (
          <Card
            key={kpi.label}
            elevation={2}
            onClick={() => navigate('/admin/risk')}
            sx={{
              borderRadius: 2,
              border: "1px solid rgba(148,163,184,0.3)",
              bgcolor: "background.paper",
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
                borderColor: 'primary.main',
              }
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
                className="text-[11px] text-amber-700"
              >
                {kpi.note}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box className="flex flex-col lg:flex-row gap-4 mb-4">
        {/* Incident distribution card */}
        <Card
          elevation={2}
          sx={{
            flex: 2,
            borderRadius: 2,
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
                Incident Distribution
              </Typography>
              <Button
                variant="text"
                size="small"
                sx={{ textTransform: "none", fontSize: 11, color: "#93c5fd" }}
                onClick={handleSeeMoreIncidents}
              >
                See full incidents
              </Button>
            </Box>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incidentData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                <XAxis type="number" fontSize={11} stroke="#94a3b8" />
                <YAxis dataKey="type" type="category" fontSize={11} stroke="#94a3b8" width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: "#e5e7eb" }}
                />
                <Bar dataKey="count" name="Incidents" radius={[0, 4, 4, 0]}>
                  {incidentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Incidents by city */}
        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography
              variant="subtitle2"
              className="font-semibold"
              color="text.primary"
            >
              Incidents by city
            </Typography>
            <Divider className="!my-1" />
            <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>City</TableCell>
                    <TableCell>Region</TableCell>
                    <TableCell align="right">Incidents</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {INCIDENT_CITIES.map((row) => (
                    <TableRow
                      key={row.city}
                      hover
                      onClick={() => handleCityClick(row.city)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{row.city}</TableCell>
                      <TableCell>{row.region}</TableCell>
                      <TableCell align="right">{row.incidents}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Users under review */}
        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography
              variant="subtitle2"
              className="font-semibold"
              color="text.primary"
            >
              Users under review
            </Typography>
            <Divider className="!my-1" />
            <Box className="flex flex-col gap-2 text-[12px] text-slate-800">
              {USERS_UNDER_REVIEW.map((u) => (
                <Box
                  key={u.id}
                  className="flex flex-col rounded-md px-2 py-1 hover:bg-black/5 cursor-pointer"
                  onClick={() => handleUserClick(u)}
                >
                  <Box className="flex items-center justify-between">
                    <span className="font-medium">{u.name}</span>
                    <Chip
                      size="small"
                      label={u.type}
                      sx={{ fontSize: 10, height: 20 }}
                    />
                  </Box>
                  <span className="text-[11px] text-slate-600">
                    {u.city} · {u.reason}
                  </span>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Notes / playbook */}
        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography
              variant="subtitle2"
              className="font-semibold"
              color="text.primary"
            >
              Safety playbook (notes)
            </Typography>
            <Divider className="!my-1" />
            <Typography
              variant="body2"
              className="text-[12px] text-slate-700"
            >
              • Critical incidents must be acknowledged within 5 minutes and
              fully handled within 24 hours.
            </Typography>
            <Typography
              variant="body2"
              className="text-[12px] text-slate-700"
            >
              • Drivers flagged by the system (high cancellations, repeated
              complaints) should be routed through retraining before
              reactivation.
            </Typography>
            <Typography
              variant="body2"
              className="text-[12px] text-slate-700"
            >
              • Riders exhibiting abuse or fraud patterns should be escalated to
              risk for review and possible ban.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
