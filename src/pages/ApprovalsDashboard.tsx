import React, { useState, useEffect, useMemo } from"react";
import { useNavigate } from"react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Checkbox,
  Chip,
  Button,
  Divider,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Snackbar,
  Alert,
  CircularProgress,
} from"@mui/material";
import PeriodSelector from"../components/PeriodSelector";
import type { PeriodOption } from"../components/PeriodSelector";
import dayjs, { type Dayjs } from"dayjs";
import isBetween from"dayjs/plugin/isBetween";
import { listAdminApprovals, reviewAdminApproval } from"../services/api/adminApi";
import type { AdminApprovalResponse } from"../services/api/adminApi";

dayjs.extend(isBetween);

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

function AdminApprovalsLayout({ children }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography
            variant="h6"
            className="font-semibold tracking-tight"
            color="text.primary"
          >
            Approvals Dashboard
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Company onboarding, vehicles, driver escalations and policy
            exceptions in one queue.
          </Typography>
        </Box>
      </Box>
      <Box className="flex-1 flex flex-col gap-3">
        {children}
      </Box>
    </Box>
  );
}

type ApprovalItem = {
  id: string;
  entityType: string;
  entityId: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  reviewedBy: string | null;
  notes: string | null;
  createdAt: number;
  reviewedAt: number | null;
};

export default function ApprovalsDashboardPage() {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ type: 'All', severity: 'All', region: 'All' });
  const [period, setPeriod] = useState<PeriodOption>("today");
  const [customRange, setCustomRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({ open: false, msg: '', severity: 'success' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const data = await listAdminApprovals();
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

  const handleFilterChange = (field) => (e) => {
    setFilters(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleCaseClick = (approval: ApprovalItem) => {
    navigate(`/admin/approvals/${approval.id}`);
  };

  const handleActionClick = async (approval: ApprovalItem, action: "Approve" | "Reject") => {
    try {
      await reviewAdminApproval(approval.id, { decision: action === "Approve" ? "approved" : "rejected" });
      setApprovals(prev => prev.filter(a => a.id !== approval.id));
       setSnackbar({ open: true, msg: `Case ${approval.id} ${action === 'Approve' ? 'Approved' : 'Rejected'}`, severity: 'success' });
    } catch (e: any) {
      setSnackbar({ open: true, msg: `Failed: ${e?.message}`, severity: 'error' });
    }
  };

  const toggleSelected = (approvalId: string) => {
    setSelectedIds((prev) => prev.includes(approvalId) ? prev.filter((id) => id !== approvalId) : [...prev, approvalId]);
  };

  const exportCsv = () => {
    const rows = [
      ["ID", "Type", "Entity", "Status", "Requested By", "Reviewed By", "Created At"],
      ...filteredApprovals.map((approval) => [
        approval.id,
        approval.entityType,
        approval.entityId,
        approval.status,
        approval.requestedBy,
        approval.reviewedBy || "",
        new Date(approval.createdAt).toISOString(),
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "approvals.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const bulkReview = async (decision: "approved" | "rejected") => {
    const targets = approvals.filter((approval) => selectedIds.includes(approval.id) && approval.status === "pending");
    if (targets.length === 0) return;
    try {
      await Promise.all(targets.map((approval) => reviewAdminApproval(approval.id, { decision })));
      setApprovals((prev) => prev.filter((approval) => !selectedIds.includes(approval.id)));
      setSelectedIds([]);
      setSnackbar({ open: true, msg: `${targets.length} approval${targets.length === 1 ? "" : "s"} ${decision}`, severity: "success" });
    } catch (err: any) {
      setSnackbar({ open: true, msg: err?.message ?? "Bulk review failed", severity: "error" });
    }
  };

  const filteredApprovals = approvals.filter(a => {
    const itemDate = dayjs(a.createdAt);
    let inPeriod = true;
    const now = dayjs();

    if (period === 'today') {
      inPeriod = itemDate.isSame(now, 'day');
    } else if (period === '7days') {
      inPeriod = itemDate.isAfter(now.subtract(7, 'day'));
    } else if (period === 'thisMonth') {
      inPeriod = itemDate.isSame(now, 'month');
    } else if (period === 'custom' && customRange[0] && customRange[1]) {
      inPeriod = itemDate.isBetween(customRange[0], customRange[1], 'day', '[]');
    }

    if (!inPeriod) return false;

    if (filters.type !== 'All' && a.entityType !== filters.type.toLowerCase()) return false;
    if (filters.severity !== 'All') {
      // severity filter not directly in approval type; maybe map to something else; skip for now
    }
    if (filters.region !== 'All') {
      // region filter not in approval entity; could be extracted from entity; skip
    }
    return true;
  });

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
    <AdminApprovalsLayout>
      {/* Filters row */}
      <Card
        elevation={1}
        sx={{
          border: "1px solid rgba(148,163,184,0.5)",
        }}
      >
        <CardContent className="p-3 flex flex-col gap-3">
          <Box className="flex flex-col md:flex-row gap-3 items-center">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="type-select">Type</InputLabel>
              <Select labelId="type-select" label="Type" value={filters.type} onChange={handleFilterChange('type')}>
                <MenuItem value="All">All Types</MenuItem>
                <MenuItem value="Company">Company</MenuItem>
                <MenuItem value="Driver">Driver</MenuItem>
                <MenuItem value="Vehicle">Vehicle</MenuItem>
                <MenuItem value="Document">Document</MenuItem>
              </Select>
            </FormControl>
            <Button
              size="small"
              variant="outlined"
              sx={{ textTransform: "none" }}
              onClick={exportCsv}
            >
              Export CSV
            </Button>
            <Button
              size="small"
              variant="contained"
              sx={{ textTransform: "none", bgcolor: EV_COLORS.primary, "&:hover": { bgcolor: "#0fb589" } }}
              disabled={selectedIds.length === 0}
              onClick={() => void bulkReview("approved")}
            >
              Approve selected
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              sx={{ textTransform: "none" }}
              disabled={selectedIds.length === 0}
              onClick={() => void bulkReview("rejected")}
            >
              Reject selected
            </Button>
            <Box className="ml-auto">
              <Button
                variant="text"
                size="small"
                onClick={() => navigate('/admin/approvals/history')}
                sx={{ textTransform: 'none' }}
              >
                View History
              </Button>
            </Box>
          </Box>
          <Box className="flex justify-end">
            <PeriodSelector
              value={period}
              onChange={(newPeriod, customRange) => {
                setPeriod(newPeriod);
                if (customRange) {
                  setCustomRange([customRange.start, customRange.end]);
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Approvals list */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filteredApprovals.length === 0 && <Typography className="p-4 text-slate-500 italic">No approvals found matching filters.</Typography>}
        {filteredApprovals.map((approval) => (
          <Card
            key={approval.id}
            elevation={1}
            sx={{
              border: "1px solid rgba(148,163,184,0.5)",
              outline: selectedIds.includes(approval.id) ? `2px solid ${EV_COLORS.primary}` : "none",
            }}
          >
            <CardContent
              className="p-4 flex flex-col gap-2 cursor-pointer"
              onClick={() => handleCaseClick(approval)}
            >
              <Box className="flex items-center justify-between gap-2">
                <Box className="flex items-start gap-2">
                  <Checkbox
                    checked={selectedIds.includes(approval.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleSelected(approval.id)}
                    size="small"
                  />
                  <Box>
                    <Typography
                      variant="caption"
                      className="text-[11px] text-slate-500"
                    >
                      {approval.id}
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      className="font-semibold"
                    >
                      {approval.entityId}
                    </Typography>
                  </Box>
                </Box>
                <Box className="flex flex-col items-end gap-1">
                  <Chip
                    size="small"
                    label={approval.entityType}
                    sx={{ fontSize: 10, height: 22 }}
                  />
                  <Chip
                    size="small"
                    label={new Date(approval.createdAt).toLocaleTimeString()}
                    sx={{ fontSize: 10, height: 22 }}
                  />
                </Box>
              </Box>

              <Typography
                variant="body2"
                className="text-[12px] text-slate-500"
              >
                {approval.notes || "No additional notes"}
              </Typography>

              <Box className="flex items-center justify-between mt-1">
                <Typography
                  variant="caption"
                  className="text-[11px] text-slate-500"
                >
                  Status: {approval.status}
                </Typography>
                <Box className="flex gap-1">
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      fontSize: 11,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick(approval, "Reject");
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      fontSize: 11,
                      bgcolor: EV_COLORS.primary,
                      "&:hover": { bgcolor: "#0fb589" },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick(approval, "Approve");
                    }}
                  >
                    Approve
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>
      </Snackbar>
    </AdminApprovalsLayout >
  );
}
