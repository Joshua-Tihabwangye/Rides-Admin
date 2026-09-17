import React, { useEffect, useState, useMemo } from"react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  Select,
  CircularProgress,
  Alert,
} from"@mui/material";
import { useNavigate, useLocation } from"react-router-dom";
import StatusBadge from"../components/StatusBadge";
import SearchIcon from "@mui/icons-material/Search";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { listAdminRiders, patchAdminRider } from "../services/api/adminApi";

// UI-only record shape
type RiderRecord = {
  backendId: string;
  name: string;
  phone: string;
  city: string;
  vehicle: string;
  trips: number;
  spend: string;
  risk: 'Low' | 'Medium' | 'High' | 'N/A';
  primaryStatus: 'active' | 'deleted' | 'suspended';
  activityStatus: 'active' | 'inactive';
};

export default function RiderManagement() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [riders, setRiders] = useState<RiderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [cityFilter, setCityFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  // Action menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);

  const location = useLocation();

  const fetchRiders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminRiders();
      // Map backend rider to UI record. Backend status is one of
      // 'active' | 'deleted' | 'suspended'; no other statuses are emitted.
      const mapped: RiderRecord[] = data.map((rider) => {
        const primaryStatus: RiderRecord['primaryStatus'] = rider.status;
        const activityStatus: RiderRecord['activityStatus'] = rider.status === 'active' ? 'active' : 'inactive';
        const name = rider.fullName || `${rider.firstName || ''} ${rider.lastName || ''}`.trim() || 'Unknown';
        return {
          backendId: rider.riderId || rider.userId,
          name,
          phone: rider.phone || '',
          city: rider.city || '',
          vehicle: "N/A",
          trips: rider.totalTrips || 0,
          spend: "N/A",
          risk: "N/A",
          primaryStatus,
          activityStatus,
        };
      });
      setRiders(mapped);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load riders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, [location.key]);

  // Calculate tab counts from the real backend status values.
  const tabCounts = useMemo(() => {
    return {
      all: riders.length,
      active: riders.filter(r => r.primaryStatus === "active").length,
      pending: riders.filter(r => r.primaryStatus !== "active" && r.primaryStatus !== "suspended").length,
      suspended: riders.filter(r => r.primaryStatus === "suspended").length,
    };
  }, [riders]);

  // Get unique cities for filter
  const uniqueCities = useMemo(() => {
    const cities = [...new Set(riders.map(r => r.city))];
    return cities.sort();
  }, [riders]);

  const filteredRiders = riders.filter((rider) => {
    const matchesSearch =
      rider.name.toLowerCase().includes(search.toLowerCase()) ||
      rider.phone.includes(search) ||
      rider.backendId.toLowerCase().includes(search.toLowerCase());
    const matchesTab =
      activeTab === "All" ||
      (activeTab === "Active/Verified" && rider.primaryStatus === "active") ||
      (activeTab === "Pending review" && rider.primaryStatus !== "active" && rider.primaryStatus !== "suspended") ||
      (activeTab === "Suspended" && rider.primaryStatus === "suspended");
    const matchesCity = cityFilter === "all" || rider.city === cityFilter;
    const matchesAccount = accountFilter === "all" ||
      (accountFilter === "active" && rider.activityStatus === "active") ||
      (accountFilter === "inactive" && rider.activityStatus === "inactive");
    const matchesRisk = riskFilter === "all" ||
      (riskFilter === "na" && rider.risk === "N/A") ||
      rider.risk.toLowerCase() === riskFilter;
    return matchesSearch && matchesTab && matchesCity && matchesAccount && matchesRisk;
  });

  const handleRowClick = (backendId: string) => {
    navigate(`/admin/riders/${backendId}`);
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, backendId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRiderId(backendId);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedRiderId(null);
  };

  const handleActionSelect = async (action: string) => {
    if (selectedRiderId !== null) {
      const rider = riders.find(r => r.backendId === selectedRiderId);
      if (!rider) return;
      if (action === "view") {
        navigate(`/admin/riders/${rider.backendId}`);
      } else if (action === "suspend") {
        // Toggle between the real backend statuses ('active' vs 'suspended').
        try {
          const newStatus = rider.primaryStatus === 'active' ? 'suspended' : 'active';
          await patchAdminRider(rider.backendId, { status: newStatus });
          fetchRiders();
        } catch {
          setError("Failed to update status");
        }
      } else if (action === "contact") {
        if (rider.phone && rider.phone !== "—") {
          window.location.href = `tel:${rider.phone}`;
        } else {
          setError("No rider phone number is available from the backend.");
        }
      }
    }
    handleActionClose();
  };

  // Last trip/last active timestamps are not exposed by the backend yet.
  const getLastTrip = () => "N/A";
  const getLastActive = () => "N/A";

  const handleCreateRider = async (_event: React.MouseEvent) => {
    navigate('/admin/riders/new');
  };

  const tabs = [
    { label: "All", count: tabCounts.all },
    { label: "Active/Verified", count: tabCounts.active },
    { label: "Pending review", count: tabCounts.pending },
    { label: "Suspended", count: tabCounts.suspended },
  ];

  if (loading && riders.length === 0) {
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
            Rider Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage rider accounts, view trip history, and monitor risk profiles.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ textTransform:"none", borderRadius: 999 }}
          onClick={handleCreateRider}
        >
          Create rider
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
              <MenuItem value="na">Not evaluated</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Search and Tabs */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display:"flex", gap: 2, alignItems:"center", flexWrap:"wrap", p: 2 }}>
          <TextField
            size="small"
            placeholder="Search riders by name, phone, or ID..."
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
                <TableCell align="right">Lifetime Spend</TableCell>
                <TableCell>Last Trip</TableCell>
                <TableCell>Last Active</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Activity</TableCell>
                <TableCell>Risk</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRiders.map((rider) => (
                <TableRow
                  key={rider.backendId}
                  hover
                  onClick={() => handleRowClick(rider.backendId)}
                  sx={{ cursor:"pointer" }}
                >
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>
                    {rider.backendId}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, display:"flex", alignItems:"center", gap: 1 }}>
                    <TwoWheelerIcon fontSize="small" color="success" />
                    {rider.name}
                  </TableCell>
                  <TableCell>{rider.phone}</TableCell>
                  <TableCell>{rider.city}</TableCell>
                  <TableCell>{rider.vehicle}</TableCell>
                  <TableCell align="right">{rider.trips}</TableCell>
                  <TableCell align="right">{rider.spend}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{getLastTrip()}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{getLastActive()}</TableCell>
                  <TableCell>
                    <StatusBadge status={rider.primaryStatus} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={rider.activityStatus === "active" ? "active" : "inactive"}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={rider.risk === "N/A" ? "Not evaluated" : rider.risk}
                      color={rider.risk === "Low" ? "success" : rider.risk === "Medium" ? "warning" : rider.risk === "High" ? "error" : "default"}
                      sx={{ fontSize: 10, height: 20 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleActionClick(e, rider.backendId)}
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
        <MenuItem onClick={() => handleActionSelect("contact")}>Contact Rider</MenuItem>
        <MenuItem onClick={() => handleActionSelect("suspend")} sx={{ color: 'error.main' }}>
          {selectedRiderId !== null && riders.find(r => r.backendId === selectedRiderId)?.primaryStatus !== 'active' ? 'Activate' : 'Suspend Account'}
        </MenuItem>
      </Menu>
    </Box>
  );
}
