import React, { useState, useEffect, useMemo } from"react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  Select,
  CircularProgress,
  Alert,
  InputAdornment,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from"@mui/material";
import { useNavigate, useLocation } from"react-router-dom";
import StatusBadge from"../components/StatusBadge";
import SearchIcon from"@mui/icons-material/Search";
import DirectionsCarIcon from"@mui/icons-material/DirectionsCar";
import AddIcon from"@mui/icons-material/Add";
import MoreVertIcon from"@mui/icons-material/MoreVert";
import { listAdminDrivers, patchAdminDriver } from"../services/api/adminApi";
import type { AdminDriverResponse } from"../services/api/adminApi";

// UI-only record shape
type DriverRecord = {
  id: number; // display numeric index
  backendId: string;
  name: string;
  phone: string;
  city: string;
  vehicle: string;
  vehicleType: 'Bike' | 'Car';
  trips: number;
  spend: string;
  risk: 'Low' | 'Medium' | 'High';
  primaryStatus: 'approved' | 'under_review' | 'suspended';
  activityStatus: 'active' | 'inactive';
};

export default function DriverManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [cityFilter, setCityFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  // Action menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);

  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminDrivers();
      // Map backend driver to UI record
      const mapped: DriverRecord[] = data.map((driver, index) => {
        const primaryStatus: DriverRecord['primaryStatus'] = driver.status === 'active' ? 'approved' : 'suspended';
        const activityStatus: DriverRecord['activityStatus'] = driver.status === 'active' ? 'active' : 'inactive';
        return {
          id: index + 201,
          backendId: driver.driverId || driver.userId,
          name: driver.fullName,
          phone: driver.phone,
          city: driver.city,
          vehicle: "EV Car",
          vehicleType: "Car",
          trips: driver.totalTrips || 0,
          spend: "$0",
          risk: "Low",
          primaryStatus,
          activityStatus,
        };
      });
      setDrivers(mapped);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [location.key]);

  // Calculate tab counts
  const tabCounts = useMemo(() => {
    const carDrivers = drivers.filter(d => d.vehicleType === "Car");
    return {
      all: carDrivers.length,
      active: carDrivers.filter(d => d.primaryStatus === "approved").length,
      pending: carDrivers.filter(d => d.primaryStatus === "under_review").length,
      suspended: carDrivers.filter(d => d.primaryStatus === "suspended").length,
    };
  }, [drivers]);

  // Get unique cities for filter
  const uniqueCities = useMemo(() => {
    const cities = [...new Set(drivers.map(d => d.city))];
    return cities.sort();
  }, [drivers]);

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(search.toLowerCase()) ||
      driver.phone.includes(search) ||
      `DRV-${driver.id}`.toLowerCase().includes(search.toLowerCase());
    const matchesTab =
      activeTab === "All" ||
      (activeTab === "Active/Verified" && driver.primaryStatus === "approved") ||
      (activeTab === "Pending review" && driver.primaryStatus === "under_review") ||
      (activeTab === "Suspended" && driver.primaryStatus === "suspended");
    // Only show car drivers
    const matchesVehicle = driver.vehicleType === "Car";

    // City filter
    const matchesCity = cityFilter === "all" || driver.city === cityFilter;

    // Account filter
    const matchesAccount = accountFilter === "all" ||
      (accountFilter === "active" && driver.activityStatus === "active") ||
      (accountFilter === "inactive" && driver.activityStatus === "inactive");

    // Risk filter
    const matchesRisk = riskFilter === "all" || driver.risk.toLowerCase() === riskFilter;

    return matchesSearch && matchesTab && matchesVehicle && matchesCity && matchesAccount && matchesRisk;
  });

  const handleRowClick = (backendId: string) => {
    navigate(`/admin/drivers/${backendId}`);
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, driverId: number) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedDriverId(driverId);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedDriverId(null);
  };

  const handleActionSelect = async (action: string) => {
    if (selectedDriverId !== null) {
      const driver = drivers.find(d => d.id === selectedDriverId);
      if (!driver) return;
      if (action === "view") {
        navigate(`/admin/drivers/${driver.backendId}`);
      } else if (action === "suspend") {
        // Toggle suspend: patch status to 'deleted' or 'active'
        try {
          const newStatus = driver.primaryStatus === 'suspended' ? 'active' : 'deleted';
          await patchAdminDriver(driver.backendId, { status: newStatus });
          fetchDrivers();
        } catch (e) {
          setError("Failed to update status");
        }
      } else if (action === "contact") {
        // TODO: implement contact action (e.g., copy phone or open mail)
      }
    }
    handleActionClose();
  };

  // Mock last trip/last active - these would come from backend in real implementation
  const getLastTrip = (driverId: number) => {
    const daysAgo = (driverId % 7) + 1;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getLastActive = (driverId: number) => {
    const hoursAgo = (driverId % 24) + 1;
    if (hoursAgo < 24) {
      return `${hoursAgo}h ago`;
    }
    return `${Math.floor(hoursAgo / 24)}d ago`;
  };

  const tabs = [
    { label: "All", count: tabCounts.all },
    { label: "Active/Verified", count: tabCounts.active },
    { label: "Pending review", count: tabCounts.pending },
    { label: "Suspended", count: tabCounts.suspended },
  ];

  if (loading && drivers.length === 0) {
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
      <Box sx={{ mb: 3, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Driver Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage driver accounts, view trip history, and monitor risk profiles.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ textTransform:"none", borderRadius: 999 }}
          onClick={() => navigate('/admin/drivers/new')}
        >
          Create driver
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display:"flex", gap: 2, alignItems:"center", flexWrap:"wrap", p: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Filters:
          </Typography>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              displayEmpty
              sx={{ fontSize: 12, borderRadius: 2, height: 36 }}
            >
              <MenuItem value="all">All cities</MenuItem>
              {uniqueCities.map(city => (
                <MenuItem key={city} value={city}>{city}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              displayEmpty
              sx={{ fontSize: 12, borderRadius: 2, height: 36 }}
            >
              <MenuItem value="all">All accounts</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              displayEmpty
              sx={{ fontSize: 12, borderRadius: 2, height: 36 }}
            >
              <MenuItem value="all">All risk levels</MenuItem>
              <MenuItem value="low">Low (normal behavior)</MenuItem>
              <MenuItem value="medium">Medium (needs monitoring)</MenuItem>
              <MenuItem value="high">High (needs review)</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Search and Tabs */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display:"flex", gap: 2, alignItems:"center", flexWrap:"wrap", p: 2 }}>
          <TextField
            size="small"
            placeholder="Search drivers by name, phone, or ID..."
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
          <Box sx={{ display:"flex", gap: 1 }}>
            {tabs.map((tab) => (
              <Chip
                key={tab.label}
                label={`${tab.label} (${tab.count})`}
                onClick={() => setActiveTab(tab.label)}
                color={activeTab === tab.label ?"primary" :"default"}
                sx={{ borderRadius: 2, height: 32 }}
                variant={activeTab === tab.label ?"filled" :"outlined"}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell align="right">Trips</TableCell>
                <TableCell align="right">Lifetime Earnings</TableCell>
                <TableCell>Last Trip</TableCell>
                <TableCell>Last Active</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Activity</TableCell>
                <TableCell>Risk</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDrivers.map((driver) => (
                <TableRow
                  key={driver.id}
                  hover
                  onClick={() => handleRowClick(driver.backendId)}
                  sx={{ cursor:"pointer" }}
                >
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>
                    DRV-{driver.id}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, display:"flex", alignItems:"center", gap: 1 }}>
                    <DirectionsCarIcon fontSize="small" color="primary" />
                    {driver.name}
                  </TableCell>
                  <TableCell>{driver.phone}</TableCell>
                  <TableCell>{driver.city}</TableCell>
                  <TableCell>{driver.vehicle}</TableCell>
                  <TableCell align="right">{driver.trips}</TableCell>
                  <TableCell align="right">{driver.spend}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{getLastTrip(driver.id)}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{getLastActive(driver.id)}</TableCell>
                  <TableCell>
                    <StatusBadge status={driver.primaryStatus} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={driver.activityStatus === "active" ? "active" : "inactive"}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={driver.risk}
                      color={driver.risk === "Low" ? "success" : driver.risk === "Medium" ? "warning" : "error"}
                      sx={{ fontSize: 10, height: 20 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleActionClick(e, driver.id)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionClose}
      >
        <MenuItem onClick={() => handleActionSelect("view")}>View Details</MenuItem>
        <MenuItem onClick={() => handleActionSelect("contact")}>Contact Driver</MenuItem>
        <MenuItem onClick={() => handleActionSelect("suspend")} sx={{ color: 'error.main' }}>
          {selectedDriverId !== null && drivers.find(d => d.id === selectedDriverId)?.primaryStatus === 'suspended' ? 'Activate' : 'Suspend Account'}
        </MenuItem>
      </Menu>
    </Box>
  );
}
