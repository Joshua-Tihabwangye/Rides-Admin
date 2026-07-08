import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import {
  listAdminPendingDriverDocuments,
  listAdminPendingVehicleDocuments,
  reviewAdminDriverDocument,
  reviewAdminVehicleDocument,
  type AdminPendingDocument,
} from "../services/api/adminApi";

export default function DocumentReviewPage() {
  const [tab, setTab] = useState<"driver" | "vehicle">("driver");
  const [driverDocs, setDriverDocs] = useState<AdminPendingDocument[]>([]);
  const [vehicleDocs, setVehicleDocs] = useState<AdminPendingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDoc, setSelectedDoc] = useState<AdminPendingDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [driverResult, vehicleResult] = await Promise.all([
        listAdminPendingDriverDocuments(),
        listAdminPendingVehicleDocuments(),
      ]);
      setDriverDocs(driverResult.items || []);
      setVehicleDocs(vehicleResult.items || []);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load pending documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleReview = async (status: "verified" | "rejected") => {
    if (!selectedDoc) return;
    if (status === "rejected" && !rejectionReason.trim()) {
      setError("A rejection reason is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (tab === "driver") {
        await reviewAdminDriverDocument(selectedDoc.id, { status, rejectionReason });
      } else {
        await reviewAdminVehicleDocument(selectedDoc.id, { status, rejectionReason });
      }
      setSelectedDoc(null);
      setRejectionReason("");
      await load();
    } catch (err: any) {
      setError(err?.message ?? "Review failed");
    } finally {
      setSubmitting(false);
    }
  };

  const docs = tab === "driver" ? driverDocs : vehicleDocs;

  const formatDate = (value?: string) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Document Review
        </Typography>
        <Button variant="outlined" onClick={load} disabled={loading} startIcon={<RefreshIcon />}>
          Refresh
        </Button>
      </Box>

      {error ? <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert> : null}

      <Tabs value={tab} onChange={(_, value) => { setTab(value); setSelectedDoc(null); setRejectionReason(""); }} sx={{ mb: 3 }}>
        <Tab label={`Driver Documents (${driverDocs.length})`} value="driver" />
        <Tab label={`Vehicle Documents (${vehicleDocs.length})`} value="vehicle" />
      </Tabs>

      {loading ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {docs.map((doc) => (
            <Grid item xs={12} md={6} lg={4} key={doc.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {doc.type}
                    </Typography>
                    <Chip label={doc.status} size="small" color="warning" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {tab === "driver" ? `Driver: ${doc.driverId}` : `Vehicle: ${doc.vehicleId}`}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
                    Expires: {formatDate(doc.expiryDate)} · Submitted: {formatDate(doc.createdAt)}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      fullWidth
                    >
                      View Document
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      fullWidth
                      onClick={() => setSelectedDoc(doc)}
                    >
                      Review
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {!docs.length ? (
            <Grid item xs={12}>
              <Alert severity="info">No pending {tab} documents.</Alert>
            </Grid>
          ) : null}
        </Grid>
      )}

      <Dialog open={Boolean(selectedDoc)} onClose={() => setSelectedDoc(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Review {selectedDoc?.type}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {tab === "driver" ? `Driver ID: ${selectedDoc?.driverId}` : `Vehicle ID: ${selectedDoc?.vehicleId}`}
          </Typography>
          {selectedDoc?.fileUrl ? (
            <Button
              variant="outlined"
              href={selectedDoc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
              sx={{ mb: 2 }}
            >
              Open Document in New Tab
            </Button>
          ) : null}
          <TextField
            label="Rejection reason (required if rejecting)"
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDoc(null)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            startIcon={<CloseIcon />}
            disabled={submitting}
            onClick={() => handleReview("rejected")}
          >
            Reject
          </Button>
          <Button
            color="success"
            variant="contained"
            startIcon={<CheckIcon />}
            disabled={submitting}
            onClick={() => handleReview("verified")}
          >
            Verify
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
