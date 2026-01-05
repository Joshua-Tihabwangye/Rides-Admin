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
import ExportButton from "../components/ExportButton";
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
  });
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  // Mock data update effect – in a real app this would fetch from the backend.
  React.useEffect(() => {
    // This side-effect exists to document how filters drive data.
    // eslint-disable-next-line no-console
    console.log(
      `[Analytics] Updating data for Report: ${selectedReportId}, Period: ${period}, Region: ${filters.region}, Service: ${filters.service}`,
    );
  }, [selectedReportId, period, filters.region, filters.service]);

  const selectedReport =
    REPORTS.find((r) => r.id === selectedReportId) || REPORTS[0];

  const handleReportClick = (report) => {
    setSelectedReportId(report.id);
  };

  const handleFilterChange = (field) => (event) => {
    setFilters({ ...filters, [field]: event.target.value });
  };

  const baseChartData = {
    All: [
      { name: "Kampala", rides: 1120, completion: 97 },
      { name: "Lagos", rides: 860, completion: 94 },
      { name: "Nairobi", rides: 680, completion: 96 },
      { name: "Accra", rides: 420, completion: 92 },
    ],
    Kampala: [
      { name: "Kampala Central", rides: 640, completion: 98 },
      { name: "Kampala North", rides: 480, completion: 96 },
    ],
    Nairobi: [
      { name: "Nairobi", rides: 680, completion: 96 },
    ],
    Lagos: [
      { name: "Lagos Mainland", rides: 520, completion: 93 },
      { name: "Lagos Island", rides: 340, completion: 95 },
    ],
  } as const;

  const periodMultiplier: Record<string, number> = {
    today: 0.2,
    "7days": 0.6,
    "30days": 1,
    thisMonth: 1.1,
    custom: 0.8,
  };

  const chartData = (baseChartData[filters.region] || baseChartData.All).map(
    (row) => {
      const mult = periodMultiplier[period] ?? 1;
      const serviceFactor =
        filters.service === "Rides"
          ? 1
          : filters.service === "Delivery"
            ? 0.4
            : filters.service === "Logistics"
              ? 0.2
              : 1;

      return {
        ...row,
        rides: Math.round(row.rides * mult * serviceFactor),
      };
    },
  );

  const tableRows = chartData.map((row, index) => ({
    id: index + 1,
    region: row.name,
    trips: row.rides,
    completionRate: `${row.completion}%`,
    cancellations: Math.round(row.rides * 0.04),
  }));

  const handleExportCsv = () => {
    if (!tableRows.length) return;

    const header = ["#", "Region", "Trips", "Completion rate", "Cancellations"];
    const csvLines = [
      header.join(","),
      ...tableRows.map((row) =>
        [row.id, row.region, row.trips, row.completionRate, row.cancellations].join(","),
      ),
    ];

    const blob = new Blob([csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `evzone-report-${selectedReportId}-${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          <PeriodSelector value={period} onChange={(p) => setPeriod(p)} />
          <ExportButton
            onDownload={handleExportCsv}
            onViewChart={() => setViewMode("chart")}
            onViewRawData={() => setViewMode("table")}
            variant="contained"
            label="Actions"
          />
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
                <Typography variant="caption" color="text.secondary">
                  {selectedReport.description}
                </Typography>
              </Box>
            </Box>

            <Divider className="!my-1" />

            <Box className="flex items-center justify-between mt-1">
              <Typography variant="caption" className="text-[11px]" color="text.secondary">
                Displaying data for Period: <b>{period}</b>, Region: <b>{filters.region}</b>,
                Service: <b>{filters.service}</b>. Switch between chart and raw data view, or
                export as CSV.
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
                {viewMode === "chart" ? (
                  <Box sx={{ width: "100%", height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                        <YAxis fontSize={11} stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid #334155",
                            borderRadius: 8,
                            fontSize: 11,
                          }}
                          labelStyle={{ color: "#e5e7eb" }}
                          itemStyle={{ color: "#03cd8c" }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="rides" fill="#03cd8c" name="Trips" radius={[4, 4, 0, 0]} />
                        <Bar
                          dataKey="completion"
                          fill="#f77f00"
                          name="Completion Rate %"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 260 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Region</TableCell>
                          <TableCell align="right">Trips</TableCell>
                          <TableCell align="right">Completion rate</TableCell>
                          <TableCell align="right">Cancellations</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tableRows.map((row) => (
                          <TableRow key={row.id} hover>
                            <TableCell>{row.id}</TableCell>
                            <TableCell>{row.region}</TableCell>
                            <TableCell align="right">{row.trips}</TableCell>
                            <TableCell align="right">{row.completionRate}</TableCell>
                            <TableCell align="right">{row.cancellations}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

