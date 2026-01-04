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

const SAMPLE_RIDERS = [
  {
    id: 101,
    name: "Alice Johnson",
    phone: "+250 788 123 456",
    city: "Kigali",
    trips: 15,
    spend: "$240",
    status: "Active",
    risk: "Low",
  },
  {
    id: 102,
    name: "Bob Smith",
    phone: "+250 788 654 321",
    city: "Kigali",
    trips: 3,
    spend: "$45",
    status: "New",
    risk: "Low",
  },
  {
    id: 103,
    name: "Charlie Brown",
    phone: "+250 788 987 654",
    city: "Musanze",
    trips: 0,
    spend: "$0",
    status: "Suspended",
    risk: "High",
  },
];


export default function RiderManagement() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const filteredRiders = SAMPLE_RIDERS.filter((rider) => {
    const matchesSearch = rider.name.toLowerCase().includes(search.toLowerCase()) ||
      rider.phone.includes(search);
    const matchesTab = activeTab === "All" || rider.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleRowClick = (id: number) => {
    navigate(`/admin/riders/${id}`);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Rider Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage rider accounts, view trip history, and monitor risk profiles.
        </Typography>
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
            {["All", "Active", "New", "Suspended"].map((status) => (
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
                <TableCell align="right">Trips</TableCell>
                <TableCell align="right">Lifetime Spend</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Risk</TableCell>
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
                  <TableCell sx={{ fontWeight: 600 }}>{rider.name}</TableCell>
                  <TableCell>{rider.phone}</TableCell>
                  <TableCell>{rider.city}</TableCell>
                  <TableCell align="right">{rider.trips}</TableCell>
                  <TableCell align="right">{rider.spend}</TableCell>
                  <TableCell>
                    <StatusBadge status={rider.status} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rider.risk}
                      size="small"
                      color={rider.risk === 'High' ? 'error' : 'default'}
                      variant="outlined"
                      sx={{ height: 24, fontSize: 11 }}
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
