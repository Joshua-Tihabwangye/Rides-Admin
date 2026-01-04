import React, { useState } from "react";
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
import { useNavigate } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import SearchIcon from "@mui/icons-material/Search";

const SAMPLE_DRIVERS = [
  {
    id: 201,
    name: "Michael Driver",
    phone: "+256 701 111 111",
    city: "Kampala",
    vehicle: "EV Car · UAX 123X",
    trips: 420,
    status: "Active",
  },
  {
    id: 202,
    name: "Sarah K.",
    phone: "+234 801 222 2222",
    city: "Lagos",
    vehicle: "EV Bike · L-321",
    trips: 215,
    status: "Active",
  },
  {
    id: 203,
    name: "Peter L.",
    phone: "+254 702 333 333",
    city: "Nairobi",
    vehicle: "EV Car · KAX 456L",
    trips: 35,
    status: "Under Review",
  },
];


import { useSearchParams } from "react-router-dom"; // Add import

export default function DriverManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  // React to query tab
  React.useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "review") setActiveTab("Under Review");
    else if (tab) setActiveTab(tab);
  }, [searchParams]);

  const filteredDrivers = SAMPLE_DRIVERS.filter((driver) => {
    const matchesSearch = driver.name.toLowerCase().includes(search.toLowerCase()) ||
      driver.phone.includes(search);
    const matchesTab = activeTab === "All" || driver.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleRowClick = (id: number) => {
    navigate(`/admin/drivers/${id}`);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Driver Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage driver applications, vehicle compliance, and performance.
        </Typography>
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
            {["All", "Active", "Under Review", "Suspended"].map((status) => (
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
                <TableCell>Status</TableCell>
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
                  <TableCell sx={{ fontWeight: 600 }}>{driver.name}</TableCell>
                  <TableCell>{driver.phone}</TableCell>
                  <TableCell>{driver.city}</TableCell>
                  <TableCell>{driver.vehicle}</TableCell>
                  <TableCell align="right">{driver.trips}</TableCell>
                  <TableCell>
                    <StatusBadge status={driver.status} />
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
