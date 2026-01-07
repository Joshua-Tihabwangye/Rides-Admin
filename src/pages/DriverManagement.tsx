import React, { useState, useEffect } from "react";
import {
  Box,
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
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import { getDrivers, DriverRecord } from "../lib/peopleStore";

export default function DriverManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);

  useEffect(() => {
    setDrivers(getDrivers());
  }, [location.key]);

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(search.toLowerCase()) ||
      driver.phone.includes(search);
    const matchesTab =
      activeTab === "All" ||
      (activeTab === "Approved" && driver.primaryStatus === "approved") ||
      (activeTab === "Under review" && driver.primaryStatus === "under_review") ||
      (activeTab === "Suspended" && driver.primaryStatus === "suspended");
    // Only show car drivers
    const matchesVehicle = driver.vehicleType === "Car";
    return matchesSearch && matchesTab && matchesVehicle;
  });

  const handleRowClick = (id: number) => {
    navigate(`/admin/drivers/${id}`);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Driver Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage driver accounts, view trip history, and monitor risk profiles.
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", p: 2 }}>
          <TextField
            size="small"
            placeholder="Search drivers..."
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
              {filteredDrivers.map((driver) => (
                <TableRow
                  key={driver.id}
                  hover
                  onClick={() => handleRowClick(driver.id)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                    <DirectionsCarIcon fontSize="small" color="primary" />
                    {driver.name}
                  </TableCell>
                  <TableCell>{driver.phone}</TableCell>
                  <TableCell>{driver.city}</TableCell>
                  <TableCell>{driver.vehicle}</TableCell>
                  <TableCell align="right">{driver.trips}</TableCell>
                  <TableCell align="right">{driver.spend}</TableCell>
                  <TableCell>
                    <StatusBadge status={driver.primaryStatus} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={driver.activityStatus === "active" ? "active" : "inactive"}
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
