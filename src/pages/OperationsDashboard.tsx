// @ts-nocheck
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
} from "@mui/material";
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
} from "recharts";
import PeriodSelector, { PeriodOption } from '../components/PeriodSelector';
import dayjs from 'dayjs';

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};



export default function OperationsDashboardPage() {
  const [period, setPeriod] = useState<PeriodOption>('today');

  const handlePeriodChange = (newPeriod: PeriodOption, range?: any) => {
    setPeriod(newPeriod);
    console.log('Ops period changed:', newPeriod, range);
  };

  const kpis = [
    {
      label: "Trips (rides + deliveries)",
      value: "1,742",
      subtitle: "+9% vs yesterday",
    },
    {
      label: "Completion rate",
      value: "96.8%",
      subtitle: "Target ≥ 95%",
    },
    {
      label: "Avg wait time",
      value: "5.2 min",
      subtitle: "Peak: 7.4 min",
    },
    {
      label: "Online drivers",
      value: "412",
      subtitle: "EV utilisation 88%",
    },
  ];

  const demandSupplyData = [
    { time: '6AM', demand: 45, supply: 60 },
    { time: '8AM', demand: 156, supply: 140 },
    { time: '10AM', demand: 198, supply: 180 },
    { time: '12PM', demand: 220, supply: 200 },
    { time: '2PM', demand: 178, supply: 190 },
    { time: '4PM', demand: 234, supply: 210 },
    { time: '6PM', demand: 267, supply: 240 },
    { time: '8PM', demand: 145, supply: 160 },
    { time: '10PM', demand: 78, supply: 100 },
  ];

  const serviceMixData = [
    { region: 'Kampala', rides: 840, deliveries: 420 },
    { region: 'Nairobi', rides: 650, deliveries: 380 },
    { region: 'Lagos', rides: 920, deliveries: 510 },
    { region: 'Accra', rides: 480, deliveries: 220 },
  ];

  return (
    <Box>
      {/* Title */}
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
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            elevation={1}
            sx={{
              border: "1px solid rgba(148,163,184,0.5)",
              background: "linear-gradient(145deg, #ffffff, #f9fafb)",
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
                className="font-semibold text-slate-900 text-lg"
              >
                {kpi.value}
              </Typography>
              <Typography
                variant="caption"
                className="text-[11px] text-emerald-700"
              >
                {kpi.subtitle}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box className="flex flex-col lg:flex-row gap-4">
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
                Demand vs Supply (Real-time)
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
          </CardContent>
        </Card>

        {/* Cancellations & issues */}
        <Card
          elevation={1}
          sx={{
            flex: 1,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "linear-gradient(145deg, #fef2f2, #ffffff)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography
              variant="subtitle2"
              className="font-semibold text-slate-900"
            >
              Cancellations & issues
            </Typography>
            <Divider className="!my-1" />
            <Typography
              variant="body2"
              className="text-[12px] text-slate-800"
            >
              • Rider cancellations: 4.1% (target ≤ 5%)
            </Typography>
            <Typography
              variant="body2"
              className="text-[12px] text-slate-800"
            >
              • Driver cancellations: 3.3% (watchlist over 7%)
            </Typography>
            <Typography
              variant="body2"
              className="text-[12px] text-slate-800"
            >
              • Support tickets (last 24h): 32 (3 critical)
            </Typography>
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500 mt-1"
            >
              Use these metrics together with Safety & Risk to spot regions
              needing intervention.
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
            background: "linear-gradient(145deg, #eef2ff, #ffffff)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2 h-[300px]">
            <Typography
              variant="subtitle2"
              className="font-semibold text-slate-900"
            >
              Service Mix by Region
            </Typography>
            <Divider className="!my-1" />
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceMixData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" fontSize={11} />
                <YAxis dataKey="region" type="category" fontSize={11} width={60} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11 }}
                />
                <Legend />
                <Bar dataKey="rides" fill="#03cd8c" name="Rides" stackId="mix" radius={[0, 4, 4, 0]} />
                <Bar dataKey="deliveries" fill="#f77f00" name="Deliveries" stackId="mix" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Region highlights */}
        <Card
          elevation={1}
          sx={{
            flex: 1,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "linear-gradient(145deg, #fefce8, #ffffff)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography
              variant="subtitle2"
              className="font-semibold text-slate-900"
            >
              Region highlights
            </Typography>
            <Divider className="!my-1" />
            <Typography
              variant="body2"
              className="text-[12px] text-slate-800"
            >
              • Kampala – strong demand, wait times within target.
            </Typography>
            <Typography
              variant="body2"
              className="text-[12px] text-slate-800"
            >
              • Lagos – watch cancellations; consider fleet reinforcement.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
