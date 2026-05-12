import React, { useState, useEffect } from"react";
import { useNavigate } from"react-router-dom";
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
  CircularProgress,
} from"@mui/material";
import SearchIcon from"@mui/icons-material/Search";
import MoreVertIcon from"@mui/icons-material/MoreVert";
import StatusBadge from"../components/StatusBadge";
import { listAdminCompanies, patchAdminCompany } from"../services/api/adminApi";
import type { AdminCompanyResponse } from"../services/api/adminApi";

type CompanyRecord = {
  id: string;
  name: string;
  regions: string;
  type: string;
  drivers: number;
  vehicles: number;
  commission: string;
  status: "Active" | "Inactive" | "Pending" | "Suspended";
};

export default function CompanyList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminCompanies();
      const mapped: CompanyRecord[] = data.map((company) => ({
        id: company.id,
        name: company.companyName,
        regions: "Multiple regions", // backend doesn't provide regions directly, could be derived
        type: "Fleet Partner",
        drivers: 0, // TODO: fetch from backend if needed
        vehicles: 0,
        commission: "N/A",
        status: company.status === "approved" ? "Active" : company.status === "pending" ? "Pending" : company.status === "suspended" ? "Suspended" : "Inactive",
      }));
      setCompanies(mapped);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleRowClick = (id: string) => {
    navigate(`/admin/companies/${id}`);
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, companyId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedCompanyId(companyId);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedCompanyId(null);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (selectedCompanyId) {
      try {
        const backendStatus = newStatus === "Active" ? "approved" : newStatus === "Suspended" ? "suspended" : "pending";
        await patchAdminCompany(selectedCompanyId, { status: backendStatus });
        setCompanies(prev => prev.map(company => 
          company.id === selectedCompanyId 
            ? { ...company, status: newStatus as CompanyRecord['status'] }
            : company
        ));
        const companyName = companies.find(c => c.id === selectedCompanyId)?.name;
        setSnackbar({ 
          open: true, 
          message: `${companyName} status changed to ${newStatus}`,
          severity: 'success'
        });
      } catch (e: any) {
        setSnackbar({ 
          open: true, 
          message: `Failed to update status: ${e?.message}`,
          severity: 'error'
        });
      }
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
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
          sx={{ textTransform:"none", borderRadius: 2 }}
        >
          Company Approvals
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display:"flex", gap: 2, alignItems:"center", flexWrap:"wrap", p: 2 }}>
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
            sx={{ width: 300,"& .MuiOutlinedInput-root": { borderRadius: 8 } }}
          />
          <Box sx={{ display:"flex", gap: 1 }}>
            {["All","Active","Inactive","Pending","Suspended"].map((status) => (
              <Chip
                key={status}
                label={status}
                onClick={() => setActiveTab(status)}
                color={activeTab === status ?"primary" :"default"}
                sx={{ borderRadius: 2, height: 32 }}
                variant={activeTab === status ?"filled" :"outlined"}
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
                  sx={{ cursor:"pointer" }}
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
