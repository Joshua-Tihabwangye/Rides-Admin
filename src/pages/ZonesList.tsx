// @ts-nocheck
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Chip,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  InputAdornment,
  Select,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { ArrowBack } from "@mui/icons-material";

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

const ALL_ZONES = [
  {
    id: "UG-Z1",
    name: "Kampala Central",
    city: "Kampala",
    country: "Uganda",
    services: "Ride, Delivery, Rental",
    specialPricing: "Peak evening surcharge",
  },
  {
    id: "UG-Z2",
    name: "Airport / Entebbe",
    city: "Entebbe",
    country: "Uganda",
    services: "Ride, Delivery",
    specialPricing: "Airport pickup fee",
  },
  {
    id: "KE-Z1",
    name: "Nairobi CBD",
    city: "Nairobi",
    country: "Kenya",
    services: "Ride, Delivery, Rental",
    specialPricing: "Standard",
  },
  {
    id: "KE-Z2",
    name: "Westlands",
    city: "Nairobi",
    country: "Kenya",
    services: "Ride, Delivery",
    specialPricing: "Night surcharge",
  },
  {
    id: "RW-Z1",
    name: "Kigali Central",
    city: "Kigali",
    country: "Rwanda",
    services: "Ride, Delivery",
    specialPricing: "Standard",
  },
  {
    id: "NG-Z1",
    name: "Lagos Mainland",
    city: "Lagos",
    country: "Nigeria",
    services: "Ride, Delivery, Rental",
    specialPricing: "Peak hours surcharge",
  },
];

export default function ZonesList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("All");

  const filteredZones = ALL_ZONES.filter((zone) => {
    const matchesSearch =
      zone.name.toLowerCase().includes(search.toLowerCase()) ||
      zone.city.toLowerCase().includes(search.toLowerCase());
    const matchesCountry = countryFilter === "All" || zone.country === countryFilter;
    return matchesSearch && matchesCountry;
  });

  const countries = ["All", ...Array.from(new Set(ALL_ZONES.map((z) => z.country)))];

  const handleRowClick = (zoneId: string) => {
    navigate(`/admin/pricing/detail/${zoneId}`);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Button
          size="small"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/admin/pricing")}
          sx={{ textTransform: "none" }}
        >
          Back to Pricing
        </Button>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            All Zones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage all service zones across all countries.
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", p: 2 }}>
          <TextField
            size="small"
            placeholder="Search zones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300, "& .MuiOutlinedInput-root": { borderRadius: 8 } }}
          />
          <Select
            size="small"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            sx={{ minWidth: 150, borderRadius: 2 }}
          >
            {countries.map((country) => (
              <MenuItem key={country} value={country}>
                {country}
              </MenuItem>
            ))}
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Zone ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Services</TableCell>
                <TableCell>Special Pricing</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredZones.map((zone) => (
                <TableRow
                  key={zone.id}
                  hover
                  onClick={() => handleRowClick(zone.id)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{zone.id}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{zone.name}</TableCell>
                  <TableCell>{zone.city}</TableCell>
                  <TableCell>
                    <Chip label={zone.country} size="small" sx={{ fontSize: 10 }} />
                  </TableCell>
                  <TableCell>{zone.services}</TableCell>
                  <TableCell>{zone.specialPricing}</TableCell>
                </TableRow>
              ))}
              {filteredZones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3, color: "text.secondary" }}>
                    No zones found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
