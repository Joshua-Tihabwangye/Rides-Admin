// @ts-nocheck
import React, { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodOption>('today');

  const handlePeriodChange = (newPeriod: PeriodOption, range?: any) => {
    setPeriod(newPeriod);
  };

  const periodLabel =
    period === 'today'
      ? 'today'
      : period === '7days'
        ? 'last 7 days'
        : period === '30days'
          ? 'last 30 days'
          : period === 'thisMonth'
            ? 'this month'
            : 'custom range';

  const periodMultiplier: Record<PeriodOption, number> = {
    today: 0.15,
    '7days': 0.5,
    '30days': 1,
    thisMonth: 1.2,
    custom: 0.8,
  };

  const kpis = useMemo(() => {
    const m = periodMultiplier[period] ?? 1;
    const tripsValue = (261 * m).toLocaleString(undefined, { maximumFractionDigits: 0 });
    const tripsChange = m >= 1 ? '-6%' : '-6%';
    const completionRate = (95.1 - (1 - m) * 0.5).toFixed(1);
    const avgWaitTime = (6.7 + (1 - m) * 0.3).toFixed(1);
    const onlineDrivers = Math.round(62 * m);
    const utilisation = Math.round(13 * m);
    
    return [
      {
        label: 'Trips (Rides + Deliveries)',
        value: tripsValue,
        subtitle: `${tripsChange} vs prev`,
        status: 'Watch',
        description: 'Total completed trip volume = rides + deliveries in the selected period.',
        explanation: `${tripsChange} vs prev means Compared to the previous comparable period usually yesterday or previous week same day/time, trips are down 6%.`,
      },
      {
        label: 'Completion rate',
        value: `${completionRate}%`,
        subtitle: `Target ≥ 95%`,
        status: parseFloat(completionRate) >= 95 ? 'On target' : 'Below target',
        description: '% of initiated requests that complete successfully.',
        explanation: 'Target ≥ 95% means Your business has decided anything below 95% is unacceptable. On target 95.1% passes the threshold but it\'s close to the line',
      },
      {
        label: 'Avg wait time',
        value: `${avgWaitTime} min`,
        subtitle: 'SLA ≤ 7.0m',
        status: parseFloat(avgWaitTime) <= 7 ? 'On target' : 'Above SLA',
        description: 'Average time from request → pickup/driver arrival or request → match, depending on definition.',
        explanation: 'SLA ≤ 7.0m means Your operational promise is average should stay under 7 minutes. On target means 6.7 is within SLA but close to breach.',
      },
      {
        label: 'Online drivers',
        value: onlineDrivers.toLocaleString(),
        subtitle: `${utilisation}% utilisation`,
        status: 'Monitor',
        description: 'Number of drivers currently online/available.',
        explanation: `${utilisation}% utilisation. This likely means active/engaged drivers ÷ online drivers or online ÷ total registered.`,
      },
    ];
  }, [period]);

  const demandSupplyData = useMemo(() => {
    const m = periodMultiplier[period] ?? 1;
    const base = [
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
    return base.map((row) => ({
      ...row,
      demand: Math.round(row.demand * m),
      supply: Math.round(row.supply * m),
    }));
  }, [period]);

  const serviceMixData = useMemo(() => {
    const m = periodMultiplier[period] ?? 1;
    return [
      { region: 'Kampala', rides: Math.round(840 * m), deliveries: Math.round(420 * m) },
      { region: 'Nairobi', rides: Math.round(650 * m), deliveries: Math.round(380 * m) },
      { region: 'Lagos', rides: Math.round(920 * m), deliveries: Math.round(510 * m) },
      { region: 'Accra', rides: Math.round(480 * m), deliveries: Math.round(220 * m) },
    ];
  }, [period]);

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
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        {kpis.map((kpi) => {
          const getStatusColor = (status: string) => {
            if (status === 'On target') return '#03cd8c';
            if (status === 'Watch' || status === 'Monitor') return '#f77f00';
            if (status === 'Below target' || status === 'Above SLA') return '#ef4444';
            return '#94a3b8';
          };
          
          return (
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
                <Box className="flex items-center gap-2">
                  <Typography
                    variant="caption"
                    className="text-[11px] text-emerald-700"
                  >
                    {kpi.subtitle}
                  </Typography>
                  <Chip
                    label={kpi.status}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 9,
                      bgcolor: getStatusColor(kpi.status) + '20',
                      color: getStatusColor(kpi.status),
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  className="text-[10px] text-slate-500 mt-1"
                  title={kpi.explanation}
                >
                  {kpi.description}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>

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
            <Box className="flex items-center justify-between">
              <Typography
                variant="subtitle2"
                className="font-semibold text-slate-900"
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
            <Box className="flex items-center gap-2">
              <Typography
                variant="body2"
                className="text-[12px] text-slate-800"
              >
                • Rider cancellations: 4.1%
              </Typography>
              <Chip
                label="On target"
                size="small"
                sx={{
                  height: 18,
                  fontSize: 9,
                  bgcolor: '#03cd8c20',
                  color: '#03cd8c',
                }}
              />
            </Box>
            <Box className="flex items-center gap-2">
              <Typography
                variant="body2"
                className="text-[12px] text-slate-800"
              >
                • Driver cancellations: 3.3%
              </Typography>
              <Chip
                label="Monitor"
                size="small"
                sx={{
                  height: 18,
                  fontSize: 9,
                  bgcolor: '#f77f0020',
                  color: '#f77f00',
                }}
              />
            </Box>
            <Box className="flex items-center gap-2">
              <Typography
                variant="body2"
                className="text-[12px] text-slate-800"
              >
                • Support tickets (24h): 32 + 3 critical
              </Typography>
              <Chip
                label="Critical"
                size="small"
                sx={{
                  height: 18,
                  fontSize: 9,
                  bgcolor: '#ef444420',
                  color: '#ef4444',
                }}
              />
            </Box>
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
