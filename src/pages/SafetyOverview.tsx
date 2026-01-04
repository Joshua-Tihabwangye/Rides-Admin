// @ts-nocheck
import React, { useState } from "react";
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

const INCIDENT_KPIS = [
  { label: "Total incidents", value: 18, note: "+3 vs yesterday" },
  { label: "Critical incidents", value: 1, note: "All handled" },
  { label: "SOS activations", value: 2, note: "0 unresolved" },
  { label: "Users under review", value: 7, note: "4 riders · 3 drivers" },
];

const INCIDENT_CITIES = [
  { city: "Kampala", region: "East Africa", incidents: 7 },
  { city: "Lagos", region: "West Africa", incidents: 5 },
  { city: "Nairobi", region: "East Africa", incidents: 3 },
  { city: "Accra", region: "West Africa", incidents: 3 },
];

const USERS_UNDER_REVIEW = [
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
    console.log('Safety period changed:', newPeriod);
  };

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

  const incidentData = [
    { type: "Accident", count: 8, color: "#ef4444" },
    { type: "Harassment", count: 4, color: "#f97316" },
    { type: "Lost Item", count: 3, color: "#3b82f6" },
    { type: "Dispute", count: 3, color: "#a855f7" },
  ];

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
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <PeriodSelector value={period} onChange={handlePeriodChange} />
        </Box>
      </Box>

      {/* KPI row */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {INCIDENT_KPIS.map((kpi) => (
          <Card
            key={kpi.label}
            elevation={2}
            sx={{
              borderRadius: 2,
              border: "1px solid rgba(148,163,184,0.3)",
              bgcolor: "background.paper"
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
                className="font-semibold text-lg" // Replaced text-slate-900 with global color
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
