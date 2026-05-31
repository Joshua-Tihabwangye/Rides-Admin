import React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { isAdminBackendEnabled, listAdminApprovals, type AdminApprovalResponse } from "../services/api/adminApi";

type HistoryRow = {
  id: string;
  entity: string;
  type: string;
  action: "Approved" | "Rejected" | "Pending";
  date: string;
  actor: string;
};

function mapApprovalToRow(item: AdminApprovalResponse): HistoryRow {
  const action =
    item.status === "approved" ? "Approved" : item.status === "rejected" ? "Rejected" : "Pending";
  return {
    id: item.id,
    entity: item.entityId,
    type: item.entityType,
    action,
    date: new Date(item.reviewedAt ?? item.createdAt).toLocaleString(),
    actor: item.reviewedBy ?? item.requestedBy,
  };
}

export default function ApprovalsHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = React.useState<HistoryRow[]>([]);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: "", severity: "success" as "success" | "error" });

  React.useEffect(() => {
    const hydrate = async () => {
      if (!isAdminBackendEnabled()) {
        setHistory([]);
        setSnackbar({
          open: true,
          message: "Backend mode is disabled. Approval history requires backend connection.",
          severity: "error",
        });
        return;
      }

      try {
        const approvals = await listAdminApprovals();
        setHistory(approvals.map(mapApprovalToRow));
      } catch (error) {
        console.warn("Failed to load backend approvals history.", error);
        setHistory([]);
        setSnackbar({ open: true, message: "Failed to load backend approval history.", severity: "error" });
      }
    };

    void hydrate();
  }, []);

  return (
    <Box className="p-6">
      <Box className="flex items-center justify-between mb-4">
        <Box className="flex items-center gap-2">
          <Button
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/admin/approvals")}
            sx={{ color: "text.secondary", textTransform: "none" }}
          >
            Back to Queue
          </Button>
          <Typography variant="h6" className="font-semibold">
            Approval History
          </Typography>
        </Box>
      </Box>

      <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)" }}>
        <CardContent className="p-0">
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "background.default" }}>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8, color: "text.secondary" }}>
                      No approval history found.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">{row.id}</TableCell>
                      <TableCell className="font-medium">{row.entity}</TableCell>
                      <TableCell>{row.type}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.action}
                          size="small"
                          color={row.action === "Approved" ? "success" : row.action === "Rejected" ? "error" : "warning"}
                          variant="outlined"
                          sx={{ height: 24, borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">{row.date}</TableCell>
                      <TableCell className="text-slate-500 text-sm">{row.actor}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
