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
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
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
import dayjs from "dayjs";

// I1 – Financial Overview (Light/Dark, EVzone themed)
// Route suggestion: /admin/finance
// High-level financial KPIs and simple breakdowns by service and region.

export default function FinancialOverviewPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("week");
  const [customRange, setCustomRange] = useState([null, null]);

  // Mock data update simulation
  React.useEffect(() => {
    console.log("Finance data updated for period:", period, customRange);
  }, [period, customRange]);

  const handleExport = () => {
    console.log("Export finance summary for range:", period);
  };

  const handleRegionClick = (region) => {
    // Navigate to reports filtered by region
    navigate(`/admin/reports?region=${encodeURIComponent(region)}&tab=financials`);
  };

  const kpis = [
    {
      label: "Gross bookings",
      value: "$128,420",
      subtitle: "+12% vs last period",
    },
    {
      label: "EVzone net revenue",
      value: "$24,680",
      subtitle: "Net after fees & incentives",
    },
    {
      label: "Payouts (scheduled)",
      value: "$79,320",
      subtitle: "Next 7 days",
    },
  ];

  const serviceRevenueData = [
    { name: "Rides", value: 82000, color: "#03cd8c" },
    { name: "Deliveries", value: 32000, color: "#f77f00" },
    { name: "Rental", value: 14420, color: "#3b82f6" },
  ];

  return (
    <Box>
      {/* Title & date */}
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
            period={period}
            setPeriod={setPeriod}
            customRange={customRange}
            setCustomRange={setCustomRange}
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
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By region breakdown */}
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
              Revenue by region (sample)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Click a region to view detailed reports.
            </Typography>
            <Divider className="!my-1" />
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
                    <TableCell align="right">$74,000</TableCell>
                    <TableCell align="right">$14,200</TableCell>
                  </TableRow>
                  <TableRow
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRegionClick('West Africa')}
                  >
                    <TableCell>West Africa</TableCell>
                    <TableCell align="right">$54,420</TableCell>
                    <TableCell align="right">$10,480</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

