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
import PeriodSelector from "../components/PeriodSelector";
import dayjs from "dayjs";

// F2 – Zone & Geofence Management (Light/Dark, EVzone themed)
// Route suggestion: /admin/zones
// Defines where services are available using named zones and geofences.
// Map editor is represented here as a placeholder card; in production this
// would embed your actual map drawing tools.
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - Header shows EVZONE ADMIN and subtitle "Core product config · Zones".
//    - Country select shows Uganda and Kenya.
//    - Zone table lists sample zones for the selected country.
//    - Map placeholder card is visible with instructions.
// 2) Theme toggle
//    - Toggle Light/Dark using the header button; cards and background update
//      while zone data remains stable.
// 3) Country selection
//    - Switching countries updates the zone list.
// 4) Edit (demo)
//    - Clicking "Add zone" logs a placeholder.
//    - Clicking a zone row logs that zone for further editing.
// 5) View pricing link
//    - In each zone row, the "View pricing" button logs a message including
//      country and city, indicating a conceptual link to /admin/pricing for
//      that zone.

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

const INITIAL_ZONES = {
  Uganda: [
    {
      id: "UG-Z1",
      name: "Kampala Central",
      city: "Kampala",
      services: "Ride, Delivery, Rental",
      specialPricing: "Peak evening surcharge",
    },
    {
      id: "UG-Z2",
      name: "Airport / Entebbe",
      city: "Entebbe",
      services: "Ride, Delivery",
      specialPricing: "Airport pickup fee",
    },
  ],
  Kenya: [
    {
      id: "KE-Z1",
      name: "Nairobi CBD",
      city: "Nairobi",
      services: "Ride, Delivery, Rental",
      specialPricing: "Standard",
    },
    {
      id: "KE-Z2",
      name: "Westlands",
      city: "Nairobi",
      services: "Ride, Delivery",
      specialPricing: "Night surcharge",
    },
  ],
};




export default function PricingRulesPage() {
  const navigate = useNavigate();
  const [zones] = useState(INITIAL_ZONES);
  const countries = Object.keys(zones);
  const [country, setCountry] = useState(countries[0] || "Uganda");
  const [period, setPeriod] = useState("thisMonth");
  const [customRange, setCustomRange] = useState([null, null]);

  // Dynamic data multiplier
  const multiplier = period === 'today' ? 0.3 : period === '7days' ? 1 : period === 'thisMonth' ? 4 : 12;

  const handleCountryChange = (event) => {
    setCountry(event.target.value);
  };

  const handleAddZone = () => {
    navigate('/admin/pricing/new-zone');
  };

  const handleZoneClick = (zone) => {
    navigate(`/admin/pricing/zones`);
  };

  const handleViewPricing = (zone) => {
    navigate(`/admin/pricing/detail/${zone.id}`);
  };

  const handleViewMap = (zone) => {
    navigate(`/admin/pricing/map/${zone.id}`);
  };

  const dashboardMetrics = [
    { label: "Active Zones", value: `${24}`, sub: "Across 2 countries" },
    { label: "Total Revenue", value: `$${(245000 * multiplier).toLocaleString()}`, sub: "From all active tariffs" },
    { label: "Avg. Trip Cost", value: `$${(12 * multiplier).toLocaleString()}`, sub: "+5% vs last period" },
  ];

  const pricingDistribution = React.useMemo(() => [
    { name: "Standard", value: Math.round(65 * multiplier), color: "#03cd8c" },
    { name: "Surge > 1.5x", value: Math.round(20 * multiplier), color: "#f77f00" },
    { name: "Promo / Discount", value: Math.round(15 * multiplier), color: "#3b82f6" },
  ], [multiplier]);

  const countryZones = zones[country] || [];

  return (
    <Box>
      {/* Title */}
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography
            variant="h6"
            className="font-semibold tracking-tight"
            color="text.primary"
          >
            Pricing & Zones
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Manage pricing tariffs, service zones, and geofences.
          </Typography>
        </Box>
        <PeriodSelector
          value={period}
          onChange={(newPeriod) => setPeriod(newPeriod)}
        />
      </Box>

      {/* Dashboard Metrics */}
      <Box className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {dashboardMetrics.map((m) => (
          <Card key={m.label} elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)" }}>
            <CardContent className="p-3">
              <Typography variant="caption" className="text-slate-500 uppercase">{m.label}</Typography>
              <Typography variant="h6" className="font-semibold">{m.value}</Typography>
              <Typography variant="caption" className="text-slate-400">{m.sub}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Pricing Analysis Chart */}
      <Card elevation={1} sx={{ mb: 4, borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)" }}>
        <CardContent className="p-4 h-[250px] flex items-center">
          <Box className="flex-1 h-full">
            <Typography variant="subtitle2" className="mb-2 font-semibold">Pricing Rule Distribution</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pricingDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                  {pricingDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="middle" align="right" layout="vertical" />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Left – Map placeholder */}
        <Card
          elevation={1}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "linear-gradient(145deg, #0b1120, #020617)",
            color: "#e5e7eb",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2 h-full">
            <Box className="flex items-center justify-between">
              <Typography
                variant="subtitle2"
                className="font-semibold text-slate-50"
              >
                Map & geofence editor (placeholder)
              </Typography>
              <Chip
                size="small"
                label={country}
                sx={{
                  fontSize: 10,
                  height: 22,
                  bgcolor: "#020617",
                  color: "#e5e7eb",
                }}
              />
            </Box>
            <Typography
              variant="caption"
              className="text-[11px] text-slate-400"
            >
              In production, this area shows an interactive map where you can
              draw and edit polygons for each zone.
            </Typography>
            <Box className="mt-2 flex-1 rounded-lg border border-dashed border-slate-600 bg-slate-900/60 flex flex-col items-center justify-center text-[11px] text-slate-400">
              <span>Map / geofence editor goes here</span>
              <span className="mt-1 text-[10px] text-slate-500">
                Click "Add zone" to start drawing a new polygon in your real
                implementation.
              </span>
            </Box>
          </CardContent>
        </Card>

        {/* Right – Zone list */}
        <Card
          elevation={1}
          sx={{
            flex: 2,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.5)",
            // Default theme background
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Box className="flex items-center justify-between gap-2">
              <Box className="flex items-center gap-2">
                <Typography
                  variant="subtitle2"
                  className="font-semibold"
                  color="text.primary"
                >
                  Zones
                </Typography>
                <Select
                  size="small"
                  value={country}
                  onChange={handleCountryChange}
                  sx={{
                    minWidth: 140,
                  }}
                >
                  {countries.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  fontSize: 11,
                }}
                onClick={handleAddZone}
              >
                + Add zone
              </Button>
            </Box>

            <Divider className="!my-1" />

            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "action.hover" }}>
                    <TableCell>Zone</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>Services</TableCell>
                    <TableCell>Special pricing</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {countryZones.map((zone) => (
                    <TableRow
                      key={zone.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => handleZoneClick(zone)}
                    >
                      <TableCell>{zone.name}</TableCell>
                      <TableCell>{zone.city}</TableCell>
                      <TableCell>{zone.services}</TableCell>
                      <TableCell>{zone.specialPricing}</TableCell>
                      <TableCell align="right">
                        <Box className="flex gap-1 justify-end">
                          <Button
                            size="small"
                            variant="text"
                            sx={{
                              textTransform: "none",
                              fontSize: 11,
                              minWidth: "auto",
                              padding: 0,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewMap(zone);
                            }}
                          >
                            View map
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            sx={{
                              textTransform: "none",
                              fontSize: 11,
                              minWidth: "auto",
                              padding: 0,
                              color: EV_COLORS.primary,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewPricing(zone);
                            }}
                          >
                            View pricing
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
