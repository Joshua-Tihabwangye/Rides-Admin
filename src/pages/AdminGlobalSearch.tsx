import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import type { ChipProps, SelectChangeEvent } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  isAdminBackendEnabled,
  listAdminCompanies,
  listAdminDrivers,
  listAdminRiders,
  listAdminRides,
  listAdminSafetyEmergencies,
} from "../services/api/adminApi";
import type {
  AdminCompanyResponse,
  AdminDriverResponse,
  AdminRideListItemResponse,
  AdminRiderResponse,
  AdminSafetyIncident,
} from "../services/api/adminApi";

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
  trips: "#3b82f6",
  incidents: "#ef4444",
};

type TabKey = "all" | "riders" | "drivers" | "companies" | "trips" | "incidents";
type RegionFilter = "all" | string;
type StatusFilter = "all" | "active" | "pending" | "suspended" | "completed" | "cancelled" | "open";
type ServiceFilter = "all" | "rides";

type SearchRow = {
  id: string;
  displayId: string;
  title: string;
  city: string;
  status: string;
  subtitle?: string;
};

type RideRow = SearchRow & {
  rider: string;
  driver: string;
  route: string;
  date: string;
};

type IncidentRow = SearchRow & {
  user: string;
  type: string;
  date: string;
  severity: string;
};

const TAB_KEYS: TabKey[] = ["all", "riders", "drivers", "companies", "trips", "incidents"];
function displayId(prefix: string, id: string) {
  return `${prefix}-${id.slice(0, 8)}`;
}

function textMatches(value: unknown, query: string) {
  return String(value ?? "").toLowerCase().includes(query);
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function riderName(rider: AdminRiderResponse) {
  return (
    rider.fullName ||
    `${rider.firstName ?? ""} ${rider.lastName ?? ""}`.trim() ||
    rider.email ||
    rider.phone ||
    "Unnamed rider"
  );
}

function normalizeUserStatus(status?: string) {
  if (status === "active") return "Active";
  if (status === "suspended") return "Suspended";
  if (status === "deleted") return "Deleted";
  return "Pending";
}

function normalizeIncidentStatus(status?: string) {
  if (!status) return "Open";
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function incidentLocation(incident: AdminSafetyIncident) {
  if (incident.address) return incident.address;
  if (incident.latitude != null && incident.longitude != null) {
    return `${Number(incident.latitude).toFixed(4)}, ${Number(incident.longitude).toFixed(4)}`;
  }
  return "Unknown";
}

function routeLabel(ride: AdminRideListItemResponse) {
  if (ride.riderName && ride.driverName) return `${ride.riderName} to ${ride.driverName}`;
  if (ride.riderName) return `${ride.riderName} ride`;
  if (ride.driverName) return `Driver ${ride.driverName}`;
  return ride.category || ride.tripType || ride.mode || "Ride";
}

function readArray<T>(value: unknown, keys: string[] = ["items", "data"]): T[] {
  if (Array.isArray(value)) return value as T[];
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const nested = record[key];
    if (Array.isArray(nested)) return nested as T[];
    if (nested && typeof nested === "object") {
      const nestedItems = readArray<T>(nested, keys);
      if (nestedItems.length) return nestedItems;
    }
  }
  return [];
}

function getStatusColor(status: string): ChipProps["color"] {
  switch (status.toLowerCase()) {
    case "active":
    case "completed":
    case "resolved":
      return "success";
    case "pending":
    case "in progress":
    case "open":
    case "investigating":
      return "warning";
    case "suspended":
    case "deleted":
    case "cancelled":
    case "failed":
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
      return "info";
    default:
      return "default";
  }
}

export default function AdminGlobalSearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const backendMode = isAdminBackendEnabled();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("all");
  const [riders, setRiders] = useState<SearchRow[]>([]);
  const [drivers, setDrivers] = useState<SearchRow[]>([]);
  const [companies, setCompanies] = useState<SearchRow[]>([]);
  const [trips, setTrips] = useState<RideRow[]>([]);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!backendMode) {
      setRiders([]);
      setDrivers([]);
      setCompanies([]);
      setTrips([]);
      setIncidents([]);
      setError("Admin backend is disabled, so global search cannot load live data.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [backendRiders, backendDrivers, backendCompanies, ridePage, incidentPage] = await Promise.all([
        listAdminRiders(),
        listAdminDrivers(),
        listAdminCompanies(),
        listAdminRides({ page: 1, limit: 100, search: searchQuery.trim() || undefined }),
        listAdminSafetyEmergencies({ page: 1, limit: 100 }),
      ]);

      setRiders(readArray<AdminRiderResponse>(backendRiders).map(mapRider));
      setDrivers(readArray<AdminDriverResponse>(backendDrivers).map(mapDriver));
      setCompanies(readArray<AdminCompanyResponse>(backendCompanies).map(mapCompany));
      setTrips(readArray<AdminRideListItemResponse>(ridePage).map(mapRide));
      setIncidents(readArray<AdminSafetyIncident>(incidentPage).map(mapIncident));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load global search data");
      setRiders([]);
      setDrivers([]);
      setCompanies([]);
      setTrips([]);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [backendMode, searchQuery]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const query = searchQuery.trim().toLowerCase();

  const filterBySearch = useCallback(
    <T extends SearchRow>(items: T[], fields: Array<keyof T>) => {
      if (!query) return items;
      return items.filter((item) => fields.some((field) => textMatches(item[field], query)));
    },
    [query],
  );

  const filterByRegion = useCallback(
    <T extends SearchRow>(items: T[]) => {
      if (regionFilter === "all") return items;
      const region = regionFilter.toLowerCase();
      return items.filter((item) => item.city.toLowerCase().includes(region));
    },
    [regionFilter],
  );

  const filterByStatus = useCallback(
    <T extends SearchRow>(items: T[]) => {
      if (statusFilter === "all") return items;
      return items.filter((item) => item.status.toLowerCase() === statusFilter);
    },
    [statusFilter],
  );

  const filteredRiders = filterByStatus(filterByRegion(filterBySearch(riders, ["title", "subtitle", "city", "displayId"])));
  const filteredDrivers = filterByStatus(filterByRegion(filterBySearch(drivers, ["title", "subtitle", "city", "displayId"])));
  const filteredCompanies = filterByStatus(filterByRegion(filterBySearch(companies, ["title", "subtitle", "city", "displayId"])));
  const filteredTrips =
    serviceFilter === "all" || serviceFilter === "rides"
      ? filterByStatus(filterByRegion(filterBySearch(trips, ["title", "rider", "driver", "route", "displayId"])))
      : [];
  const filteredIncidents = filterByStatus(
    filterByRegion(filterBySearch(incidents, ["title", "user", "type", "city", "displayId"])),
  );

  const tabs = useMemo(
    () => [
      {
        key: "all" as const,
        label: "All",
        count:
          filteredRiders.length +
          filteredDrivers.length +
          filteredCompanies.length +
          filteredTrips.length +
          filteredIncidents.length,
      },
      { key: "riders" as const, label: "Riders", count: filteredRiders.length },
      { key: "drivers" as const, label: "Drivers", count: filteredDrivers.length },
      { key: "companies" as const, label: "Companies", count: filteredCompanies.length },
      { key: "trips" as const, label: "Trips", count: filteredTrips.length },
      { key: "incidents" as const, label: "Incidents", count: filteredIncidents.length },
    ],
    [filteredCompanies.length, filteredDrivers.length, filteredIncidents.length, filteredRiders.length, filteredTrips.length],
  );

  const tabIndex = TAB_KEYS.indexOf(activeTab);
  const regionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [...riders, ...drivers, ...companies, ...trips, ...incidents]
            .map((item) => item.city.trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [companies, drivers, incidents, riders, trips],
  );

  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Global Search
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Find riders, drivers, companies, trips and incidents across live admin datasets.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => void loadData()}
          disabled={loading}
          sx={{ textTransform: "none", borderRadius: 999, fontSize: 12 }}
        >
          Refresh
        </Button>
      </Box>

      {error ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search live admin records..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
        </CardContent>
      </Card>

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Filters:
          </Typography>

          <FormControl size="small" sx={{ minWidth: 136 }}>
            <Select value={regionFilter} onChange={(event: SelectChangeEvent) => setRegionFilter(event.target.value as RegionFilter)}>
              <MenuItem value="all">All Regions</MenuItem>
              {regionOptions.map((region) => (
                <MenuItem key={region} value={region}>
                  {region}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 136 }}>
            <Select value={statusFilter} onChange={(event: SelectChangeEvent) => setStatusFilter(event.target.value as StatusFilter)}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="open">Open</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 136 }}>
            <Select value={serviceFilter} onChange={(event: SelectChangeEvent) => setServiceFilter(event.target.value as ServiceFilter)}>
              <MenuItem value="all">All Services</MenuItem>
              <MenuItem value="rides">Rides</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2 }}>
        <Tabs
          value={Math.max(tabIndex, 0)}
          onChange={(_, value: number) => setActiveTab(TAB_KEYS[value] ?? "all")}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": { textTransform: "none", minHeight: 48 },
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.key}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {tab.label}
                  <Chip size="small" label={tab.count} sx={{ fontSize: 10, height: 20 }} />
                </Box>
              }
            />
          ))}
        </Tabs>
        <CardContent>{loading ? <LoadingState /> : renderTabContent(activeTab)}</CardContent>
      </Card>
    </Box>
  );

  function renderTabContent(tab: TabKey) {
    switch (tab) {
      case "all":
        return (
          <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            {renderEntityPanel("Riders", EV_COLORS.primary, filteredRiders, () => navigate("/admin/riders"))}
            {renderEntityPanel("Drivers", EV_COLORS.secondary, filteredDrivers, () => navigate("/admin/drivers"))}
            {renderEntityPanel("Companies", "#94a3b8", filteredCompanies, () => navigate("/admin/companies"))}
            {renderEntityPanel("Trips", EV_COLORS.trips, filteredTrips, () => navigate("/admin/rides"))}
            {renderEntityPanel("Incidents", EV_COLORS.incidents, filteredIncidents, () => navigate("/admin/safety"))}
          </Box>
        );
      case "riders":
        return (
          <EntityTable
            rows={filteredRiders}
            columns={["Name", "City", "Phone", "Status"]}
            emptyText="No riders found matching your search criteria"
            onRowClick={(row) => navigate(`/admin/riders/${row.id}`)}
            renderCells={(row) => (
              <>
                <TableCell sx={{ fontWeight: 600 }}>{row.title}</TableCell>
                <TableCell>{row.city}</TableCell>
                <TableCell>{row.subtitle || "-"}</TableCell>
                <TableCell>
                  <StatusChip status={row.status} />
                </TableCell>
              </>
            )}
          />
        );
      case "drivers":
        return (
          <EntityTable
            rows={filteredDrivers}
            columns={["Name", "City", "Vehicle", "Status"]}
            emptyText="No drivers found matching your search criteria"
            onRowClick={(row) => navigate(`/admin/drivers/${row.id}`)}
            renderCells={(row) => (
              <>
                <TableCell sx={{ fontWeight: 600 }}>{row.title}</TableCell>
                <TableCell>{row.city}</TableCell>
                <TableCell>{row.subtitle || "-"}</TableCell>
                <TableCell>
                  <StatusChip status={row.status} />
                </TableCell>
              </>
            )}
          />
        );
      case "companies":
        return (
          <EntityTable
            rows={filteredCompanies}
            columns={["Name", "Primary Region", "Contact", "Status"]}
            emptyText="No companies found matching your search criteria"
            onRowClick={(row) => navigate(`/admin/companies/${row.id}`)}
            renderCells={(row) => (
              <>
                <TableCell sx={{ fontWeight: 600 }}>{row.title}</TableCell>
                <TableCell>{row.city}</TableCell>
                <TableCell>{row.subtitle || "-"}</TableCell>
                <TableCell>
                  <StatusChip status={row.status} />
                </TableCell>
              </>
            )}
          />
        );
      case "trips":
        return (
          <EntityTable
            rows={filteredTrips}
            columns={["Rider", "Driver", "Route", "Date", "Status"]}
            emptyText="No trips found matching your search criteria"
            onRowClick={(row) => navigate(`/admin/rides/${row.id}`)}
            renderCells={(row) => (
              <>
                <TableCell>{row.rider}</TableCell>
                <TableCell>{row.driver}</TableCell>
                <TableCell>{row.route}</TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell>
                  <StatusChip status={row.status} />
                </TableCell>
              </>
            )}
          />
        );
      case "incidents":
        return (
          <EntityTable
            rows={filteredIncidents}
            columns={["Type", "User", "Location", "Date", "Status"]}
            emptyText="No incidents found matching your search criteria"
            onRowClick={(row) => navigate(`/admin/safety/${row.id}`)}
            renderCells={(row) => (
              <>
                <TableCell>{row.type}</TableCell>
                <TableCell>{row.user}</TableCell>
                <TableCell>{row.city}</TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell>
                  <StatusChip status={row.severity} />
                </TableCell>
              </>
            )}
          />
        );
      default:
        return null;
    }
  }

  function renderEntityPanel(title: string, color: string, items: SearchRow[], onClick: () => void) {
    return (
      <Card
        elevation={2}
        onClick={onClick}
        sx={{
          borderRadius: 2,
          cursor: "pointer",
          border: `1px solid ${color}44`,
          bgcolor: "background.paper",
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: 4,
          },
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
            {items.slice(0, 2).map((item) => (
              <Box key={item.id} className="flex flex-col rounded-md px-2 py-1 hover:bg-black/5">
                <span className="font-medium">{item.title}</span>
                <span style={{ color: "var(--ev-text-secondary, #64748b)" }} className="text-[11px]">
                  {item.city} · {item.subtitle || item.displayId}
                </span>
                <StatusChip status={item.status} />
              </Box>
            ))}
            {items.length === 0 ? (
              <Typography variant="caption" color="text.secondary" sx={{ py: 1 }}>
                No results found
              </Typography>
            ) : null}
          </Box>
        </CardContent>
      </Card>
    );
  }
}

function mapRider(rider: AdminRiderResponse): SearchRow {
  const id = rider.userId || rider.id;
  return {
    id,
    displayId: displayId("RDR", id),
    title: riderName(rider),
    city: rider.city || rider.country || "Unknown",
    status: normalizeUserStatus(rider.status),
    subtitle: rider.phone || rider.email || undefined,
  };
}

function mapDriver(driver: AdminDriverResponse): SearchRow {
  const id = driver.userId || driver.driverId;
  return {
    id,
    displayId: displayId("DRV", id),
    title: driver.fullName || `${driver.firstName ?? ""} ${driver.lastName ?? ""}`.trim() || driver.phone || "Unnamed driver",
    city: driver.city || "Unknown",
    status: normalizeUserStatus(driver.status),
    subtitle: [driver.vehicleType, driver.model, driver.licensePlate].filter(Boolean).join(" · ") || driver.phone,
  };
}

function mapCompany(company: AdminCompanyResponse): SearchRow {
  const verticals = Object.entries(company.verticals ?? {})
    .filter(([, enabled]) => enabled)
    .map(([vertical]) => vertical);
  return {
    id: company.id,
    displayId: displayId("CMP", company.id),
    title: company.companyName,
    city: verticals.length ? verticals.join(", ") : "Company",
    status: normalizeUserStatus(company.status),
    subtitle: company.contactEmail || company.contactPhone || verticals.join(", ") || undefined,
  };
}

function mapRide(ride: AdminRideListItemResponse): RideRow {
  const rider = ride.riderName || ride.riderId || "Unassigned rider";
  const driver = ride.driverName || ride.driverId || "Unassigned driver";
  const route = routeLabel(ride);
  return {
    id: ride.id,
    displayId: displayId("TRP", ride.id),
    title: route,
    city: ride.tripType || ride.category || ride.mode || "Rides",
    status: normalizeIncidentStatus(ride.status),
    subtitle: ride.currency && ride.estimatedFare != null ? `${ride.currency} ${ride.estimatedFare.toLocaleString()}` : ride.paymentStatus,
    rider,
    driver,
    route,
    date: formatDate(ride.scheduledAt || ride.createdAt),
  };
}

function mapIncident(incident: AdminSafetyIncident): IncidentRow {
  const status = normalizeIncidentStatus(incident.status);
  return {
    id: incident.id,
    displayId: displayId("SOS", incident.id),
    title: incident.sos ? `SOS · ${incident.type}` : incident.type,
    city: incidentLocation(incident),
    status,
    subtitle: incident.serviceId || incident.reporterUserId,
    user: incident.reporterUserId || "Unknown",
    type: incident.sos ? `SOS · ${incident.type}` : incident.type,
    date: formatDate(incident.createdAt),
    severity: status,
  };
}

function StatusChip({ status }: { status: string }) {
  return (
    <Chip
      size="small"
      label={status}
      color={getStatusColor(status)}
      sx={{ fontSize: 10, height: 20, width: "fit-content", mt: 0.5 }}
    />
  );
}

function LoadingState() {
  return (
    <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
      <CircularProgress size={28} />
    </Box>
  );
}

function EntityTable<T extends SearchRow>({
  rows,
  columns,
  emptyText,
  onRowClick,
  renderCells,
}: {
  rows: T[];
  columns: string[];
  emptyText: string;
  onRowClick: (row: T) => void;
  renderCells: (row: T) => React.ReactNode;
}) {
  return (
    <TableContainer component={Paper} elevation={0} sx={{ mt: 2, bgcolor: "background.paper", borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            {columns.map((column) => (
              <TableCell key={column}>{column}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 4, color: "text.secondary" }}>
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id} hover sx={{ cursor: "pointer" }} onClick={() => onRowClick(row)}>
                <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>{row.displayId}</TableCell>
                {renderCells(row)}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
