import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import SearchIcon from "@mui/icons-material/Search";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import AddIcon from "@mui/icons-material/Add";
import { getRiders, RiderRecord, createRider } from "../lib/peopleStore";

export default function RiderManagement() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [riders, setRiders] = useState<RiderRecord[]>([]);

  const location = useLocation();

  useEffect(() => {
    setRiders(getRiders());
  }, [location.key]);

  const filteredRiders = riders.filter((rider) => {
    const matchesSearch =
      rider.name.toLowerCase().includes(search.toLowerCase()) ||
      rider.phone.includes(search);
    const matchesTab =
      activeTab === "All" ||
      (activeTab === "Approved" && rider.primaryStatus === "approved") ||
      (activeTab === "Under review" && rider.primaryStatus === "under_review") ||
      (activeTab === "Suspended" && rider.primaryStatus === "suspended");
    // Only show bike riders
    const matchesVehicle = rider.vehicleType === "Bike";
    return matchesSearch && matchesTab && matchesVehicle;
  });

  const handleRowClick = (id: number) => {
    navigate(`/admin/riders/${id}`);
  };

  const handleAddRider = () => {
    const record = createRider({
      name: "New rider",
      phone: "+000 000 000",
      city: "Kampala",
      trips: 0,
      spend: "$0",
      risk: "Low",
      primaryStatus: "under_review",
      activityStatus: "inactive",
    });
    setRiders(getRiders());
    navigate(`/admin/riders/${record.id}`);
  };

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
        {/* Add Rider Button */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ textTransform: "none", borderRadius: 999 }}
          onClick={() => navigate('/admin/riders/new')}
        >
          Add rider
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", p: 2 }}>
          <TextField
            size="small"
            placeholder="Search riders..."
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
            {["All", "Approved", "Under review", "Suspended"].map((status) => (
              <Chip
                key={status}
                label={status}
                onClick={() => setActiveTab(status)}
                color={activeTab === status ? "primary" : "default"}
                sx={{ borderRadius: 2, height: 32 }}
                variant={activeTab === status ? "filled" : "outlined"}
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
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell align="right">Trips</TableCell>
                <TableCell align="right">Lifetime Spend</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Activity</TableCell>
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
                  <TableCell sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                    <TwoWheelerIcon fontSize="small" color="success" />
                    {rider.name}
                  </TableCell>
                  <TableCell>{rider.phone}</TableCell>
                  <TableCell>{rider.city}</TableCell>
                  <TableCell>{rider.vehicle}</TableCell>
                  <TableCell align="right">{rider.trips}</TableCell>
                  <TableCell align="right">{rider.spend}</TableCell>
                  <TableCell>
                    <StatusBadge status={rider.primaryStatus} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={rider.activityStatus === "active" ? "active" : "inactive"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
