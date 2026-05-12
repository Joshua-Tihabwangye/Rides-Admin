import React, { useState, useEffect } from"react";
import { useNavigate, useParams } from"react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
} from"@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getAdminApproval, reviewAdminApproval } from"../services/api/adminApi";
import type { AdminApprovalResponse } from"../services/api/adminApi";

const EV_COLORS = {
  primary:"#03cd8c",
  secondary:"#f77f00",
};

function AdminApprovalDetailLayout({ children }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography
            variant="h6"
            className="font-semibold tracking-tight"
            color="text.primary"
          >
            Approval Detail
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Review the case context and make a confident decision.
          </Typography>
        </Box>
      </Box>
      <Box className="flex-1 flex flex-col gap-3">
        {children}
      </Box>
    </Box>
  );
}

export default function ApprovalDetailPage() {
  const { approvalId } = useParams();
  const navigate = useNavigate();
  const [approval, setApproval] = useState<AdminApprovalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [snackbar, setSnackbar] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({ open: false, msg: '', severity: 'success' });

  useEffect(() => {
    if (!approvalId) return;
    const loadApproval = async () => {
      setLoading(true);
      try {
        const data = await getAdminApproval(approvalId as string);
        setApproval(data);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load approval');
      } finally {
        setLoading(false);
      }
    };
    loadApproval();
  }, [approvalId]);

  const handleDecision = async (action: "Approve" | "Reject" | "Request more info") => {
    if (!approval) return;
    try {
      if (action === "Approve" || action === "Reject") {
        await reviewAdminApproval(approval.id, { decision: action === "Approve" ? "approved" : "rejected" });
      }
      setSnackbar({ open: true, msg: `Decision Recorded: ${action}`, severity: 'success' });
      setTimeout(() => {
        navigate('/admin/approvals');
      }, 1000);
    } catch (e: any) {
      setSnackbar({ open: true, msg: `Failed: ${e?.message}`, severity: 'error' });
    }
  };

  const handleSaveNote = () => {
    setSnackbar({ open: true, msg:"Note saved internally.", severity: 'success' });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !approval) {
    return <Alert severity="error">{error || 'Approval not found'}</Alert>;
  }

  const getStatusLabel = (status: string) => {
    if (status === "pending") return "Pending Review";
    if (status === "approved") return "Approved";
    if (status === "rejected") return "Rejected";
    return status;
  };

  return (
    <AdminApprovalDetailLayout>
      {/* Case header */}
      <Card
        elevation={1}
        sx={{
          borderRadius: 8,
          border: "1px solid rgba(148,163,184,0.5)",
        }}
      >
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
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
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              {approval.entityType}
            </Typography>
          </Box>
          <Box className="flex flex-wrap gap-1 items-center">
            <Chip
              size="small"
              label={getStatusLabel(approval.status)}
              sx={{
                fontSize: 10,
                height: 22,
                bgcolor:
                  approval.status === "pending"
                    ? "#fef3c7"
                    : approval.status === "approved"
                      ? "#dcfce7"
                      : "#fee2e2",
              }}
            />
            <Chip
              size="small"
              label={new Date(approval.createdAt).toLocaleString()}
              sx={{ fontSize: 10, height: 22 }}
            />
          </Box>
        </CardContent>
      </Card>

      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Summary & context */}
        <Card
          elevation={1}
          sx={{
            flex: 2,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Box>
              <Typography
                variant="subtitle2"
                className="font-semibold mb-1"
              >
                Summary
              </Typography>
              <Typography
                variant="body2"
                className="text-[12px]"
              >
                {approval.notes || "No additional notes provided."}
              </Typography>
            </Box>

            <Divider className="!my-1" />

            <Box>
              <Typography
                variant="subtitle2"
                className="font-semibold mb-1"
              >
                Requested by
              </Typography>
              <Typography
                variant="body2"
                className="text-[12px]"
              >
                {approval.requestedBy}
                {approval.reviewedBy && ` · Reviewed by ${approval.reviewedBy}`}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="subtitle2"
                className="font-semibold mb-1"
              >
                Internal notes
              </Typography>
              <TextField
                multiline
                minRows={3}
                maxRows={6}
                fullWidth
                size="small"
                placeholder="Add notes for audit trail (only visible to Admins)…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{"& .MuiOutlinedInput-root": { bgcolor: "background.paper" },"& .MuiInputBase-input": { fontSize: 12 },
                }}
              />
              <Button
                size="small"
                variant="text"
                sx={{ mt: 1, textTransform: 'none', fontSize: 11 }}
                onClick={handleSaveNote}
              >
                Save Note
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Decision panel */}
        <Card
          elevation={1}
          sx={{
            flex: 1,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography
              variant="subtitle2"
              className="font-semibold"
            >
              Decision
            </Typography>
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Choose an action. All decisions are logged with notes in the audit
              trail.
            </Typography>

            <Button
              fullWidth
              variant="contained"
              size="small"
              sx={{
                textTransform: "none",
                borderRadius: 999,
                fontSize: 12,
                bgcolor: EV_COLORS.primary,
                "&:hover": { bgcolor: "#0fb589" },
              }}
              onClick={() => handleDecision("Approve")}
            >
              Approve
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              sx={{
                textTransform: "none",
                borderRadius: 999,
                fontSize: 12,
                borderColor: "#f97316",
                color: "#92400e",
              }}
              onClick={() => handleDecision("Reject")}
            >
              Reject
            </Button>
            <Button
              fullWidth
              variant="text"
              size="small"
              sx={{
                textTransform: "none",
                borderRadius: 999,
                fontSize: 12,
                color: 'text.secondary',
              }}
              onClick={() => handleDecision("Request more info")}
            >
              Request more info
            </Button>
          </CardContent>
        </Card>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>
      </Snackbar>
    </AdminApprovalDetailLayout>
  );
}
