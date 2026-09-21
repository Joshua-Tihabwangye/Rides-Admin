import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import SearchIcon from "@mui/icons-material/Search";
import { ArrowBack } from "@mui/icons-material";
import { listAdminPricingZones } from "../services/api/adminApi";
import type { AdminPricingZoneResponse } from "../services/api/adminApi";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatServices(services: AdminPricingZoneResponse["services"]) {
  if (!Array.isArray(services) || services.length === 0) return "N/A";
  return services.map((service) => String(service)).join(", ");
}

export default function ZonesList() {
  const navigate = useNavigate();
  const [zones, setZones] = useState<AdminPricingZoneResponse[]>([]);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchZones = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminPricingZones();
      setZones(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load zones"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const filteredZones = useMemo(() => zones.filter((zone) => {
    const matchesSearch =
      zone.name.toLowerCase().includes(search.toLowerCase()) ||
      (zone.city || "").toLowerCase().includes(search.toLowerCase());
    const matchesCountry = countryFilter === "All" || zone.country === countryFilter;
    return matchesSearch && matchesCountry;
  }), [countryFilter, search, zones]);

  const countries = useMemo(
    () => ["All", ...Array.from(new Set(zones.map((z) => z.country || "").filter(Boolean))).sort()],
    [zones],
  );

  const handleCountryChange = (event: SelectChangeEvent<string>) => {
    setCountryFilter(event.target.value);
  };

  const handleRowClick = (zoneId: string) => {
    navigate(`/admin/pricing/detail/${zoneId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

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
            onChange={handleCountryChange}
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
                <TableCell>Status</TableCell>
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
                  <TableCell>{zone.city || "N/A"}</TableCell>
                  <TableCell>
                    <Chip label={zone.country || "N/A"} size="small" sx={{ fontSize: 10 }} />
                  </TableCell>
                  <TableCell>{formatServices(zone.services)}</TableCell>
                  <TableCell>
                    <Chip
                      label={zone.status}
                      size="small"
                      color={zone.status === "active" ? "success" : "default"}
                      sx={{ fontSize: 10 }}
                    />
                  </TableCell>
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
