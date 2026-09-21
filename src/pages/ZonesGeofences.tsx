import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { useNavigate } from "react-router-dom";
import {
  listAdminPricingZones,
  patchAdminPricingZone,
  type AdminPricingZoneResponse,
} from "../services/api/adminApi";

type ZoneRow = {
  id: string;
  name: string;
  city: string;
  country: string;
  services: string;
  specialPricing: string;
  status: "active" | "inactive";
};

const EV_COLORS = {
  primary: "#03cd8c",
};

function normalizeZone(row: AdminPricingZoneResponse): ZoneRow {
  const pricingRules = (row.pricingRules && typeof row.pricingRules === "object" && !Array.isArray(row.pricingRules))
    ? row.pricingRules
    : {};
  const meta = pricingRules.meta && typeof pricingRules.meta === "object" ? pricingRules.meta : {};
  const services = Array.isArray(pricingRules.services)
    ? pricingRules.services
    : Array.isArray(row.services)
      ? row.services
      : [];

  return {
    id: String(row.id),
    name: row.name ?? "Unnamed zone",
    city: row.city ?? String(meta.city ?? ""),
    country: row.country ?? String(meta.country ?? "Unknown"),
    services: services.length > 0 ? services.join(", ") : "Ride",
    specialPricing: String(pricingRules.note ?? "Standard"),
    status: row.status ?? "active",
  };
}

export default function ZonesGeofencesPage() {
  const navigate = useNavigate();
  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [country, setCountry] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadZones = async () => {
    setLoading(true);
    try {
      const response = await listAdminPricingZones();
      setZones(response.map(normalizeZone));
    } catch (error) {
      console.error("Failed to load pricing zones", error);
      setStatusMessage({ type: "error", message: "Failed to load pricing zones from backend." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadZones();
  }, []);

  const countries = useMemo(() => {
    const all = Array.from(new Set(zones.map((z) => z.country).filter(Boolean))).sort();
    return ["All", ...all];
  }, [zones]);

  const countryZones = useMemo(() => {
    if (country === "All") return zones;
    return zones.filter((zone) => zone.country === country);
  }, [country, zones]);

  const handleToggleStatus = async (zone: ZoneRow) => {
    setSaving(true);
    setStatusMessage(null);
    try {
      await patchAdminPricingZone(zone.id, {
        status: zone.status === "active" ? "inactive" : "active",
      });
      setStatusMessage({ type: "success", message: "Zone updated." });
      await loadZones();
    } catch (error) {
      console.error("Failed to update zone", error);
      setStatusMessage({ type: "error", message: "Failed to update zone status." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Zone & Geofence Management
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Backend-authoritative zones and geofence records.
          </Typography>
          {statusMessage && (
            <Alert severity={statusMessage.type} sx={{ mt: 1.5 }}>
              {statusMessage.message}
            </Alert>
          )}
        </Box>
      </Box>

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
          <CardContent className="p-4 flex flex-col gap-2 h-full">
            <Box className="flex items-center justify-between">
              <Typography variant="subtitle2" className="font-semibold text-slate-50">
                Geofence coverage
              </Typography>
              <Chip
                size="small"
                label={country}
                sx={{ fontSize: 10, height: 22, bgcolor: "#020617", color: "#e5e7eb" }}
              />
            </Box>
            <Typography variant="caption" className="text-[11px] text-slate-400">
              Open a zone to draw, inspect, or save backend-stored polygon coordinates.
            </Typography>
            <Box className="mt-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              <Typography variant="caption" className="text-slate-400">
                Zones in view
              </Typography>
              <Typography variant="h4" className="font-semibold text-slate-50">
                {countryZones.length}
              </Typography>
              <Typography variant="caption" className="text-slate-400">
                {countryZones.filter((zone) => zone.status === "active").length} active
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate("/admin/pricing/zones")}
              sx={{ mt: "auto", textTransform: "none", borderRadius: 2, bgcolor: EV_COLORS.primary, "&:hover": { bgcolor: "#0fb589" } }}
            >
              Open zone manager
            </Button>
          </CardContent>
        </Card>

        <Card
          elevation={1}
          sx={{
            flex: 2,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.5)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Box className="flex items-center justify-between gap-2">
              <Box className="flex items-center gap-2">
                <Typography variant="subtitle2" className="font-semibold" color="text.primary">
                  Zones
                </Typography>
                <Select size="small" value={country} onChange={(event) => setCountry(String(event.target.value))} sx={{ minWidth: 140 }}>
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
                disabled={saving}
                sx={{ textTransform: "none", borderRadius: 2, fontSize: 11 }}
                onClick={() => navigate("/admin/pricing/new-zone")}
              >
                + Add zone
              </Button>
            </Box>

            <Divider className="!my-1" />

            {loading ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                Loading zones...
              </Typography>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "action.hover" }}>
                      <TableCell>Zone</TableCell>
                      <TableCell>City</TableCell>
                      <TableCell>Country</TableCell>
                      <TableCell>Services</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {countryZones.map((zone) => (
                      <TableRow key={zone.id} hover>
                        <TableCell>{zone.name}</TableCell>
                        <TableCell>{zone.city || "-"}</TableCell>
                        <TableCell>{zone.country || "-"}</TableCell>
                        <TableCell>{zone.services}</TableCell>
                        <TableCell>{zone.status}</TableCell>
                        <TableCell align="right">
                          <Box className="flex justify-end gap-1">
                            <Button size="small" onClick={() => navigate(`/admin/pricing/map/${zone.id}`)}>
                              Boundary
                            </Button>
                            <Button size="small" onClick={() => navigate(`/admin/pricing/detail/${zone.id}`)}>
                              Pricing
                            </Button>
                            <Button size="small" disabled={saving} onClick={() => void handleToggleStatus(zone)}>
                              {zone.status === "active" ? "Deactivate" : "Activate"}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {countryZones.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                            No zones found.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
