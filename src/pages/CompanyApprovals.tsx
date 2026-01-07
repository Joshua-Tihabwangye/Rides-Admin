// @ts-nocheck
import React, { useState, useMemo } from "react";
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import RestoreIcon from "@mui/icons-material/Restore";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import StatusBadge from "../components/StatusBadge";

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

// Sample companies with different statuses
const SAMPLE_COMPANIES = [
  {
    id: 1,
    name: "GreenMove Fleet",
    regions: "Kampala, Entebbe",
    type: "Fleet Partner",
    drivers: 12,
    vehicles: 12,
    commission: "12%",
    status: "pending",
    appliedDate: "2024-01-15",
  },
  {
    id: 2,
    name: "City Cabs Co.",
    regions: "Kigali",
    type: "Taxi Fleet",
    drivers: 45,
    vehicles: 40,
    commission: "15%",
    status: "pending",
    appliedDate: "2024-01-20",
  },
  {
    id: 3,
    name: "Blue Delivery",
    regions: "Nairobi",
    type: "Logistics",
    drivers: 120,
    vehicles: 115,
    commission: "10%",
    status: "suspended",
    appliedDate: "2023-12-10",
    suspendedDate: "2024-01-05",
  },
  {
    id: 4,
    name: "Sunrise Logistics",
    regions: "Accra",
    type: "Logistics",
    drivers: 85,
    vehicles: 80,
    commission: "11%",
    status: "pending",
    appliedDate: "2024-01-22",
  },
  {
    id: 5,
    name: "FastTrack Transport",
    regions: "Lagos",
    type: "Fleet Partner",
    drivers: 200,
    vehicles: 195,
    commission: "13%",
    status: "suspended",
    appliedDate: "2023-11-15",
    suspendedDate: "2024-01-10",
  },
];

export default function CompanyApprovals() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [companies, setCompanies] = useState(SAMPLE_COMPANIES);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, companyId: number) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedCompany(companyId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCompany(null);
  };

  const handleAction = (action: "approve" | "suspend" | "recall", companyId: number) => {
    setCompanies((prev) =>
      prev.map((company) => {
        if (company.id === companyId) {
          if (action === "approve") {
            return { ...company, status: "active" as const };
          } else if (action === "suspend") {
            return { ...company, status: "suspended" as const, suspendedDate: new Date().toISOString().split("T")[0] };
          } else if (action === "recall") {
            return { ...company, status: "active" as const, suspendedDate: undefined };
          }
        }
        return company;
      })
    );
    handleMenuClose();
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const matchesSearch = company.name.toLowerCase().includes(search.toLowerCase());
      const matchesTab =
        activeTab === "All" ||
        (activeTab === "Pending" && company.status === "pending") ||
        (activeTab === "Suspended" && company.status === "suspended") ||
        (activeTab === "Active" && company.status === "active");
      return matchesSearch && matchesTab;
    });
  }, [companies, search, activeTab]);

  const handleRowClick = (id: number) => {
    navigate(`/admin/companies/${id}`);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Company Approvals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review, approve, suspend, or recall company applications and accounts.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => navigate("/admin/companies")}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          View All Companies
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
            {["All", "Pending", "Suspended", "Active"].map((status) => (
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
                <TableCell>Applied Date</TableCell>
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
                    <StatusBadge
                      status={
                        company.status === "pending"
                          ? "under_review"
                          : company.status === "suspended"
                            ? "suspended"
                            : "approved"
                      }
                    />
                  </TableCell>
                  <TableCell>{company.appliedDate}</TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, company.id)}
                      sx={{ color: "text.secondary" }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCompanies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3, color: "text.secondary" }}>
                    No companies found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {selectedCompany && (
          <>
            {companies.find((c) => c.id === selectedCompany)?.status === "pending" && (
              <MenuItem
                onClick={() => handleAction("approve", selectedCompany)}
                sx={{ color: EV_COLORS.primary }}
              >
                <CheckCircleIcon sx={{ mr: 1, fontSize: 18 }} />
                Approve
              </MenuItem>
            )}
            {companies.find((c) => c.id === selectedCompany)?.status !== "suspended" && (
              <MenuItem
                onClick={() => handleAction("suspend", selectedCompany)}
                sx={{ color: EV_COLORS.secondary }}
              >
                <BlockIcon sx={{ mr: 1, fontSize: 18 }} />
                Suspend
              </MenuItem>
            )}
            {companies.find((c) => c.id === selectedCompany)?.status === "suspended" && (
              <MenuItem
                onClick={() => handleAction("recall", selectedCompany)}
                sx={{ color: EV_COLORS.primary }}
              >
                <RestoreIcon sx={{ mr: 1, fontSize: 18 }} />
                Recall
              </MenuItem>
            )}
          </>
        )}
      </Menu>
    </Box>
  );
}
