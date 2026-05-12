import React, { useState, useEffect } from"react";
import { useNavigate } from"react-router-dom";
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
  CircularProgress,
  Alert,
} from"@mui/material";
import SearchIcon from"@mui/icons-material/Search";
import { ArrowBack } from"@mui/icons-material";
import { listAdminPricingZones } from"../services/api/adminApi";
import type { AdminPricingZoneResponse } from"../services/api/adminApi";

const EV_COLORS = {
  primary:"#03cd8c",
  secondary:"#f77f00",
};

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
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const filteredZones = zones.filter((zone) => {
    const matchesSearch =
      zone.name.toLowerCase().includes(search.toLowerCase()) ||
      (zone.city || "").toLowerCase().includes(search.toLowerCase());
    const matchesCountry = countryFilter === "All" || zone.country === countryFilter;
    return matchesSearch && matchesCountry;
  });

  const countries = ["All", ...Array.from(new Set(zones.map((z) => z.country || "").filter(Boolean)))];

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
      <Box sx={{ mb: 3, display:"flex", alignItems:"center", gap: 2 }}>
        <Button
          size="small"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/admin/pricing")}
          sx={{ textTransform:"none" }}
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
        <CardContent sx={{ display:"flex", gap: 2, alignItems:"center", flexWrap:"wrap", p: 2 }}>
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
            sx={{ width: 300,"& .MuiOutlinedInput-root": { borderRadius: 8 } }}
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
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredZones.map((zone) => (
                <TableRow
                  key={zone.id}
                  hover
                  onClick={() => handleRowClick(zone.id)}
                  sx={{ cursor:"pointer" }}
                >
                  <TableCell sx={{ fontFamily:"monospace", fontSize: 12 }}>{zone.id}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{zone.name}</TableCell>
                  <TableCell>{zone.city || "N/A"}</TableCell>
                  <TableCell>
                    <Chip label={zone.country || "N/A"} size="small" sx={{ fontSize: 10 }} />
                  </TableCell>
                  <TableCell>{zone.services ? Object.keys(zone.services).join(", ") : "N/A"}</TableCell>
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
                  <TableCell colSpan={6} align="center" sx={{ py: 3, color:"text.secondary" }}>
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
