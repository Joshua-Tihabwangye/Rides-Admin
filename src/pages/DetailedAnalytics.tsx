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
  Select,
  MenuItem,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
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
  Legend,
} from "recharts";
import DownloadIcon from "@mui/icons-material/Download";
import PeriodSelector from "../components/PeriodSelector";
import dayjs from "dayjs";

// B3 – Detailed Analytics & Reports
// Route: /admin/reports

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

const REPORTS = [
  {
    id: "TRIPS-VOLUME",
    name: "Trips & volumes",
    description: "Trip counts, distances and durations by region.",
  },
  {
    id: "DRIVER-PERF",
    name: "Driver performance",
    description: "Acceptance, cancellations and ratings by driver.",
  },
  {
    id: "COMPANY-PERF",
    name: "Company performance",
    description: "Trips, cancellations and payouts by company.",
  },
];

export default function DetailedAnalyticsPage() {
  const [selectedReportId, setSelectedReportId] = useState(REPORTS[0].id);
  const [period, setPeriod] = useState("30days");
  const [filters, setFilters] = useState({
    region: "All",
    service: "All",
    exportFormat: "Table",
  });

  // Mock data update effect
  React.useEffect(() => {
    console.log(`[Analytics] Updating data for Report: ${selectedReportId}, Period: ${period}, Region: ${filters.region}`);
    // In production: fetchReport(selectedReportId, { period, ...filters })
  }, [selectedReportId, period, filters]);

  const selectedReport =
    REPORTS.find((r) => r.id === selectedReportId) || REPORTS[0];

  const handleReportClick = (report) => {
    setSelectedReportId(report.id);
  };

  const handleFilterChange = (field) => (event) => {
    setFilters({ ...filters, [field]: event.target.value });
  };

  const sampleChartData = [
    { name: "Kampala", rides: 1120, completion: 97 },
    { name: "Lagos", rides: 860, completion: 94 },
    { name: "Nairobi", rides: 680, completion: 96 },
    { name: "Accra", rides: 420, completion: 92 },
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
            Detailed Analytics
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Deep dive into operational metrics, financial performance, and user growth.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={filters.region}
              onChange={handleFilterChange("region")}
              displayEmpty
              sx={{ fontSize: 12, borderRadius: 2, height: 40, bgcolor: 'background.paper' }}
            >
              <MenuItem value="All">All Regions</MenuItem>
              <MenuItem value="Kampala">Kampala</MenuItem>
              <MenuItem value="Nairobi">Nairobi</MenuItem>
              <MenuItem value="Lagos">Lagos</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={filters.service}
              onChange={handleFilterChange("service")}
              displayEmpty
              sx={{ fontSize: 12, borderRadius: 2, height: 40, bgcolor: 'background.paper' }}
            >
              <MenuItem value="All">All Services</MenuItem>
              <MenuItem value="Rides">Rides</MenuItem>
              <MenuItem value="Delivery">Delivery</MenuItem>
              <MenuItem value="Logistics">Logistics</MenuItem>
            </Select>
          </FormControl>
          <PeriodSelector
            value={period}
            onChange={(p) => setPeriod(p)}
          />
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            sx={{ borderRadius: 2, height: 40, textTransform: 'none', bgcolor: 'background.paper' }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Left – report list */}
        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography
              variant="subtitle2"
              className="font-semibold"
              color="text.primary"
            >
              Reports
            </Typography>
            <Divider className="!my-1" />
            <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Report</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {REPORTS.map((report) => (
                    <TableRow
                      key={report.id}
                      hover
                      sx={{
                        cursor: "pointer",
                        bgcolor: report.id === selectedReportId ? (theme) => theme.palette.mode === 'dark' ? 'rgba(3, 205, 140, 0.15)' : 'rgba(3, 205, 140, 0.1)' : 'transparent'
                      }}
                      selected={report.id === selectedReportId}
                      onClick={() => handleReportClick(report)}
                    >
                      <TableCell sx={{ fontWeight: report.id === selectedReportId ? 600 : 400 }}>{report.name}</TableCell>
                      <TableCell>{report.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Right – filters & sample result */}
        <Card
          elevation={2}
          sx={{
            flex: 1.5,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Box className="flex items-center justify-between gap-2">
              <Box>
                <Typography
                  variant="subtitle2"
                  className="font-semibold"
                  color="text.primary"
                >
                  {selectedReport.name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {selectedReport.description}
                </Typography>
              </Box>
            </Box>

            <Divider className="!my-1" />

            <Box className="flex items-center justify-between mt-1">
              <Typography
                variant="caption"
                className="text-[11px]"
                color="text.secondary"
              >
                Displaying data for Period: <b>{period}</b>, Region: <b>{filters.region}</b>.
              </Typography>
            </Box>

            {/* Sample results table/chart */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 2,
                border: "1px solid rgba(148,163,184,0.2)",
                bgcolor: "background.default",
                minHeight: 250,
              }}
            >
              <CardContent className="p-3">
                <Box sx={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sampleChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                      <YAxis fontSize={11} stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }}
                        labelStyle={{ color: "#e5e7eb" }}
                        itemStyle={{ color: "#03cd8c" }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="rides" fill="#03cd8c" name="Trips" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completion" fill="#f77f00" name="Completion Rate %" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

