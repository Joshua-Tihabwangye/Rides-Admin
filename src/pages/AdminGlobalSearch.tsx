// @ts-nocheck
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  FormControl,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate, useSearchParams } from "react-router-dom";

// B1 – Global Search (v2, with Trips + Incidents, tabs, and filters)
// Route: /admin/search

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
  trips: "#3b82f6",
  incidents: "#ef4444",
};

// Sample data
const SAMPLE_RIDERS = [
  { id: "RDR-001", name: "John Okello", city: "Kampala", phone: "+256 700 000 000", status: "Active" },
  { id: "RDR-002", name: "Jane Doe", city: "Nairobi", phone: "+254 711 111 111", status: "Active" },
  { id: "RDR-003", name: "Samuel K.", city: "Lagos", phone: "+234 800 000 000", status: "Pending" },
];

const SAMPLE_DRIVERS = [
  { id: "DRV-001", name: "Michael Driver", city: "Kampala", vehicle: "EV Car", rating: 4.92, status: "Active" },
  { id: "DRV-002", name: "Sarah K.", city: "Lagos", vehicle: "EV Bike", rating: 4.78, status: "Active" },
];

const SAMPLE_COMPANIES = [
  { id: "CMP-001", name: "GreenMove Fleet", city: "Kampala", drivers: 85, status: "Active" },
  { id: "CMP-002", name: "Sunrise Logistics", city: "Accra", drivers: 34, status: "Pending" },
];

const SAMPLE_TRIPS = [
  { id: "TRP-001", rider: "John Okello", driver: "Michael Driver", route: "Kampala CBD → Ntinda", status: "Completed", date: "2025-01-07" },
  { id: "TRP-002", rider: "Jane Doe", driver: "Sarah K.", route: "Lagos Island → Ikeja", status: "In Progress", date: "2025-01-08" },
  { id: "TRP-003", rider: "Samuel K.", driver: "Michael Driver", route: "Kampala → Entebbe", status: "Cancelled", date: "2025-01-06" },
];

const SAMPLE_INCIDENTS = [
  { id: "INC-001", type: "Accident", user: "Michael Driver", city: "Kampala", severity: "High", date: "2025-01-07" },
  { id: "INC-002", type: "Harassment", user: "John Okello", city: "Lagos", severity: "Medium", date: "2025-01-06" },
  { id: "INC-003", type: "Lost Item", user: "Jane Doe", city: "Nairobi", severity: "Low", date: "2025-01-05" },
];

export default function AdminGlobalSearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get("query") || "";

  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState(queryParam);
  
  // Filter states
  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  const tabs = [
    { label: "All", count: SAMPLE_RIDERS.length + SAMPLE_DRIVERS.length + SAMPLE_COMPANIES.length + SAMPLE_TRIPS.length + SAMPLE_INCIDENTS.length },
    { label: "Riders", count: SAMPLE_RIDERS.length },
    { label: "Drivers", count: SAMPLE_DRIVERS.length },
    { label: "Companies", count: SAMPLE_COMPANIES.length },
    { label: "Trips", count: SAMPLE_TRIPS.length },
    { label: "Incidents", count: SAMPLE_INCIDENTS.length },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "completed":
        return "success";
      case "pending":
      case "in progress":
        return "warning";
      case "suspended":
      case "cancelled":
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "default";
    }
  };

  const renderEntityPanel = (title: string, color: string, items: any[], onClick: () => void) => (
    <Card
      elevation={2}
      onClick={onClick}
      sx={{
        borderRadius: 2,
        cursor: 'pointer',
        border: `1px solid ${color}44`,
        bgcolor: "background.paper",
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        }
      }}
    >
      <CardContent className="p-4 flex flex-col gap-2">
        <Box className="flex items-center justify-between">
          <Typography variant="subtitle2" className="font-semibold" color="text.primary">
            {title}
          </Typography>
          <Chip size="small" label={`${items.length} matches`} sx={{ fontSize: 10 }} />
        </Box>
        <Divider className="!my-1" />
        <Box className="flex flex-col gap-1 text-[12px]">
          {items.slice(0, 2).map((item, idx) => (
            <Box key={idx} className="flex flex-col rounded-md px-2 py-1 hover:bg-black/5">
              <span className="font-medium">{item.name || item.id}</span>
              <span className="text-[11px] text-slate-600">
                {item.city || item.route || item.type} · {item.phone || item.vehicle || `${item.drivers} drivers` || item.rider || item.user}
              </span>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );

  const renderAllTab = () => (
    <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {renderEntityPanel("Riders", EV_COLORS.primary, SAMPLE_RIDERS, () => navigate('/admin/riders'))}
      {renderEntityPanel("Drivers", EV_COLORS.secondary, SAMPLE_DRIVERS, () => navigate('/admin/drivers'))}
      {renderEntityPanel("Companies", "#94a3b8", SAMPLE_COMPANIES, () => navigate('/admin/companies'))}
      {renderEntityPanel("Trips", EV_COLORS.trips, SAMPLE_TRIPS, () => navigate('/admin/ops'))}
      {renderEntityPanel("Incidents", EV_COLORS.incidents, SAMPLE_INCIDENTS, () => navigate('/admin/risk'))}
    </Box>
  );

  const renderRidersTab = () => (
    <TableContainer component={Paper} elevation={0} sx={{ mt: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>City</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {SAMPLE_RIDERS.map((rider) => (
            <TableRow key={rider.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/riders/${rider.id}`)}>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{rider.id}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{rider.name}</TableCell>
              <TableCell>{rider.city}</TableCell>
              <TableCell>{rider.phone}</TableCell>
              <TableCell><Chip size="small" label={rider.status} color={getStatusColor(rider.status)} sx={{ fontSize: 10 }} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderDriversTab = () => (
    <TableContainer component={Paper} elevation={0} sx={{ mt: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>City</TableCell>
            <TableCell>Vehicle</TableCell>
            <TableCell>Rating</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {SAMPLE_DRIVERS.map((driver) => (
            <TableRow key={driver.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/drivers/${driver.id}`)}>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{driver.id}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{driver.name}</TableCell>
              <TableCell>{driver.city}</TableCell>
              <TableCell>{driver.vehicle}</TableCell>
              <TableCell>{driver.rating}</TableCell>
              <TableCell><Chip size="small" label={driver.status} color={getStatusColor(driver.status)} sx={{ fontSize: 10 }} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderCompaniesTab = () => (
    <TableContainer component={Paper} elevation={0} sx={{ mt: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>City</TableCell>
            <TableCell>Drivers</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {SAMPLE_COMPANIES.map((company) => (
            <TableRow key={company.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/companies/${company.id}`)}>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{company.id}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{company.name}</TableCell>
              <TableCell>{company.city}</TableCell>
              <TableCell>{company.drivers}</TableCell>
              <TableCell><Chip size="small" label={company.status} color={getStatusColor(company.status)} sx={{ fontSize: 10 }} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderTripsTab = () => (
    <TableContainer component={Paper} elevation={0} sx={{ mt: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Trip ID</TableCell>
            <TableCell>Rider</TableCell>
            <TableCell>Driver</TableCell>
            <TableCell>Route</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {SAMPLE_TRIPS.map((trip) => (
            <TableRow key={trip.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/ops?trip=${trip.id}`)}>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{trip.id}</TableCell>
              <TableCell>{trip.rider}</TableCell>
              <TableCell>{trip.driver}</TableCell>
              <TableCell>{trip.route}</TableCell>
              <TableCell>{trip.date}</TableCell>
              <TableCell><Chip size="small" label={trip.status} color={getStatusColor(trip.status)} sx={{ fontSize: 10 }} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderIncidentsTab = () => (
    <TableContainer component={Paper} elevation={0} sx={{ mt: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Incident ID</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>User</TableCell>
            <TableCell>City</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Severity</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {SAMPLE_INCIDENTS.map((incident) => (
            <TableRow key={incident.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/risk/${incident.id}`)}>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{incident.id}</TableCell>
              <TableCell>{incident.type}</TableCell>
              <TableCell>{incident.user}</TableCell>
              <TableCell>{incident.city}</TableCell>
              <TableCell>{incident.date}</TableCell>
              <TableCell><Chip size="small" label={incident.severity} color={getStatusColor(incident.severity)} sx={{ fontSize: 10 }} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: return renderAllTab();
      case 1: return renderRidersTab();
      case 2: return renderDriversTab();
      case 3: return renderCompaniesTab();
      case 4: return renderTripsTab();
      case 5: return renderIncidentsTab();
      default: return renderAllTab();
    }
  };

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
            Global Search
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Find riders, drivers, companies, trips and incidents across all regions.
          </Typography>
        </Box>
      </Box>

      {/* Search Bar */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search across all entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": { borderRadius: 2 },
            }}
          />
        </CardContent>
      </Card>

      {/* Admin Filter Row */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Filters:
          </Typography>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              displayEmpty
              sx={{ fontSize: 12, borderRadius: 2, height: 36 }}
            >
              <MenuItem value="all">All Regions</MenuItem>
              <MenuItem value="kla">Kampala</MenuItem>
              <MenuItem value="lagos">Lagos</MenuItem>
              <MenuItem value="nairobi">Nairobi</MenuItem>
              <MenuItem value="accra">Accra</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
              sx={{ fontSize: 12, borderRadius: 2, height: 36 }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              displayEmpty
              sx={{ fontSize: 12, borderRadius: 2, height: 36 }}
            >
              <MenuItem value="all">All Services</MenuItem>
              <MenuItem value="rides">Rides</MenuItem>
              <MenuItem value="deliveries">Deliveries</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': { textTransform: 'none', minHeight: 48 },
          }}
        >
          {tabs.map((tab, idx) => (
            <Tab
              key={tab.label}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {tab.label}
                  <Chip
                    size="small"
                    label={tab.count}
                    sx={{
                      fontSize: 10,
                      height: 20,
                      bgcolor: activeTab === idx ? 'primary.main' : 'action.selected',
                      color: activeTab === idx ? 'white' : 'text.primary',
                    }}
                  />
                </Box>
              }
            />
          ))}
        </Tabs>
        <CardContent>
          {renderTabContent()}
        </CardContent>
      </Card>
    </Box>
  );
}
