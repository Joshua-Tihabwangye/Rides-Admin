// @ts-nocheck
import React, { useState, useMemo } from "react";
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
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import SearchIcon from "@mui/icons-material/Search";
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
    group: "Operations",
  },
  {
    id: "DRIVER-PERF",
    name: "Driver performance",
    description: "Acceptance, cancellations and ratings by driver.",
    group: "Drivers",
  },
  {
    id: "COMPANY-PERF",
    name: "Company performance",
    description: "Trips, cancellations and payouts by company.",
    group: "Companies",
  },
];

const REPORT_GROUPS = ["Operations", "Drivers", "Companies", "Finance", "Safety"];

export default function DetailedAnalyticsPage() {
  const [selectedReportId, setSelectedReportId] = useState(REPORTS[0].id);
  const [period, setPeriod] = useState("thisMonth");
  const [filters, setFilters] = useState({
    region: "All",
    service: "All",
  });
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(["TRIPS-VOLUME"]);
  const [recentReports, setRecentReports] = useState<string[]>(["TRIPS-VOLUME"]);
  const [previewState, setPreviewState] = useState<"ready" | "loading" | "empty" | "error">("ready");
  const [reportTab, setReportTab] = useState<"favorites" | "recent" | "all">("all");

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
    // Add to recent if not already there
    if (!recentReports.includes(report.id)) {
      setRecentReports([report.id, ...recentReports.slice(0, 4)]);
    } else {
      // Move to front if already in recent
      setRecentReports([report.id, ...recentReports.filter(id => id !== report.id)]);
    }
  };

  const toggleFavorite = (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favorites.includes(reportId)) {
      setFavorites(favorites.filter(id => id !== reportId));
    } else {
      setFavorites([...favorites, reportId]);
    }
  };

  const filteredReports = REPORTS.filter(report => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return report.name.toLowerCase().includes(query) || 
             report.description.toLowerCase().includes(query) ||
             report.group.toLowerCase().includes(query);
    }
    return true;
  });

  const getReportsByTab = () => {
    if (reportTab === "favorites") {
      return filteredReports.filter(r => favorites.includes(r.id));
    } else if (reportTab === "recent") {
      return filteredReports.filter(r => recentReports.includes(r.id));
    }
    return filteredReports;
  };

  const reportsByGroup = getReportsByTab().reduce((acc, report) => {
    if (!acc[report.group]) acc[report.group] = [];
    acc[report.group].push(report);
    return acc;
  }, {} as Record<string, typeof REPORTS>);

  const handleFilterChange = (field) => (event) => {
    setFilters({ ...filters, [field]: event.target.value });
  };

  const baseChartData = {
    All: [
      { name: "Kampala", rides: 1120, completion: 97, distance: 7.5, duration: 26.2 },
      { name: "Lagos", rides: 860, completion: 94, distance: 6.8, duration: 24.8 },
      { name: "Nairobi", rides: 680, completion: 96, distance: 7.2, duration: 25.5 },
      { name: "Accra", rides: 420, completion: 92, distance: 6.5, duration: 23.1 },
    ],
    Kampala: [
      { name: "Kampala Central", rides: 640, completion: 98, distance: 7.8, duration: 27.1 },
      { name: "Kampala North", rides: 480, completion: 96, distance: 7.2, duration: 25.3 },
    ],
    Nairobi: [
      { name: "Nairobi", rides: 680, completion: 96, distance: 7.2, duration: 25.5 },
    ],
    Lagos: [
      { name: "Lagos Mainland", rides: 520, completion: 93, distance: 6.9, duration: 24.9 },
      { name: "Lagos Island", rides: 340, completion: 95, distance: 6.7, duration: 24.7 },
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
        distance: row.distance || 7.2,
        duration: row.duration || 25.5,
      };
    },
  );

  const tableRows = chartData.map((row, index) => ({
    id: index + 1,
    region: row.name,
    service: filters.service === "All" ? "All" : filters.service,
    trips: row.rides,
    completionRate: `${row.completion}%`,
    avgDistance: row.distance?.toFixed(1) || (7.2 + Math.random() * 2).toFixed(1),
    avgDuration: row.duration?.toFixed(1) || (25.5 + Math.random() * 5).toFixed(1),
  }));

  // Calculate KPI summary for selected report
  const kpiSummary = useMemo(() => {
    if (selectedReportId !== "TRIPS-VOLUME") return null;
    const totalTrips = tableRows.reduce((sum, row) => sum + row.trips, 0);
    const weightedCompletion = tableRows.reduce((sum, row) => 
      sum + (row.trips * parseFloat(row.completionRate)), 0) / totalTrips;
    const weightedDistance = tableRows.reduce((sum, row) => 
      sum + (row.trips * parseFloat(row.avgDistance)), 0) / totalTrips;
    const weightedDuration = tableRows.reduce((sum, row) => 
      sum + (row.trips * parseFloat(row.avgDuration)), 0) / totalTrips;
    
    return {
      totalTrips,
      completionRate: weightedCompletion.toFixed(1),
      avgDistance: weightedDistance.toFixed(1),
      avgDuration: weightedDuration.toFixed(1),
    };
  }, [tableRows, selectedReportId]);

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

      {/* Helper text */}
      <Alert severity="info" sx={{ mb: 2, fontSize: 12 }}>
        Pick a report on the left then filter and export on the right.
      </Alert>

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
              Report picker
            </Typography>
            <TextField
              size="small"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />
            <Tabs
              value={reportTab}
              onChange={(e, newValue) => setReportTab(newValue)}
              sx={{ minHeight: 32, mb: 1 }}
            >
              <Tab label="Favorites" value="favorites" sx={{ fontSize: 11, minHeight: 32 }} />
              <Tab label="Recent" value="recent" sx={{ fontSize: 11, minHeight: 32 }} />
              <Tab label="All" value="all" sx={{ fontSize: 11, minHeight: 32 }} />
            </Tabs>
            <Divider className="!my-1" />
            <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
              {reportTab === "favorites" && favorites.length === 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: 'block' }}>
                  No favorites yet. Click the star icon to add reports to favorites.
                </Typography>
              )}
              {Object.entries(reportsByGroup).map(([group, reports]) => (
                <Box key={group} sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      px: 1,
                      mb: 1,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                    }}
                  >
                    {group}
                  </Typography>
                  {reports.map((report) => (
                    <Box
                      key={report.id}
                      onClick={() => handleReportClick(report)}
                      sx={{
                        cursor: "pointer",
                        bgcolor: report.id === selectedReportId ? 'rgba(3, 205, 140, 0.1)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        px: 1,
                        py: 1,
                        borderRadius: 1,
                        mb: 0.5,
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => toggleFavorite(report.id, e)}
                        sx={{ p: 0.5, mr: 1 }}
                      >
                        {favorites.includes(report.id) ? (
                          <StarIcon sx={{ fontSize: 16, color: EV_COLORS.secondary }} />
                        ) : (
                          <StarBorderIcon sx={{ fontSize: 16 }} />
                        )}
                      </IconButton>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: report.id === selectedReportId ? 600 : 400,
                            fontSize: 12,
                          }}
                        >
                          {report.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                          {report.description}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
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

            {/* KPI Summary Row */}
            {kpiSummary && selectedReportId === "TRIPS-VOLUME" && (
              <Box className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="caption" className="text-[10px] text-slate-500">
                    Total trips
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 700 }}>
                    {kpiSummary.totalTrips.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" className="text-[9px] text-slate-400">
                    Sum across selected filters
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="caption" className="text-[10px] text-slate-500">
                    Completion rate
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 700 }}>
                    {kpiSummary.completionRate}%
                  </Typography>
                  <Typography variant="caption" className="text-[9px] text-slate-400">
                    Weighted by trips
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="caption" className="text-[10px] text-slate-500">
                    Avg distance
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 700 }}>
                    {kpiSummary.avgDistance} km
                  </Typography>
                  <Typography variant="caption" className="text-[9px] text-slate-400">
                    Weighted by trips
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="caption" className="text-[10px] text-slate-500">
                    Avg duration
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 700 }}>
                    {kpiSummary.avgDuration} min
                  </Typography>
                  <Typography variant="caption" className="text-[9px] text-slate-400">
                    Weighted by trips
                  </Typography>
                </Box>
              </Box>
            )}

            <Box className="flex items-center justify-between mt-1 mb-2">
              <Typography variant="caption" className="text-[11px]" color="text.secondary">
                Displaying data for Period: <b>{period}</b>, Region: <b>{filters.region}</b>,
                Service: <b>{filters.service}</b>.
              </Typography>
              <Box className="flex gap-1">
                <Button
                  size="small"
                  variant={viewMode === "chart" ? "contained" : "outlined"}
                  onClick={() => setViewMode("chart")}
                  sx={{ fontSize: 10, textTransform: 'none' }}
                >
                  Charts
                </Button>
                <Button
                  size="small"
                  variant={viewMode === "table" ? "contained" : "outlined"}
                  onClick={() => setViewMode("table")}
                  sx={{ fontSize: 10, textTransform: 'none' }}
                >
                  Table
                </Button>
              </Box>
            </Box>

            {/* Preview state indicator */}
            {previewState === "loading" && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            {previewState === "error" && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Error loading data. Please try again.
              </Alert>
            )}
            {previewState === "empty" && (
              <Alert severity="info" sx={{ mb: 2 }}>
                No data available for the selected filters.
              </Alert>
            )}

            {/* Sample results table/chart */}
            {previewState === "ready" && (
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
                          <TableCell>Region</TableCell>
                          <TableCell>Service</TableCell>
                          <TableCell align="right">Trips</TableCell>
                          <TableCell align="right">Completion %</TableCell>
                          <TableCell align="right">Avg distance</TableCell>
                          <TableCell align="right">Avg duration</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tableRows.map((row) => (
                          <TableRow key={row.id} hover>
                            <TableCell>{row.region}</TableCell>
                            <TableCell>{row.service}</TableCell>
                            <TableCell align="right">{row.trips.toLocaleString()}</TableCell>
                            <TableCell align="right">{row.completionRate}</TableCell>
                            <TableCell align="right">{row.avgDistance} km</TableCell>
                            <TableCell align="right">{row.avgDuration} min</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

