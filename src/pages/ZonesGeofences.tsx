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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";

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



export default function ZonesGeofencesPage() {
  const [zones, setZones] = useState(INITIAL_ZONES);
  const countries = Object.keys(zones);
  const [country, setCountry] = useState(countries[0] || "Uganda");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newZone, setNewZone] = useState({ name: '', city: '', services: '' });

  const handleCountryChange = (event) => {
    setCountry(event.target.value);
  };

  const handleAddZone = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateZone = () => {
    if (!newZone.name.trim()) return;
    const id = `${country.substring(0, 2).toUpperCase()}-Z${(zones[country]?.length || 0) + 1}`;
    const zoneToAdd = {
      id,
      name: newZone.name.trim(),
      city: newZone.city.trim() || 'Unknown',
      services: newZone.services.trim() || 'Ride',
      specialPricing: 'Standard',
    };
    setZones(prev => ({
      ...prev,
      [country]: [...(prev[country] || []), zoneToAdd],
    }));
    setNewZone({ name: '', city: '', services: '' });
    setCreateDialogOpen(false);
    console.log('Created zone:', zoneToAdd);
  };

  const handleZoneClick = (zone) => {
    console.log("Open zone editor for:", zone);
  };

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
            Zone & Geofence Management
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Maintain named service zones and geofences per city.
          </Typography>
        </Box>
      </Box>

      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Left – Map placeholder */}
        <Card
          elevation={1}
          sx={{
            flex: 2,
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
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.5)",
            // Use standard background from theme or keep slight gradient but ensure it respects dark mode?
            // User wants global theme. The gradient was hardcoded light/dark in previous layout.
            // Let's use standard default background or a subtle one. A neutral one is safest.
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Create Zone Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create New Zone</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Zone Name"
            size="small"
            fullWidth
            value={newZone.name}
            onChange={(e) => setNewZone(prev => ({ ...prev, name: e.target.value }))}
          />
          <TextField
            label="City"
            size="small"
            fullWidth
            value={newZone.city}
            onChange={(e) => setNewZone(prev => ({ ...prev, city: e.target.value }))}
          />
          <TextField
            label="Services (e.g. Ride, Delivery)"
            size="small"
            fullWidth
            value={newZone.services}
            onChange={(e) => setNewZone(prev => ({ ...prev, services: e.target.value }))}
          />
          <Typography variant="caption" color="text.secondary">
            Country: {country}. Draw the zone polygon on the map after creation.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} size="small">Cancel</Button>
          <Button onClick={handleCreateZone} variant="contained" size="small" sx={{ bgcolor: '#03cd8c', '&:hover': { bgcolor: '#0fb589' } }}>
            Create Zone
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
