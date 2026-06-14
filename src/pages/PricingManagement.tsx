// Centralized Pricing Management — Rides-Admin
// Manages RidePricing, DeliveryPricing, RentalPricing, AmbulancePricing
// All values stored in the database and loaded via the backend API.
import React, { useCallback, useEffect, useState } from "react";
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
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
  type AmbulancePricing,
  type DeliveryPricing,
  type FarePreview,
  type RentalPricing,
  type RidePricing,
  type VehicleCategory,
  createAmbulancePricing,
  createDeliveryPricing,
  createRentalPricing,
  createRidePricing,
  createVehicleCategory,
  deleteAmbulancePricing,
  deleteDeliveryPricing,
  deleteRentalPricing,
  deleteRidePricing,
  deleteVehicleCategory,
  listAmbulancePricing,
  listDeliveryPricing,
  listRentalPricing,
  listRidePricing,
  listVehicleCategories,
  patchAmbulancePricing,
  patchDeliveryPricing,
  patchRentalPricing,
  patchRidePricing,
  patchVehicleCategory,
  previewFare,
} from "../services/api/adminApi";

const EV_GREEN = "#03cd8c";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtUGX(n: number | string) {
  return `${Number(n).toLocaleString()} UGX`;
}

function StatusChip({ status }: { status: string }) {
  return (
    <Chip
      label={status}
      size="small"
      color={status === "active" ? "success" : "default"}
      sx={{ fontSize: 10 }}
    />
  );
}

// ─── Fare Preview Dialog ──────────────────────────────────────────────────────

function FarePreviewDialog({
  open,
  serviceType,
  onClose,
}: {
  open: boolean;
  serviceType: string;
  onClose: () => void;
}) {
  const [distanceKm, setDistanceKm] = useState("10");
  const [durationMin, setDurationMin] = useState("15");
  const [hours, setHours] = useState("4");
  const [preview, setPreview] = useState<FarePreview | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      let body: Record<string, unknown> = {};
      if (serviceType === "ride") body = { distanceKm: +distanceKm, durationMinutes: +durationMin };
      else if (serviceType === "delivery") body = { distanceKm: +distanceKm };
      else if (serviceType === "rental") body = { hours: +hours };
      else if (serviceType === "ambulance") body = { distanceKm: +distanceKm };
      const result = await previewFare(serviceType as any, body);
      setPreview(result);
    } catch {
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Fare Preview — {serviceType}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
        {(serviceType === "ride" || serviceType === "delivery" || serviceType === "ambulance") && (
          <TextField
            label="Distance (km)"
            type="number"
            size="small"
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
          />
        )}
        {serviceType === "ride" && (
          <TextField
            label="Duration (minutes)"
            type="number"
            size="small"
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
          />
        )}
        {serviceType === "rental" && (
          <TextField
            label="Hours"
            type="number"
            size="small"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        )}
        {loading && <CircularProgress size={20} />}
        {preview && (
          <Box sx={{ bgcolor: "action.hover", borderRadius: 2, p: 2 }}>
            <Typography variant="body2" sx={{ fontFamily: "monospace", mb: 0.5 }}>
              {preview.formula}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2">Base fare: {fmtUGX(preview.baseFare)}</Typography>
            <Typography variant="body2">Distance charge: {fmtUGX(preview.distanceCharge)}</Typography>
            {preview.durationCharge > 0 && (
              <Typography variant="body2">Duration charge: {fmtUGX(preview.durationCharge)}</Typography>
            )}
            {preview.surcharge > 0 && (
              <Typography variant="body2">Surcharge: {fmtUGX(preview.surcharge)}</Typography>
            )}
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ color: EV_GREEN, fontWeight: 700 }}>
              Total: {fmtUGX(preview.total)}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={run} sx={{ bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>
          Calculate
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Ride Pricing Tab ─────────────────────────────────────────────────────────

function RidePricingTab() {
  const [rows, setRows] = useState<RidePricing[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<Partial<RidePricing> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [r, c] = await Promise.all([listRidePricing(), listVehicleCategories("ride")]);
    setRows(r);
    setCategories(c);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditRow({ ratePerKm: 500, baseFare: 2000, minimumFare: 3000, perMinuteRate: 0, surgeMultiplier: 1, currency: "UGX", status: "active" });
    setDialogOpen(true);
  };

  const openEdit = (row: RidePricing) => { setEditRow({ ...row }); setDialogOpen(true); };

  const save = async () => {
    if (!editRow) return;
    try {
      if (editRow.id) {
        await patchRidePricing(editRow.id, editRow);
      } else {
        await createRidePricing(editRow);
      }
      setToast("Saved successfully");
      setDialogOpen(false);
      load();
    } catch { setToast("Save failed"); }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this pricing rule?")) return;
    await deleteRidePricing(id);
    setToast("Deleted");
    load();
  };

  if (loading) return <CircularProgress sx={{ m: 3 }} />;

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>Ride Pricing — Distance × Rate per KM</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button size="small" startIcon={<PlayArrowIcon />} variant="outlined" onClick={() => setPreviewOpen(true)} sx={{ borderRadius: 2, textTransform: "none" }}>
            Preview Fare
          </Button>
          <Button size="small" startIcon={<AddIcon />} variant="contained" onClick={openCreate} sx={{ borderRadius: 2, textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>
            Add Rate
          </Button>
        </Box>
      </Box>
      <Box sx={{ mb: 2, p: 2, bgcolor: "action.hover", borderRadius: 2 }}>
        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
          Fare = (Base Fare + Distance × Rate/km + Duration × Rate/min) × Surge Multiplier · then MAX(result, Minimum Fare)
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Vehicle Type</TableCell>
              <TableCell>Rate / km</TableCell>
              <TableCell>Base Fare</TableCell>
              <TableCell>Min Fare</TableCell>
              <TableCell>Rate / min</TableCell>
              <TableCell>Surge</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{row.vehicleCategory?.name ?? "—"}</TableCell>
                <TableCell>{fmtUGX(row.ratePerKm)}</TableCell>
                <TableCell>{fmtUGX(row.baseFare)}</TableCell>
                <TableCell>{fmtUGX(row.minimumFare)}</TableCell>
                <TableCell>{fmtUGX(row.perMinuteRate)}</TableCell>
                <TableCell>{row.surgeMultiplier}×</TableCell>
                <TableCell><StatusChip status={row.status} /></TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => remove(row.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={8} align="center" sx={{ color: "text.secondary", py: 3 }}>No ride pricing configured yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit / Create dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editRow?.id ? "Edit Ride Pricing" : "New Ride Pricing"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, pt: 2 }}>
          {!editRow?.id && (
            <FormControl size="small" sx={{ gridColumn: "1 / -1" }}>
              <InputLabel>Vehicle Category</InputLabel>
              <Select label="Vehicle Category" value={editRow?.vehicleCategoryId ?? ""} onChange={(e) => setEditRow((p) => ({ ...p, vehicleCategoryId: e.target.value }))}>
                {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          {[
            { label: "Rate per KM (UGX)", key: "ratePerKm" },
            { label: "Base Fare (UGX)", key: "baseFare" },
            { label: "Minimum Fare (UGX)", key: "minimumFare" },
            { label: "Rate per Minute (UGX)", key: "perMinuteRate" },
            { label: "Surge Multiplier", key: "surgeMultiplier" },
          ].map(({ label, key }) => (
            <TextField key={key} label={label} type="number" size="small" value={(editRow as any)?.[key] ?? ""} onChange={(e) => setEditRow((p) => ({ ...p, [key]: +e.target.value }))} />
          ))}
          <FormControl size="small">
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={editRow?.status ?? "active"} onChange={(e) => setEditRow((p) => ({ ...p, status: e.target.value }))}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} sx={{ bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>Save</Button>
        </DialogActions>
      </Dialog>

      <FarePreviewDialog open={previewOpen} serviceType="ride" onClose={() => setPreviewOpen(false)} />
      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast("")} message={toast} />
    </>
  );
}

// ─── Delivery Pricing Tab ─────────────────────────────────────────────────────

function DeliveryPricingTab() {
  const [rows, setRows] = useState<DeliveryPricing[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<Partial<DeliveryPricing> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [r, c] = await Promise.all([listDeliveryPricing(), listVehicleCategories("delivery")]);
    setRows(r); setCategories(c); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editRow) return;
    try {
      editRow.id ? await patchDeliveryPricing(editRow.id, editRow) : await createDeliveryPricing(editRow);
      setToast("Saved"); setDialogOpen(false); load();
    } catch { setToast("Save failed"); }
  };

  if (loading) return <CircularProgress sx={{ m: 3 }} />;

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>Delivery Pricing</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button size="small" startIcon={<PlayArrowIcon />} variant="outlined" onClick={() => setPreviewOpen(true)} sx={{ borderRadius: 2, textTransform: "none" }}>Preview</Button>
          <Button size="small" startIcon={<AddIcon />} variant="contained" onClick={() => { setEditRow({ ratePerKm: 500, baseFare: 2000, minimumFare: 3000, weightSurcharge: 0, currency: "UGX", status: "active" }); setDialogOpen(true); }} sx={{ borderRadius: 2, textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>
            Add Rate
          </Button>
        </Box>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Vehicle Type</TableCell>
              <TableCell>Rate / km</TableCell>
              <TableCell>Base Fare</TableCell>
              <TableCell>Min Fare</TableCell>
              <TableCell>Weight Surcharge / kg</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{row.vehicleCategory?.name ?? "—"}</TableCell>
                <TableCell>{fmtUGX(row.ratePerKm)}</TableCell>
                <TableCell>{fmtUGX(row.baseFare)}</TableCell>
                <TableCell>{fmtUGX(row.minimumFare)}</TableCell>
                <TableCell>{fmtUGX(row.weightSurcharge)}</TableCell>
                <TableCell><StatusChip status={row.status} /></TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditRow({ ...row }); setDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={async () => { if (!window.confirm("Delete?")) return; await deleteDeliveryPricing(row.id); setToast("Deleted"); load(); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 3 }}>No delivery pricing configured.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editRow?.id ? "Edit Delivery Pricing" : "New Delivery Pricing"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, pt: 2 }}>
          {!editRow?.id && (
            <FormControl size="small" sx={{ gridColumn: "1 / -1" }}>
              <InputLabel>Vehicle Category</InputLabel>
              <Select label="Vehicle Category" value={editRow?.vehicleCategoryId ?? ""} onChange={(e) => setEditRow((p) => ({ ...p, vehicleCategoryId: e.target.value }))}>
                {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          {[{ label: "Rate per KM (UGX)", key: "ratePerKm" }, { label: "Base Fare (UGX)", key: "baseFare" }, { label: "Minimum Fare (UGX)", key: "minimumFare" }, { label: "Weight Surcharge / kg (UGX)", key: "weightSurcharge" }].map(({ label, key }) => (
            <TextField key={key} label={label} type="number" size="small" value={(editRow as any)?.[key] ?? ""} onChange={(e) => setEditRow((p) => ({ ...p, [key]: +e.target.value }))} />
          ))}
          <FormControl size="small">
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={editRow?.status ?? "active"} onChange={(e) => setEditRow((p) => ({ ...p, status: e.target.value }))}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} sx={{ bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>Save</Button>
        </DialogActions>
      </Dialog>

      <FarePreviewDialog open={previewOpen} serviceType="delivery" onClose={() => setPreviewOpen(false)} />
      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast("")} message={toast} />
    </>
  );
}

// ─── Rental Pricing Tab ───────────────────────────────────────────────────────

function RentalPricingTab() {
  const [rows, setRows] = useState<RentalPricing[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<Partial<RentalPricing> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [r, c] = await Promise.all([listRentalPricing(), listVehicleCategories("rental")]);
    setRows(r); setCategories(c); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editRow) return;
    try {
      editRow.id ? await patchRentalPricing(editRow.id, editRow) : await createRentalPricing(editRow);
      setToast("Saved"); setDialogOpen(false); load();
    } catch { setToast("Save failed"); }
  };

  if (loading) return <CircularProgress sx={{ m: 3 }} />;

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>Rental Pricing</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button size="small" startIcon={<PlayArrowIcon />} variant="outlined" onClick={() => setPreviewOpen(true)} sx={{ borderRadius: 2, textTransform: "none" }}>Preview</Button>
          <Button size="small" startIcon={<AddIcon />} variant="contained" onClick={() => { setEditRow({ hourlyRate: 10000, dailyRate: 100000, weeklyRate: 600000, monthlyRate: 2000000, currency: "UGX", status: "active" }); setDialogOpen(true); }} sx={{ borderRadius: 2, textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>
            Add Rate
          </Button>
        </Box>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Vehicle Type</TableCell>
              <TableCell>Hourly</TableCell>
              <TableCell>Daily</TableCell>
              <TableCell>Weekly</TableCell>
              <TableCell>Monthly</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{row.vehicleCategory?.name ?? "—"}</TableCell>
                <TableCell>{fmtUGX(row.hourlyRate)}</TableCell>
                <TableCell>{fmtUGX(row.dailyRate)}</TableCell>
                <TableCell>{fmtUGX(row.weeklyRate)}</TableCell>
                <TableCell>{fmtUGX(row.monthlyRate)}</TableCell>
                <TableCell><StatusChip status={row.status} /></TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditRow({ ...row }); setDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={async () => { if (!window.confirm("Delete?")) return; await deleteRentalPricing(row.id); setToast("Deleted"); load(); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 3 }}>No rental pricing configured.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editRow?.id ? "Edit Rental Pricing" : "New Rental Pricing"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, pt: 2 }}>
          {!editRow?.id && (
            <FormControl size="small" sx={{ gridColumn: "1 / -1" }}>
              <InputLabel>Vehicle Category</InputLabel>
              <Select label="Vehicle Category" value={editRow?.vehicleCategoryId ?? ""} onChange={(e) => setEditRow((p) => ({ ...p, vehicleCategoryId: e.target.value }))}>
                {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          {[{ label: "Hourly Rate (UGX)", key: "hourlyRate" }, { label: "Daily Rate (UGX)", key: "dailyRate" }, { label: "Weekly Rate (UGX)", key: "weeklyRate" }, { label: "Monthly Rate (UGX)", key: "monthlyRate" }].map(({ label, key }) => (
            <TextField key={key} label={label} type="number" size="small" value={(editRow as any)?.[key] ?? ""} onChange={(e) => setEditRow((p) => ({ ...p, [key]: +e.target.value }))} />
          ))}
          <FormControl size="small">
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={editRow?.status ?? "active"} onChange={(e) => setEditRow((p) => ({ ...p, status: e.target.value }))}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} sx={{ bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>Save</Button>
        </DialogActions>
      </Dialog>

      <FarePreviewDialog open={previewOpen} serviceType="rental" onClose={() => setPreviewOpen(false)} />
      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast("")} message={toast} />
    </>
  );
}

// ─── Ambulance Pricing Tab ────────────────────────────────────────────────────

function AmbulancePricingTab() {
  const [rows, setRows] = useState<AmbulancePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<Partial<AmbulancePricing> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setRows(await listAmbulancePricing());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editRow) return;
    try {
      editRow.id ? await patchAmbulancePricing(editRow.id, editRow) : await createAmbulancePricing(editRow);
      setToast("Saved"); setDialogOpen(false); load();
    } catch { setToast("Save failed"); }
  };

  if (loading) return <CircularProgress sx={{ m: 3 }} />;

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>Ambulance Pricing</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button size="small" startIcon={<PlayArrowIcon />} variant="outlined" onClick={() => setPreviewOpen(true)} sx={{ borderRadius: 2, textTransform: "none" }}>Preview</Button>
          <Button size="small" startIcon={<AddIcon />} variant="contained" onClick={() => { setEditRow({ ambulanceType: "basic", baseFare: 20000, ratePerKm: 1500, emergencySurcharge: 5000, nightSurcharge: 3000, currency: "UGX", status: "active" }); setDialogOpen(true); }} sx={{ borderRadius: 2, textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>
            Add Type
          </Button>
        </Box>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Base Fare</TableCell>
              <TableCell>Rate / km</TableCell>
              <TableCell>Emergency Surcharge</TableCell>
              <TableCell>Night Surcharge</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ fontWeight: 600, textTransform: "capitalize" }}>{row.ambulanceType}</TableCell>
                <TableCell>{fmtUGX(row.baseFare)}</TableCell>
                <TableCell>{fmtUGX(row.ratePerKm)}</TableCell>
                <TableCell>{fmtUGX(row.emergencySurcharge)}</TableCell>
                <TableCell>{fmtUGX(row.nightSurcharge)}</TableCell>
                <TableCell><StatusChip status={row.status} /></TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditRow({ ...row }); setDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={async () => { if (!window.confirm("Delete?")) return; await deleteAmbulancePricing(row.id); setToast("Deleted"); load(); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 3 }}>No ambulance pricing configured.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editRow?.id ? "Edit Ambulance Pricing" : "New Ambulance Pricing"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, pt: 2 }}>
          {!editRow?.id && (
            <FormControl size="small" sx={{ gridColumn: "1 / -1" }}>
              <InputLabel>Ambulance Type</InputLabel>
              <Select label="Ambulance Type" value={editRow?.ambulanceType ?? "basic"} onChange={(e) => setEditRow((p) => ({ ...p, ambulanceType: e.target.value }))}>
                {["basic", "advanced", "icu"].map((t) => <MenuItem key={t} value={t} sx={{ textTransform: "capitalize" }}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          {[{ label: "Base Fare (UGX)", key: "baseFare" }, { label: "Rate per KM (UGX)", key: "ratePerKm" }, { label: "Emergency Surcharge (UGX)", key: "emergencySurcharge" }, { label: "Night Surcharge (UGX)", key: "nightSurcharge" }].map(({ label, key }) => (
            <TextField key={key} label={label} type="number" size="small" value={(editRow as any)?.[key] ?? ""} onChange={(e) => setEditRow((p) => ({ ...p, [key]: +e.target.value }))} />
          ))}
          <FormControl size="small">
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={editRow?.status ?? "active"} onChange={(e) => setEditRow((p) => ({ ...p, status: e.target.value }))}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} sx={{ bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>Save</Button>
        </DialogActions>
      </Dialog>

      <FarePreviewDialog open={previewOpen} serviceType="ambulance" onClose={() => setPreviewOpen(false)} />
      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast("")} message={toast} />
    </>
  );
}

// ─── Vehicle Categories Tab ───────────────────────────────────────────────────

function VehicleCategoriesTab() {
  const [rows, setRows] = useState<VehicleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<Partial<VehicleCategory> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => { setLoading(true); setRows(await listVehicleCategories()); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editRow) return;
    try {
      editRow.id ? await patchVehicleCategory(editRow.id, editRow) : await createVehicleCategory(editRow);
      setToast("Saved"); setDialogOpen(false); load();
    } catch { setToast("Save failed"); }
  };

  if (loading) return <CircularProgress sx={{ m: 3 }} />;

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>Vehicle Categories</Typography>
        <Button size="small" startIcon={<AddIcon />} variant="contained" onClick={() => { setEditRow({ type: "ride", status: "active" }); setDialogOpen(true); }} sx={{ borderRadius: 2, textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>
          Add Category
        </Button>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Service Type</TableCell><TableCell>Description</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                <TableCell><Chip label={row.type} size="small" variant="outlined" sx={{ fontSize: 10 }} /></TableCell>
                <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>{row.description ?? "—"}</TableCell>
                <TableCell><StatusChip status={row.status} /></TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditRow({ ...row }); setDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={async () => { if (!window.confirm("Delete?")) return; await deleteVehicleCategory(row.id); setToast("Deleted"); load(); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ color: "text.secondary", py: 3 }}>No vehicle categories.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editRow?.id ? "Edit Category" : "New Category"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField label="Name" size="small" value={editRow?.name ?? ""} onChange={(e) => setEditRow((p) => ({ ...p, name: e.target.value }))} />
          <FormControl size="small">
            <InputLabel>Service Type</InputLabel>
            <Select label="Service Type" value={editRow?.type ?? "ride"} onChange={(e) => setEditRow((p) => ({ ...p, type: e.target.value }))}>
              {["ride", "delivery", "rental", "ambulance"].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Description" size="small" value={editRow?.description ?? ""} onChange={(e) => setEditRow((p) => ({ ...p, description: e.target.value }))} />
          <FormControl size="small">
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={editRow?.status ?? "active"} onChange={(e) => setEditRow((p) => ({ ...p, status: e.target.value as "active" | "inactive" }))}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} sx={{ bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast("")} message={toast} />
    </>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

const TABS = [
  { label: "Rides", key: "rides" },
  { label: "Deliveries", key: "deliveries" },
  { label: "Rentals", key: "rentals" },
  { label: "Ambulances", key: "ambulances" },
  { label: "Vehicle Categories", key: "categories" },
];

export default function PricingManagement() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box sx={{ pb: 3 }}>
        <Typography variant="h6" fontWeight={700}>Pricing Management</Typography>
        <Typography variant="caption" color="text.secondary">
          Configure ride, delivery, rental and ambulance pricing. All rates are stored in the database — no code changes needed.
        </Typography>
      </Box>

      <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)" }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
          TabIndicatorProps={{ style: { backgroundColor: EV_GREEN } }}
        >
          {TABS.map((t) => (
            <Tab key={t.key} label={t.label} sx={{ textTransform: "none", fontWeight: 500, "&.Mui-selected": { color: EV_GREEN } }} />
          ))}
        </Tabs>

        <CardContent sx={{ p: 3 }}>
          {tab === 0 && <RidePricingTab />}
          {tab === 1 && <DeliveryPricingTab />}
          {tab === 2 && <RentalPricingTab />}
          {tab === 3 && <AmbulancePricingTab />}
          {tab === 4 && <VehicleCategoriesTab />}
        </CardContent>
      </Card>
    </Box>
  );
}
