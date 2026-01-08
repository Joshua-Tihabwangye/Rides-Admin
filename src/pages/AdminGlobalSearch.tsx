// @ts-nocheck
import React, { useState, useMemo } from "react";
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
import { getRiders, getDrivers } from "../lib/peopleStore";

// B1 – Global Search (v2, with Trips + Incidents, tabs, and filters)
// Route: /admin/search

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
  trips: "#3b82f6",
  incidents: "#ef4444",
};

// Companies data stored in localStorage for consistency across pages
const COMPANIES_KEY = 'evzone_admin_companies';

const seedCompanies = [
  {
    id: 1,
    name: "GreenMove Fleet",
    regions: "Kampala, Entebbe",
    type: "Fleet Partner",
    drivers: 12,
    vehicles: 12,
    commission: "12%",
    status: "Active",
  },
  {
    id: 2,
    name: "City Cabs Co.",
    regions: "Kigali",
    type: "Taxi Fleet",
    drivers: 45,
    vehicles: 40,
    commission: "15%",
    status: "Active",
  },
  {
    id: 3,
    name: "Blue Delivery",
    regions: "Nairobi",
    type: "Logistics",
    drivers: 120,
    vehicles: 115,
    commission: "10%",
    status: "Suspended",
  },
  {
    id: 4,
    name: "Swift Riders",
    regions: "Lagos",
    type: "Fleet Partner",
    drivers: 78,
    vehicles: 65,
    commission: "14%",
    status: "Inactive",
  },
];

function getCompanies() {
  try {
    const stored = localStorage.getItem(COMPANIES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return seedCompanies;
}

// Trips and Incidents are derived from riders and drivers data
function generateTrips(riders, drivers) {
  const trips = [];
  const statuses = ["Completed", "In Progress", "Cancelled"];
  const cities = ["Kampala", "Lagos", "Nairobi", "Kigali", "Accra"];
  
  riders.forEach((rider, idx) => {
    if (rider.trips > 0) {
      const driver = drivers[idx % drivers.length];
      trips.push({
        id: `TRP-${String(rider.id).padStart(3, '0')}`,
        rider: rider.name,
        driver: driver?.name || "Unassigned",
        route: `${rider.city} CBD → ${cities[(idx + 1) % cities.length]}`,
        status: statuses[idx % statuses.length],
        date: new Date(Date.now() - idx * 86400000).toISOString().split('T')[0],
        city: rider.city,
      });
    }
  });
  return trips;
}

function generateIncidents(riders, drivers) {
  const incidents = [];
  const types = ["Accident", "Harassment", "Lost Item", "Vehicle Issue", "Payment Dispute"];
  const severities = ["High", "Medium", "Low"];
  
  // Generate incidents for high-risk users
  [...riders, ...drivers].forEach((user, idx) => {
    if (user.risk === "High" || idx % 5 === 0) {
      incidents.push({
        id: `INC-${String(user.id).padStart(3, '0')}`,
        type: types[idx % types.length],
        user: user.name,
        city: user.city,
        severity: user.risk === "High" ? "High" : severities[idx % severities.length],
        date: new Date(Date.now() - idx * 86400000).toISOString().split('T')[0],
      });
    }
  });
  return incidents;
}

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

  // Get data from stores
  const allRiders = useMemo(() => getRiders(), []);
  const allDrivers = useMemo(() => getDrivers(), []);
  const allCompanies = useMemo(() => getCompanies(), []);
  const allTrips = useMemo(() => generateTrips(allRiders, allDrivers), [allRiders, allDrivers]);
  const allIncidents = useMemo(() => generateIncidents(allRiders, allDrivers), [allRiders, allDrivers]);

  // Transform data to display format
  const riders = useMemo(() => allRiders.map(r => ({
    id: `RDR-${String(r.id).padStart(3, '0')}`,
    rawId: r.id,
    name: r.name,
    city: r.city,
    phone: r.phone,
    status: r.primaryStatus === 'approved' ? 'Active' : r.primaryStatus === 'under_review' ? 'Pending' : 'Suspended',
  })), [allRiders]);

  const drivers = useMemo(() => allDrivers.map(d => ({
    id: `DRV-${String(d.id).padStart(3, '0')}`,
    rawId: d.id,
    name: d.name,
    city: d.city,
    vehicle: d.vehicle,
    rating: 4.5 + Math.random() * 0.5,
    status: d.primaryStatus === 'approved' ? 'Active' : d.primaryStatus === 'under_review' ? 'Pending' : 'Suspended',
  })), [allDrivers]);

  const companies = useMemo(() => allCompanies.map(c => ({
    id: `CMP-${String(c.id).padStart(3, '0')}`,
    rawId: c.id,
    name: c.name,
    city: c.regions?.split(',')[0]?.trim() || 'Unknown',
    drivers: c.drivers,
    status: c.status,
  })), [allCompanies]);

  // Filter data based on search and filters
  const filterBySearch = (items, fields) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      fields.some(field => String(item[field] || '').toLowerCase().includes(query))
    );
  };

  const filterByRegion = (items) => {
    if (regionFilter === 'all') return items;
    const regionMap = { kla: 'Kampala', lagos: 'Lagos', nairobi: 'Nairobi', accra: 'Accra', kigali: 'Kigali' };
    const region = regionMap[regionFilter] || regionFilter;
    return items.filter(item => item.city?.toLowerCase().includes(region.toLowerCase()));
  };

  const filterByStatus = (items) => {
    if (statusFilter === 'all') return items;
    return items.filter(item => item.status?.toLowerCase() === statusFilter.toLowerCase());
  };

  const filteredRiders = filterByStatus(filterByRegion(filterBySearch(riders, ['name', 'phone', 'city', 'id'])));
  const filteredDrivers = filterByStatus(filterByRegion(filterBySearch(drivers, ['name', 'city', 'vehicle', 'id'])));
  const filteredCompanies = filterByStatus(filterByRegion(filterBySearch(companies, ['name', 'city', 'id'])));
  const filteredTrips = filterByStatus(filterByRegion(filterBySearch(allTrips, ['rider', 'driver', 'route', 'id'])));
  const filteredIncidents = filterByRegion(filterBySearch(allIncidents, ['user', 'type', 'city', 'id']));

  const tabs = [
    { label: "All", count: filteredRiders.length + filteredDrivers.length + filteredCompanies.length + filteredTrips.length + filteredIncidents.length },
    { label: "Riders", count: filteredRiders.length },
    { label: "Drivers", count: filteredDrivers.length },
    { label: "Companies", count: filteredCompanies.length },
    { label: "Trips", count: filteredTrips.length },
    { label: "Incidents", count: filteredIncidents.length },
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
                {item.city || item.route || item.type} · {item.phone || item.vehicle || (item.drivers ? `${item.drivers} drivers` : '') || item.rider || item.user}
              </span>
              <Chip 
                size="small" 
                label={item.status || item.severity} 
                color={getStatusColor(item.status || item.severity)} 
                sx={{ fontSize: 9, height: 18, width: 'fit-content', mt: 0.5 }} 
              />
            </Box>
          ))}
          {items.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ py: 1 }}>
              No results found
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const renderAllTab = () => (
    <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {renderEntityPanel("Riders", EV_COLORS.primary, filteredRiders, () => navigate('/admin/riders'))}
      {renderEntityPanel("Drivers", EV_COLORS.secondary, filteredDrivers, () => navigate('/admin/drivers'))}
      {renderEntityPanel("Companies", "#94a3b8", filteredCompanies, () => navigate('/admin/companies'))}
      {renderEntityPanel("Trips", EV_COLORS.trips, filteredTrips, () => navigate('/admin/ops'))}
      {renderEntityPanel("Incidents", EV_COLORS.incidents, filteredIncidents, () => navigate('/admin/risk'))}
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
          {filteredRiders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                No riders found matching your search criteria
              </TableCell>
            </TableRow>
          ) : (
            filteredRiders.map((rider) => (
              <TableRow key={rider.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/riders/${rider.rawId}`)}>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{rider.id}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{rider.name}</TableCell>
                <TableCell>{rider.city}</TableCell>
                <TableCell>{rider.phone}</TableCell>
                <TableCell><Chip size="small" label={rider.status} color={getStatusColor(rider.status)} sx={{ fontSize: 10 }} /></TableCell>
              </TableRow>
            ))
          )}
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
          {filteredDrivers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                No drivers found matching your search criteria
              </TableCell>
            </TableRow>
          ) : (
            filteredDrivers.map((driver) => (
              <TableRow key={driver.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/drivers/${driver.rawId}`)}>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{driver.id}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{driver.name}</TableCell>
                <TableCell>{driver.city}</TableCell>
                <TableCell>{driver.vehicle}</TableCell>
                <TableCell>{driver.rating.toFixed(2)}</TableCell>
                <TableCell><Chip size="small" label={driver.status} color={getStatusColor(driver.status)} sx={{ fontSize: 10 }} /></TableCell>
              </TableRow>
            ))
          )}
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
          {filteredCompanies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                No companies found matching your search criteria
              </TableCell>
            </TableRow>
          ) : (
            filteredCompanies.map((company) => (
              <TableRow key={company.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/companies/${company.rawId}`)}>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{company.id}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{company.name}</TableCell>
                <TableCell>{company.city}</TableCell>
                <TableCell>{company.drivers}</TableCell>
                <TableCell><Chip size="small" label={company.status} color={getStatusColor(company.status)} sx={{ fontSize: 10 }} /></TableCell>
              </TableRow>
            ))
          )}
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
          {filteredTrips.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                No trips found matching your search criteria
              </TableCell>
            </TableRow>
          ) : (
            filteredTrips.map((trip) => (
              <TableRow key={trip.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/ops?trip=${trip.id}`)}>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{trip.id}</TableCell>
                <TableCell>{trip.rider}</TableCell>
                <TableCell>{trip.driver}</TableCell>
                <TableCell>{trip.route}</TableCell>
                <TableCell>{trip.date}</TableCell>
                <TableCell><Chip size="small" label={trip.status} color={getStatusColor(trip.status)} sx={{ fontSize: 10 }} /></TableCell>
              </TableRow>
            ))
          )}
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
          {filteredIncidents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                No incidents found matching your search criteria
              </TableCell>
            </TableRow>
          ) : (
            filteredIncidents.map((incident) => (
              <TableRow key={incident.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/risk/${incident.id}`)}>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{incident.id}</TableCell>
                <TableCell>{incident.type}</TableCell>
                <TableCell>{incident.user}</TableCell>
                <TableCell>{incident.city}</TableCell>
                <TableCell>{incident.date}</TableCell>
                <TableCell><Chip size="small" label={incident.severity} color={getStatusColor(incident.severity)} sx={{ fontSize: 10 }} /></TableCell>
              </TableRow>
            ))
          )}
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
              <MenuItem value="kigali">Kigali</MenuItem>
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
