import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useNavigate } from "react-router-dom";
import PeriodSelector, { type PeriodOption } from "../components/PeriodSelector";
import {
  listAdminPricingZones,
  listPricingRules,
  listSurgeZones,
  type AdminPricingZoneResponse,
  type PricingRule,
  type SurgeZone,
} from "../services/api/adminApi";

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
  blue: "#3b82f6",
};

type ZoneRow = {
  id: string;
  name: string;
  city: string;
  country: string;
  services: string;
  specialPricing: string;
  status: "active" | "inactive";
};

type LoadStatus = {
  type: "error" | "success" | "info";
  message: string;
} | null;

function currency(amount: number | undefined, code = "UGX") {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "-";
  return `${code} ${amount.toLocaleString("en-UG")}`;
}

function pricingMeta(zone: AdminPricingZoneResponse): Record<string, unknown> {
  if (!zone.pricingRules || Array.isArray(zone.pricingRules)) return {};
  const meta = zone.pricingRules.meta;
  return meta && typeof meta === "object" && !Array.isArray(meta) ? meta as Record<string, unknown> : {};
}

function normalizeZone(zone: AdminPricingZoneResponse): ZoneRow {
  const rules = zone.pricingRules && !Array.isArray(zone.pricingRules) ? zone.pricingRules : {};
  const meta = pricingMeta(zone);
  const embeddedServices = Array.isArray(rules.services) ? rules.services : zone.services;
  const services = Array.isArray(embeddedServices)
    ? embeddedServices.map((entry) => String(entry)).join(", ")
    : "Ride";

  return {
    id: zone.id,
    name: zone.name || "Unnamed zone",
    city: zone.city || String(meta.city ?? "-"),
    country: zone.country || String(meta.country ?? "Unknown"),
    services,
    specialPricing: String(rules.note ?? "Standard"),
    status: zone.status,
  };
}

function activeChip(active: boolean) {
  return (
    <Chip
      size="small"
      label={active ? "Active" : "Inactive"}
      color={active ? "success" : "default"}
      sx={{ fontSize: 10, height: 22 }}
    />
  );
}

export default function PricingRulesPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodOption>("thisMonth");
  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [surgeZones, setSurgeZones] = useState<SurgeZone[]>([]);
  const [country, setCountry] = useState("All");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<LoadStatus>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const [zoneResponse, ruleResponse, surgeResponse] = await Promise.all([
        listAdminPricingZones(),
        listPricingRules(),
        listSurgeZones(),
      ]);

      setZones(zoneResponse.map(normalizeZone));
      setPricingRules(ruleResponse);
      setSurgeZones(surgeResponse);
    } catch (error) {
      console.error("Failed to load pricing overview", error);
      setStatus({ type: "error", message: "Failed to load pricing zones and tariff data from the backend." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const countries = useMemo(() => {
    const knownCountries = Array.from(new Set(zones.map((zone) => zone.country).filter(Boolean))).sort();
    return ["All", ...knownCountries];
  }, [zones]);

  const countryZones = useMemo(() => {
    if (country === "All") return zones;
    return zones.filter((zone) => zone.country === country);
  }, [country, zones]);

  const activeRules = pricingRules.filter((rule) => rule.active);
  const activeSurges = surgeZones.filter((zone) => zone.active);
  const averageMinimumFare = activeRules.length
    ? Math.round(activeRules.reduce((sum, rule) => sum + (rule.minimumFare || 0), 0) / activeRules.length)
    : 0;

  const pricingDistribution = useMemo(() => {
    const standard = activeRules.length;
    const surge = activeSurges.length;
    const inactive = pricingRules.length + surgeZones.length - standard - surge;
    return [
      { name: "Active tariffs", value: standard, color: EV_COLORS.primary },
      { name: "Active surges", value: surge, color: EV_COLORS.secondary },
      { name: "Inactive", value: Math.max(inactive, 0), color: EV_COLORS.blue },
    ].filter((entry) => entry.value > 0);
  }, [activeRules.length, activeSurges.length, pricingRules.length, surgeZones.length]);

  const handleCountryChange = (event: SelectChangeEvent<string>) => {
    setCountry(event.target.value);
  };

  const metrics = [
    { label: "Active Zones", value: String(countryZones.filter((zone) => zone.status === "active").length), sub: `${countryZones.length} total in view` },
    { label: "Pricing Rules", value: String(activeRules.length), sub: `${pricingRules.length} configured` },
    { label: "Avg. Minimum Fare", value: currency(averageMinimumFare), sub: "Across active tariffs" },
  ];

  return (
    <Box>
      <Box className="pb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Pricing & Zones
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Backend-authoritative tariff, surge, and zone overview.
          </Typography>
          {status && (
            <Alert severity={status.type} sx={{ mt: 1.5 }}>
              {status.message}
            </Alert>
          )}
        </Box>
        <Box className="flex flex-wrap items-center gap-2">
          <PeriodSelector value={period} onChange={(newPeriod) => setPeriod(newPeriod)} />
          <Button variant="outlined" size="small" onClick={() => void load()} sx={{ textTransform: "none", borderRadius: 2 }}>
            Refresh
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <>
          <Box className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {metrics.map((metric) => (
              <Card key={metric.label} elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)" }}>
                <CardContent className="p-3">
                  <Typography variant="caption" className="text-slate-500 uppercase">
                    {metric.label}
                  </Typography>
                  <Typography variant="h6" className="font-semibold">
                    {metric.value}
                  </Typography>
                  <Typography variant="caption" className="text-slate-400">
                    {metric.sub}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Card elevation={1} sx={{ mb: 4, borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)" }}>
            <CardContent className="p-4 h-[260px] flex items-center">
              {pricingDistribution.length > 0 ? (
                <Box className="flex-1 h-full">
                  <Typography variant="subtitle2" className="mb-2 font-semibold">
                    Pricing Configuration Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pricingDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={82} dataKey="value">
                        {pricingDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="middle" align="right" layout="vertical" />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ width: "100%", textAlign: "center" }}>
                  No pricing configuration has been created yet.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Box className="flex flex-col lg:flex-row gap-4">
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
              <CardContent className="p-4 flex flex-col gap-3 h-full">
                <Box className="flex items-center justify-between">
                  <Typography variant="subtitle2" className="font-semibold text-slate-50">
                    Zone Coverage
                  </Typography>
                  <Chip size="small" label={country} sx={{ fontSize: 10, height: 22, bgcolor: "#020617", color: "#e5e7eb" }} />
                </Box>
                <Typography variant="caption" className="text-[11px] text-slate-400">
                  Zone geometry is stored by the backend. Open a zone to inspect or edit map boundaries.
                </Typography>
                <Box className="mt-1 rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                  <Typography variant="caption" className="text-slate-400">
                    Active surge zones
                  </Typography>
                  <Typography variant="h5" className="font-semibold text-slate-50">
                    {activeSurges.length}
                  </Typography>
                </Box>
                <Box className="flex flex-col gap-2">
                  {activeSurges.slice(0, 5).map((surge) => (
                    <Box key={surge.id} className="flex items-center justify-between rounded-md border border-slate-700 px-3 py-2">
                      <Box>
                        <Typography variant="caption" className="block text-slate-50">
                          {surge.name}
                        </Typography>
                        <Typography variant="caption" className="text-slate-400">
                          {surge.serviceType}
                        </Typography>
                      </Box>
                      <Chip size="small" label={`${surge.multiplier}x`} sx={{ bgcolor: "#f77f00", color: "#111827", fontWeight: 700 }} />
                    </Box>
                  ))}
                  {activeSurges.length === 0 && (
                    <Typography variant="caption" className="text-slate-400">
                      No active surge zones.
                    </Typography>
                  )}
                </Box>
                <Button variant="contained" size="small" onClick={() => navigate("/admin/pricing/zones")} sx={{ mt: "auto", textTransform: "none", borderRadius: 2, bgcolor: EV_COLORS.primary, "&:hover": { bgcolor: "#0fb589" } }}>
                  Manage zones
                </Button>
              </CardContent>
            </Card>

            <Card elevation={1} sx={{ flex: 2, borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
              <CardContent className="p-4 flex flex-col gap-3">
                <Box className="flex items-center justify-between gap-2">
                  <Box className="flex items-center gap-2">
                    <Typography variant="subtitle2" className="font-semibold" color="text.primary">
                      Zones
                    </Typography>
                    <Select size="small" value={country} onChange={handleCountryChange} sx={{ minWidth: 140 }}>
                      {countries.map((entry) => (
                        <MenuItem key={entry} value={entry}>
                          {entry}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ textTransform: "none", borderRadius: 2, fontSize: 11 }}
                    onClick={() => navigate("/admin/pricing/new-zone")}
                  >
                    Add zone
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
                        <TableCell>Pricing</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {countryZones.map((zone) => (
                        <TableRow key={zone.id} hover>
                          <TableCell>{zone.name}</TableCell>
                          <TableCell>{zone.city}</TableCell>
                          <TableCell>{zone.services}</TableCell>
                          <TableCell>{zone.specialPricing}</TableCell>
                          <TableCell>{activeChip(zone.status === "active")}</TableCell>
                          <TableCell align="right">
                            <Box className="flex gap-1 justify-end">
                              <Button size="small" onClick={() => navigate(`/admin/pricing/map/${zone.id}`)} sx={{ textTransform: "none", fontSize: 11 }}>
                                Map
                              </Button>
                              <Button size="small" onClick={() => navigate(`/admin/pricing/detail/${zone.id}`)} sx={{ textTransform: "none", fontSize: 11, color: EV_COLORS.primary }}>
                                Pricing
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                      {countryZones.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                              No pricing zones found.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        </>
      )}
    </Box>
  );
}
