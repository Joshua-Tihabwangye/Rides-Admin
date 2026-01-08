import React, { useEffect, useState, useMemo } from "react";
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
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import SearchIcon from "@mui/icons-material/Search";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { getRiders, RiderRecord, createRider } from "../lib/peopleStore";

export default function RiderManagement() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [riders, setRiders] = useState<RiderRecord[]>([]);
  
  // New filter states
  const [cityFilter, setCityFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  
  // Action menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<number | null>(null);

  const location = useLocation();

  useEffect(() => {
    setRiders(getRiders());
  }, [location.key]);

  // Calculate tab counts
  const tabCounts = useMemo(() => {
    const bikeRiders = riders.filter(r => r.vehicleType === "Bike");
    return {
      all: bikeRiders.length,
      active: bikeRiders.filter(r => r.primaryStatus === "approved").length,
      pending: bikeRiders.filter(r => r.primaryStatus === "under_review").length,
      suspended: bikeRiders.filter(r => r.primaryStatus === "suspended").length,
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
      `RDR-${rider.id}`.toLowerCase().includes(search.toLowerCase());
    const matchesTab =
      activeTab === "All" ||
      (activeTab === "Active/Verified" && rider.primaryStatus === "approved") ||
      (activeTab === "Pending review" && rider.primaryStatus === "under_review") ||
      (activeTab === "Suspended" && rider.primaryStatus === "suspended");
    // Only show bike riders
    const matchesVehicle = rider.vehicleType === "Bike";
    
    // City filter
    const matchesCity = cityFilter === "all" || rider.city === cityFilter;
    
    // Account filter
    const matchesAccount = accountFilter === "all" || 
      (accountFilter === "active" && rider.activityStatus === "active") ||
      (accountFilter === "inactive" && rider.activityStatus === "inactive");
    
    // Risk filter
    const matchesRisk = riskFilter === "all" || rider.risk.toLowerCase() === riskFilter;
    
    return matchesSearch && matchesTab && matchesVehicle && matchesCity && matchesAccount && matchesRisk;
  });

  const handleRowClick = (id: number) => {
    navigate(`/admin/riders/${id}`);
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, riderId: number) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRiderId(riderId);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedRiderId(null);
  };

  const handleActionSelect = (action: string) => {
    if (selectedRiderId) {
      switch (action) {
        case "view":
          navigate(`/admin/riders/${selectedRiderId}`);
          break;
        case "suspend":
          // Handle suspend action
          break;
        case "contact":
          // Handle contact action
          break;
      }
    }
    handleActionClose();
  };

  // Generate mock last trip and last active dates
  const getLastTrip = (riderId: number) => {
    const daysAgo = (riderId % 7) + 1;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getLastActive = (riderId: number) => {
    const hoursAgo = (riderId % 24) + 1;
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

  return (
    <Box>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Rider Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage rider accounts, view trip history, and monitor risk profiles.
          </Typography>
        </Box>
        {/* Create Rider Button */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ textTransform: "none", borderRadius: 999 }}
          onClick={() => navigate('/admin/riders/new')}
        >
          Create rider
        </Button>
      </Box>

      {/* Dropdown Filters Row */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", p: 2 }}>
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
        <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", p: 2 }}>
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
            sx={{ width: 300, "& .MuiOutlinedInput-root": { borderRadius: 8 } }}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            {tabs.map((tab) => (
              <Chip
                key={tab.label}
                label={`${tab.label} (${tab.count})`}
                onClick={() => setActiveTab(tab.label)}
                color={activeTab === tab.label ? "primary" : "default"}
                sx={{ borderRadius: 2, height: 32 }}
                variant={activeTab === tab.label ? "filled" : "outlined"}
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
                  key={rider.id}
                  hover
                  onClick={() => handleRowClick(rider.id)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>
                    RDR-{rider.id}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                    <TwoWheelerIcon fontSize="small" color="success" />
                    {rider.name}
                  </TableCell>
                  <TableCell>{rider.phone}</TableCell>
                  <TableCell>{rider.city}</TableCell>
                  <TableCell>{rider.vehicle}</TableCell>
                  <TableCell align="right">{rider.trips}</TableCell>
                  <TableCell align="right">{rider.spend}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{getLastTrip(rider.id)}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{getLastActive(rider.id)}</TableCell>
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
                      label={rider.risk}
                      color={rider.risk === "Low" ? "success" : rider.risk === "Medium" ? "warning" : "error"}
                      sx={{ fontSize: 10, height: 20 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleActionClick(e, rider.id)}
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
          Suspend Account
        </MenuItem>
      </Menu>
    </Box>
  );
}
