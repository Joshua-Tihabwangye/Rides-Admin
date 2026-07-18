// @ts-nocheck
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  createAdminPricingZone,
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

const DEFAULT_BOUNDARIES = {
  type: "Polygon",
  coordinates: [
    [
      [32.58, 0.35],
      [32.59, 0.35],
      [32.59, 0.34],
      [32.58, 0.34],
      [32.58, 0.35],
    ],
  ],
};

const EV_COLORS = {
  primary: "#03cd8c",
};

function normalizeZone(row: AdminPricingZoneResponse): ZoneRow {
  const pricingRules = (row.pricingRules && typeof row.pricingRules === "object" && !Array.isArray(row.pricingRules))
    ? row.pricingRules
    : {};
  const meta = pricingRules.meta && typeof pricingRules.meta === "object" ? pricingRules.meta : {};
  const services = Array.isArray(pricingRules.services) ? pricingRules.services : [];

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
  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [country, setCountry] = useState("All");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newZone, setNewZone] = useState({ name: "", city: "", country: "", services: "Ride" });
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

  const handleCreateZone = async () => {
    if (!newZone.name.trim()) return;
    setSaving(true);
    setStatusMessage(null);

    try {
      const services = newZone.services
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      await createAdminPricingZone({
        name: newZone.name.trim(),
        description: `${newZone.city.trim()} ${newZone.country.trim()}`.trim(),
        boundaries: DEFAULT_BOUNDARIES as any,
        status: "active",
        pricingRules: {
          services,
          note: "Standard",
          meta: {
            city: newZone.city.trim(),
            country: newZone.country.trim() || "Uganda",
          },
        },
      });

      setCreateDialogOpen(false);
      setNewZone({ name: "", city: "", country: "", services: "Ride" });
      setStatusMessage({ type: "success", message: "Zone created successfully." });
      await loadZones();
    } catch (error) {
      console.error("Failed to create zone", error);
      setStatusMessage({ type: "error", message: "Failed to create zone." });
    } finally {
      setSaving(false);
    }
  };

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
                Map & geofence editor
              </Typography>
              <Chip
                size="small"
                label={country}
                sx={{ fontSize: 10, height: 22, bgcolor: "#020617", color: "#e5e7eb" }}
              />
            </Box>
            <Typography variant="caption" className="text-[11px] text-slate-400">
              Integrate Google Maps drawing tools here to edit real polygon coordinates.
            </Typography>
            <Box className="mt-2 flex-1 rounded-lg border border-dashed border-slate-600 bg-slate-900/60 flex flex-col items-center justify-center text-[11px] text-slate-400">
              <span>Geofence polygon editor area</span>
              <span className="mt-1 text-[10px]">Selected zone polygon data is backend-stored.</span>
            </Box>
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
                onClick={() => setCreateDialogOpen(true)}
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
                      <TableCell align="right">Action</TableCell>
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
                          <Button size="small" disabled={saving} onClick={() => void handleToggleStatus(zone)}>
                            {zone.status === "active" ? "Deactivate" : "Activate"}
                          </Button>
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

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create New Zone</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField
            label="Zone Name"
            size="small"
            fullWidth
            value={newZone.name}
            onChange={(e) => setNewZone((prev) => ({ ...prev, name: e.target.value }))}
          />
          <TextField
            label="City"
            size="small"
            fullWidth
            value={newZone.city}
            onChange={(e) => setNewZone((prev) => ({ ...prev, city: e.target.value }))}
          />
          <TextField
            label="Country"
            size="small"
            fullWidth
            value={newZone.country}
            onChange={(e) => setNewZone((prev) => ({ ...prev, country: e.target.value }))}
          />
          <TextField
            label="Services (comma-separated)"
            size="small"
            fullWidth
            value={newZone.services}
            onChange={(e) => setNewZone((prev) => ({ ...prev, services: e.target.value }))}
          />
          <Typography variant="caption" color="text.secondary">
            Create saves to backend immediately. Polygon editing should be completed via map tools.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} size="small">Cancel</Button>
          <Button
            onClick={() => void handleCreateZone()}
            variant="contained"
            size="small"
            disabled={saving}
            sx={{ bgcolor: EV_COLORS.primary, "&:hover": { bgcolor: "#0fb589" } }}
          >
            {saving ? "Saving..." : "Create Zone"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
