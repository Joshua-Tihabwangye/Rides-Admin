import React, { useEffect, useMemo, useState } from "react";
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
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PersonIcon from "@mui/icons-material/Person";
import {
  listAdminPendingDriverDocuments,
  listAdminPendingVehicleDocuments,
  reviewAdminDriverDocument,
  reviewAdminVehicleDocument,
  type AdminPendingDocument,
} from "../services/api/adminApi";
import { openAdminDocument } from "../utils/openAdminDocument";

const EV_GREEN = "#03cd8c";
type DocTab = "driver" | "vehicle";

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function ownerLabel(tab: DocTab, doc: AdminPendingDocument) {
  return tab === "driver" ? doc.driverId || "-" : doc.vehicleId || "-";
}

function titleize(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function DocumentReviewPage() {
  const [tab, setTab] = useState<DocTab>("driver");
  const [driverDocs, setDriverDocs] = useState<AdminPendingDocument[]>([]);
  const [vehicleDocs, setVehicleDocs] = useState<AdminPendingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<AdminPendingDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [driverResult, vehicleResult] = await Promise.all([
        listAdminPendingDriverDocuments(1, 100),
        listAdminPendingVehicleDocuments(1, 100),
      ]);
      setDriverDocs(driverResult.items || []);
      setVehicleDocs(vehicleResult.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pending documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const docs = tab === "driver" ? driverDocs : vehicleDocs;
  const filteredDocs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return docs;
    return docs.filter((doc) => [doc.id, doc.type, doc.status, doc.driverId, doc.vehicleId].join(" ").toLowerCase().includes(query));
  }, [docs, search]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDocument = async (document: AdminPendingDocument) => {
    setError(null);
    try {
      await openAdminDocument(document);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open document");
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", pb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <DescriptionIcon sx={{ color: EV_GREEN }} />
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0 }}>Document Review</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Driver and vehicle documents awaiting backend verification.
          </Typography>
        </Box>
        <Button variant="outlined" size="small" onClick={() => void load()} disabled={loading} startIcon={<RefreshIcon />} sx={{ borderRadius: 1, textTransform: "none" }}>
          Refresh
        </Button>
      </Box>

      {error ? <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
        <QueueCard label="All pending" value={driverDocs.length + vehicleDocs.length} icon={<DescriptionIcon />} active={false} onClick={() => setSearch("")} />
        <QueueCard label="Driver documents" value={driverDocs.length} icon={<PersonIcon />} active={tab === "driver"} onClick={() => setTab("driver")} />
        <QueueCard label="Vehicle documents" value={vehicleDocs.length} icon={<DirectionsCarIcon />} active={tab === "vehicle"} onClick={() => setTab("vehicle")} />
      </Box>

      <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)", mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by document type, owner id, or status"
          />
        </CardContent>
      </Card>

      <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)", overflow: "hidden" }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{tab === "driver" ? "Driver Document Queue" : "Vehicle Document Queue"}</Typography>
          <Typography variant="caption" color="text.secondary">{filteredDocs.length} documents shown</Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Document</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 7 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>No pending {tab} documents</Typography>
                    <Typography variant="body2" color="text.secondary">The backend queue is clear for this view.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocs.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{titleize(doc.type)}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>{doc.id.slice(0, 8)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "monospace" }}>{ownerLabel(tab, doc)}</Typography>
                    </TableCell>
                    <TableCell><Chip size="small" color="warning" label={titleize(doc.status)} /></TableCell>
                    <TableCell>{formatDate(doc.createdAt)}</TableCell>
                    <TableCell>{formatDate(doc.expiryDate)}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                        <Button size="small" variant="outlined" onClick={() => void handleOpenDocument(doc)} sx={{ borderRadius: 1, textTransform: "none" }}>
                          Open
                        </Button>
                        <Button size="small" variant="contained" onClick={() => setSelectedDoc(doc)} sx={{ borderRadius: 1, textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>
                          Review
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={Boolean(selectedDoc)} onClose={() => setSelectedDoc(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Review {selectedDoc ? titleize(selectedDoc.type) : "Document"}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {tab === "driver" ? `Driver ID: ${selectedDoc?.driverId || "-"}` : `Vehicle ID: ${selectedDoc?.vehicleId || "-"}`}
          </Typography>
          {selectedDoc?.fileUrl ? (
            <Button variant="outlined" onClick={() => void handleOpenDocument(selectedDoc)} fullWidth sx={{ mb: 2, borderRadius: 1, textTransform: "none" }}>
              Open Document in New Tab
            </Button>
          ) : null}
          <TextField
            label="Rejection reason (required if rejecting)"
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDoc(null)} disabled={submitting} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button color="error" variant="contained" startIcon={<CloseIcon />} disabled={submitting} onClick={() => void handleReview("rejected")} sx={{ textTransform: "none" }}>
            Reject
          </Button>
          <Button color="success" variant="contained" startIcon={<CheckIcon />} disabled={submitting} onClick={() => void handleReview("verified")} sx={{ textTransform: "none" }}>
            Verify
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function QueueCard({
  label,
  value,
  icon,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  const color = active ? EV_GREEN : "#2563eb";
  return (
    <Card
      elevation={active ? 2 : 1}
      onClick={onClick}
      sx={{
        borderRadius: 1,
        border: `1px solid ${active ? EV_GREEN : "rgba(148,163,184,0.45)"}`,
        cursor: "pointer",
        bgcolor: active ? `${EV_GREEN}10` : "background.paper",
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 1, bgcolor: `${color}18`, color }}>{icon}</Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: "uppercase" }}>{label}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>{value.toLocaleString()}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
