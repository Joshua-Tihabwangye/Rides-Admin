import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import SearchIcon from "@mui/icons-material/Search";
import StatusBadge from "../components/StatusBadge";

const SAMPLE_COMPANIES = [
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
];

export default function CompanyList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const handleRowClick = (id: number) => {
    navigate(`/admin/companies/${id}`);
  };

  const filteredCompanies = SAMPLE_COMPANIES.filter((company) => {
    const matchesSearch = company.name.toLowerCase().includes(search.toLowerCase());
    const matchesTab =
      activeTab === "All" ||
      (activeTab === "Active" && company.status === "Active") ||
      (activeTab === "Pending" && company.status === "Pending") ||
      (activeTab === "Suspended" && company.status === "Suspended");
    return matchesSearch && matchesTab;
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Companies & Fleets
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage fleet partners, rental companies, and logistics providers.
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", p: 2 }}>
          <TextField
            size="small"
            placeholder="Search companies..."
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
            {["All", "Active", "Pending", "Suspended"].map((status) => (
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
                <TableCell>Company</TableCell>
                <TableCell>Regions</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Drivers</TableCell>
                <TableCell align="right">Vehicles</TableCell>
                <TableCell align="right">Commission</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow
                  key={company.id}
                  hover
                  onClick={() => handleRowClick(company.id)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>{company.name}</TableCell>
                  <TableCell>{company.regions}</TableCell>
                  <TableCell>{company.type}</TableCell>
                  <TableCell align="right">{company.drivers}</TableCell>
                  <TableCell align="right">{company.vehicles}</TableCell>
                  <TableCell align="right">{company.commission}</TableCell>
                  <TableCell>
                    <StatusBadge status={company.status} />
                  </TableCell>
                </TableRow>
              ))}
              {filteredCompanies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No companies found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}