import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Chip,
  Button,
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
  Snackbar,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import StatusBadge from "../components/StatusBadge";

const INITIAL_COMPANIES = [
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

export default function CompanyList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [companies, setCompanies] = useState(INITIAL_COMPANIES);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });

  const handleRowClick = (id: number) => {
    navigate(`/admin/companies/${id}`);
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, companyId: number) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedCompanyId(companyId);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedCompanyId(null);
  };

  const handleStatusChange = (newStatus: string) => {
    if (selectedCompanyId) {
      setCompanies(prev => prev.map(company => 
        company.id === selectedCompanyId 
          ? { ...company, status: newStatus }
          : company
      ));
      const companyName = companies.find(c => c.id === selectedCompanyId)?.name;
      setSnackbar({ 
        open: true, 
        message: `${companyName} status changed to ${newStatus}`,
        severity: 'success'
      });
    }
    handleActionClose();
  };

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = company.name.toLowerCase().includes(search.toLowerCase());
    const matchesTab =
      activeTab === "All" ||
      (activeTab === "Active" && company.status === "Active") ||
      (activeTab === "Inactive" && company.status === "Inactive") ||
      (activeTab === "Pending" && company.status === "Pending") ||
      (activeTab === "Suspended" && company.status === "Suspended");
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "success";
      case "Inactive": return "default";
      case "Pending": return "warning";
      case "Suspended": return "error";
      default: return "default";
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Companies & Fleets
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage fleet partners, rental companies, and logistics providers.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate("/admin/companies/approvals")}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          Company Approvals
        </Button>
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
            {["All", "Active", "Inactive", "Pending", "Suspended"].map((status) => (
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
                <TableCell align="center">Actions</TableCell>
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
                    <Chip
                      size="small"
                      label={company.status}
                      color={getStatusColor(company.status)}
                      sx={{ fontSize: 11, height: 24 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleActionClick(e, company.id)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCompanies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No companies found.
                  </TableCell>
                </TableRow>
              )}
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
        <MenuItem 
          onClick={() => handleStatusChange("Active")}
          sx={{ color: 'success.main' }}
        >
          Set as Active
        </MenuItem>
        <MenuItem 
          onClick={() => handleStatusChange("Inactive")}
          sx={{ color: 'text.secondary' }}
        >
          Set as Inactive
        </MenuItem>
        <MenuItem 
          onClick={() => handleStatusChange("Suspended")}
          sx={{ color: 'error.main' }}
        >
          Suspend Company
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (selectedCompanyId) {
              navigate(`/admin/companies/${selectedCompanyId}`);
            }
            handleActionClose();
          }}
        >
          View Details
        </MenuItem>
      </Menu>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
