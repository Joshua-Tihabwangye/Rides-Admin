import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EmailIcon from "@mui/icons-material/Email";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import SearchIcon from "@mui/icons-material/Search";
import StatusBadge from "../components/StatusBadge";
import { listAdminRiders, patchAdminRider } from "../services/api/adminApi";
import type { AdminRiderResponse } from "../services/api/adminApi";

type RiderRecord = {
  backendId: string;
  name: string;
  phone: string;
  email: string;
  joinedAt?: string | number;
  trips: number;
  status: AdminRiderResponse["status"];
};

function riderName(rider: AdminRiderResponse) {
  return rider.fullName || `${rider.firstName || ""} ${rider.lastName || ""}`.trim() || rider.email || rider.phone || "Unnamed rider";
}

function formatDate(value?: string | number) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-UG", { dateStyle: "medium" });
}

function statusLabel(status: AdminRiderResponse["status"]) {
  if (status === "active") return "Active";
  if (status === "suspended") return "Suspended";
  return "Deleted";
}

export default function RiderManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminRiderResponse["status"]>("all");
  const [riders, setRiders] = useState<RiderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);

  const fetchRiders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminRiders();
      setRiders((Array.isArray(data) ? data : []).map((rider) => ({
        backendId: rider.riderId || rider.userId || rider.id,
        name: riderName(rider),
        phone: rider.phone || "",
        email: rider.email || "",
        joinedAt: rider.createdAt,
        trips: rider.totalTrips || 0,
        status: rider.status,
      })));
    } catch (err: any) {
      setError(err?.message ?? "Failed to load riders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRiders();
  }, [location.key]);

  const stats = useMemo(() => ({
    all: riders.length,
    active: riders.filter((rider) => rider.status === "active").length,
    suspended: riders.filter((rider) => rider.status === "suspended").length,
    deleted: riders.filter((rider) => rider.status === "deleted").length,
    trips: riders.reduce((sum, rider) => sum + rider.trips, 0),
  }), [riders]);

  const filteredRiders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return riders.filter((rider) => {
      const matchesSearch = !query || [rider.name, rider.phone, rider.email, rider.backendId].some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || rider.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [riders, search, statusFilter]);

  const selectedRider = selectedRiderId ? riders.find((rider) => rider.backendId === selectedRiderId) : undefined;

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, backendId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRiderId(backendId);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedRiderId(null);
  };

  const handleStatusToggle = async () => {
    if (!selectedRider) return;
    try {
      await patchAdminRider(selectedRider.backendId, { status: selectedRider.status === "active" ? "suspended" : "active" });
      await fetchRiders();
    } catch (err: any) {
      setError(err?.message ?? "Failed to update rider status");
    } finally {
      handleActionClose();
    }
  };

  if (loading && riders.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Rider Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Rider accounts for clients using the ride-hailing app.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} sx={{ textTransform: "none", borderRadius: 999 }} onClick={() => navigate("/admin/riders/new")}>
          Create rider
        </Button>
      </Stack>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        <SummaryCard icon={<PersonIcon />} label="Total riders" value={stats.all} onClick={() => setStatusFilter("all")} active={statusFilter === "all"} />
        <SummaryCard icon={<PersonIcon />} label="Active" value={stats.active} onClick={() => setStatusFilter("active")} active={statusFilter === "active"} />
        <SummaryCard icon={<PersonIcon />} label="Suspended" value={stats.suspended} onClick={() => setStatusFilter("suspended")} active={statusFilter === "suspended"} />
        <SummaryCard icon={<CalendarTodayIcon />} label="Recorded trips" value={stats.trips} />
      </Box>

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", p: 2 }}>
          <TextField
            size="small"
            placeholder="Search riders by name, phone, email, or ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: "100%", md: 380 }, "& .MuiOutlinedInput-root": { borderRadius: 8 } }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} sx={{ fontSize: 12, borderRadius: 2, height: 36 }}>
              <MenuItem value="all">All statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="deleted">Deleted</MenuItem>
            </Select>
          </FormControl>
          <Chip size="small" label={`${filteredRiders.length} shown`} />
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2 }}>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rider ID</TableCell>
                <TableCell>Rider</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Trips</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRiders.map((rider) => (
                <TableRow key={rider.backendId} hover onClick={() => navigate(`/admin/riders/${rider.backendId}`)} sx={{ cursor: "pointer" }}>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 11, color: "text.secondary" }}>{rider.backendId}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{rider.name}</Typography>
                    <Typography variant="caption" color="text.secondary">Client account</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.25}>
                      <Typography variant="body2">{rider.phone || "-"}</Typography>
                      <Typography variant="caption" color="text.secondary">{rider.email || "-"}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{formatDate(rider.joinedAt)}</TableCell>
                  <TableCell align="right">{rider.trips.toLocaleString()}</TableCell>
                  <TableCell><StatusBadge status={rider.status === "active" ? "active" : rider.status} /></TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={(event) => handleActionClick(event, rider.backendId)}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filteredRiders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: "text.secondary" }}>No riders match the current filters.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleActionClose}>
        <MenuItem onClick={() => { if (selectedRiderId) navigate(`/admin/riders/${selectedRiderId}`); handleActionClose(); }}>View details</MenuItem>
        <MenuItem disabled={!selectedRider?.phone} onClick={() => { if (selectedRider?.phone) window.location.href = `tel:${selectedRider.phone}`; handleActionClose(); }}>
          <PhoneIcon fontSize="small" sx={{ mr: 1 }} /> Call rider
        </MenuItem>
        <MenuItem disabled={!selectedRider?.email} onClick={() => { if (selectedRider?.email) window.location.href = `mailto:${selectedRider.email}`; handleActionClose(); }}>
          <EmailIcon fontSize="small" sx={{ mr: 1 }} /> Email rider
        </MenuItem>
        <MenuItem onClick={() => void handleStatusToggle()} sx={{ color: selectedRider?.status === "active" ? "error.main" : "success.main" }}>
          {selectedRider?.status === "active" ? "Suspend account" : "Activate account"}
        </MenuItem>
      </Menu>
    </Box>
  );
}

function SummaryCard({ icon, label, value, onClick, active }: { icon: React.ReactNode; label: string; value: number; onClick?: () => void; active?: boolean }) {
  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        borderRadius: 2,
        cursor: onClick ? "pointer" : "default",
        borderColor: active ? "#03cd8c" : "divider",
        bgcolor: active ? "rgba(3, 205, 140, 0.06)" : "background.paper",
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 1.5, bgcolor: "rgba(3, 205, 140, 0.12)", color: "#029b6d" }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
            <Typography variant="h5" fontWeight={800}>{value.toLocaleString()}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
