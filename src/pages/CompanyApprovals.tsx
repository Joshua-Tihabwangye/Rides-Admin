import React, { useState, useEffect, useMemo } from"react";
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
  CircularProgress,
  Alert,
  Snackbar,
} from"@mui/material";
import SearchIcon from"@mui/icons-material/Search";
import CheckCircleIcon from"@mui/icons-material/CheckCircle";
import BlockIcon from"@mui/icons-material/Block";
import RestoreIcon from"@mui/icons-material/Restore";
import MoreVertIcon from"@mui/icons-material/MoreVert";
import StatusBadge from"../components/StatusBadge";
import { listAdminApprovals, reviewAdminApproval } from"../services/api/adminApi";
import type { AdminApprovalResponse } from"../services/api/adminApi";

const EV_COLORS = {
  primary:"#03cd8c",
  secondary:"#f77f00",
};

export default function CompanyApprovals() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [approvals, setApprovals] = useState<AdminApprovalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const fetchApprovals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminApprovals();
      // Filter to company-related approvals if needed, or show all
      setApprovals(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, companyId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedCompany(companyId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCompany(null);
  };

  const handleAction = async (action: "approve" | "suspend" | "recall", approvalId: string) => {
    try {
      if (action === "approve" || action === "suspend") {
        await reviewAdminApproval(approvalId, { decision: action === "approve" ? "approved" : "rejected" });
      }
      // For recall, we might need a different endpoint; for now just update local state
      setApprovals(prev =>
        prev.map((approval) => {
          if (approval.id === approvalId) {
            if (action === "approve") return { ...approval, status: "approved" as const };
            if (action === "suspend") return { ...approval, status: "rejected" as const };
          }
          return approval;
        })
      );
       setSnackbar({ open: true, message: `Case ${approvalId} ${action === 'approve' ? 'Approved' : 'Suspended'}`, severity: 'success' });
    } catch (e: any) {
      setSnackbar({ open: true, message: `Failed: ${e?.message}`, severity: 'error' });
    }
    handleMenuClose();
  };

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const filteredApprovals = useMemo(() => {
    return approvals.filter((approval) => {
      const matchesSearch = approval.entityId.toLowerCase().includes(search.toLowerCase());
      const matchesTab =
        activeTab === "All" ||
        (activeTab === "Pending" && approval.status === "pending") ||
        (activeTab === "Suspended" && approval.status === "rejected") ||
        (activeTab === "Active" && approval.status === "approved");
      return matchesSearch && matchesTab;
    });
  }, [approvals, search, activeTab]);

  const handleRowClick = (id: string) => {
    navigate(`/admin/companies/${id}`);
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
            Company Approvals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review, approve, suspend, or recall company applications and accounts.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => navigate("/admin/companies")}
          sx={{ textTransform:"none", borderRadius: 2 }}
        >
          View All Companies
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
            {["All","Pending","Suspended","Active"].map((status) => (
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
                <TableCell>Applied Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredApprovals.map((approval) => (
                <TableRow
                  key={approval.id}
                  hover
                  onClick={() => handleRowClick(approval.entityId)}
                  sx={{ cursor:"pointer" }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>{approval.entityId}</TableCell>
                  <TableCell>N/A</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell align="right">-</TableCell>
                  <TableCell align="right">-</TableCell>
                  <TableCell align="right">-</TableCell>
                  <TableCell>
                    <StatusBadge
                      status={
                        approval.status === "pending"
                          ?"under_review"
                          : approval.status === "rejected"
                            ?"suspended"
                            :"approved"
                      }
                    />
                  </TableCell>
                  <TableCell>{new Date(approval.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, approval.id)}
                      sx={{ color:"text.secondary" }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredApprovals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3, color:"text.secondary" }}>
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
        anchorOrigin={{ vertical:"bottom", horizontal:"right" }}
        transformOrigin={{ vertical:"top", horizontal:"right" }}
      >
        {selectedCompany && (
          <>
            <MenuItem
              onClick={() => handleAction("approve", selectedCompany)}
              sx={{ color: EV_COLORS.primary }}
            >
              <CheckCircleIcon sx={{ mr: 1, fontSize: 18 }} />
              Approve
            </MenuItem>
            <MenuItem
              onClick={() => handleAction("suspend", selectedCompany)}
              sx={{ color: EV_COLORS.secondary }}
            >
              <BlockIcon sx={{ mr: 1, fontSize: 18 }} />
              Suspend
            </MenuItem>
            <MenuItem
              onClick={() => handleAction("recall", selectedCompany)}
              sx={{ color: EV_COLORS.primary }}
            >
              <RestoreIcon sx={{ mr: 1, fontSize: 18 }} />
              Recall
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Snackbar */}
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
