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
import {
  type PricingRule,
  type PromoCode,
  type SurgeZone,
  createPricingRule,
  createPromoCode,
  createSurgeZone,
  deletePricingRule,
  deletePromoCode,
  deleteSurgeZone,
  listPricingRules,
  listPromoCodes,
  listSurgeZones,
  patchPromoCode,
  patchPricingRule,
  patchSurgeZone,
} from "../services/api/adminApi";

const EV_GREEN = "#03cd8c";

function fmtUGX(n: number | string) {
  return `${Number(n).toLocaleString("en-UG")} UGX`;
}

type PricingRuleNumberField = "baseFare" | "perKm" | "perMinute" | "minimumFare" | "bookingFee";

const PRICING_RULE_NUMBER_FIELDS: { label: string; key: PricingRuleNumberField }[] = [
  { label: "Base Fare", key: "baseFare" },
  { label: "Per KM", key: "perKm" },
  { label: "Per Minute", key: "perMinute" },
  { label: "Minimum Fare", key: "minimumFare" },
  { label: "Booking Fee", key: "bookingFee" },
];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function StatusChip({ active }: { active: boolean }) {
  return <Chip label={active ? "Active" : "Inactive"} size="small" color={active ? "success" : "default"} sx={{ fontSize: 10 }} />;
}

// ─── Pricing Rules Tab ───────────────────────────────────────────────────────

function PricingRulesTab() {
  const [rows, setRows] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<Partial<PricingRule> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PricingRule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rules = await listPricingRules();
      setRows(rules);
    } catch (error) {
      setToast(getErrorMessage(error, "Failed to load pricing rules"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditRow({
      serviceType: "RIDE",
      vehicleType: "EV_COMFORT",
      baseFare: 2500,
      perKm: 1200,
      perMinute: 150,
      minimumFare: 5000,
      bookingFee: 700,
      currency: "UGX",
      active: true,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!editRow) return;
    try {
      if (editRow.id) {
        await patchPricingRule(editRow.id, editRow);
      } else {
        await createPricingRule(editRow);
      }
      setToast("Pricing rule saved");
      setDialogOpen(false);
      void load();
    } catch (error) {
      setToast(getErrorMessage(error, "Save failed"));
    }
  };

  const remove = async (id: string) => {
    try {
      await deletePricingRule(id);
      setDeleteTarget(null);
      setToast("Pricing rule deleted");
      void load();
    } catch (error) {
      setToast(getErrorMessage(error, "Delete failed"));
    }
  };

  if (loading) return <CircularProgress sx={{ m: 3 }} />;

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>Pricing Rules</Typography>
        <Button size="small" startIcon={<AddIcon />} variant="contained" onClick={openCreate} sx={{ borderRadius: 2, textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>
          Add Rule
        </Button>
      </Box>
      <Box sx={{ mb: 2, p: 2, bgcolor: "action.hover", borderRadius: 2 }}>
        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
          Fare = MAX(Base Fare + (Distance × Per KM) + (Duration × Per Minute) + Booking Fee, Minimum Fare)
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Service</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Base Fare</TableCell>
              <TableCell>Per KM</TableCell>
              <TableCell>Per Min</TableCell>
              <TableCell>Min Fare</TableCell>
              <TableCell>Booking Fee</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{row.serviceType}</TableCell>
                <TableCell>{row.vehicleType ?? "—"}</TableCell>
                <TableCell>{fmtUGX(row.baseFare)}</TableCell>
                <TableCell>{fmtUGX(row.perKm)}</TableCell>
                <TableCell>{fmtUGX(row.perMinute)}</TableCell>
                <TableCell>{fmtUGX(row.minimumFare)}</TableCell>
                <TableCell>{fmtUGX(row.bookingFee)}</TableCell>
                <TableCell>{row.currency}</TableCell>
                <TableCell><StatusChip active={row.active} /></TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditRow({ ...row }); setDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={10} align="center" sx={{ color: "text.secondary", py: 3 }}>No pricing rules configured yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editRow?.id ? "Edit Pricing Rule" : "New Pricing Rule"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, pt: 2 }}>
          <TextField
            label="Service Type"
            size="small"
            sx={{ gridColumn: "1 / -1" }}
            value={editRow?.serviceType ?? ""}
            onChange={(e) => setEditRow((p) => ({ ...p, serviceType: e.target.value }))}
          />
          <TextField
            label="Vehicle Type"
            size="small"
            sx={{ gridColumn: "1 / -1" }}
            value={editRow?.vehicleType ?? ""}
            onChange={(e) => setEditRow((p) => ({ ...p, vehicleType: e.target.value }))}
          />
          {PRICING_RULE_NUMBER_FIELDS.map(({ label, key }) => (
            <TextField key={key} label={`${label} (UGX)`} type="number" size="small" value={editRow?.[key] ?? ""} onChange={(e) => setEditRow((p) => ({ ...p, [key]: +e.target.value }))} />
          ))}
          <TextField label="Currency" size="small" value={editRow?.currency ?? "UGX"} onChange={(e) => setEditRow((p) => ({ ...p, currency: e.target.value }))} />
          <FormControl size="small">
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={(editRow?.active ?? true) ? "active" : "inactive"} onChange={(e) => setEditRow((p) => ({ ...p, active: e.target.value === "active" }))}>
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
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete pricing rule</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Delete {deleteTarget?.serviceType} {deleteTarget?.vehicleType ? `· ${deleteTarget.vehicleType}` : ""} pricing?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => deleteTarget && void remove(deleteTarget.id)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast("")} message={toast} />
    </>
  );
}

// ─── Surge Zones Tab ─────────────────────────────────────────────────────────

function SurgeZonesTab() {
  const [rows, setRows] = useState<SurgeZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<Partial<SurgeZone> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SurgeZone | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const zones = await listSurgeZones();
      setRows(zones);
    } catch (error) {
      setToast(getErrorMessage(error, "Failed to load surge zones"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editRow) return;
    try {
      if (editRow.id) {
        await patchSurgeZone(editRow.id, editRow);
      } else {
        await createSurgeZone(editRow);
      }
      setToast("Surge zone saved");
      setDialogOpen(false);
      void load();
    } catch (error) {
      setToast(getErrorMessage(error, "Save failed"));
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteSurgeZone(id);
      setDeleteTarget(null);
      setToast("Surge zone deleted");
      void load();
    } catch (error) {
      setToast(getErrorMessage(error, "Delete failed"));
    }
  };

  if (loading) return <CircularProgress sx={{ m: 3 }} />;

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>Surge Zones</Typography>
        <Button size="small" startIcon={<AddIcon />} variant="contained" onClick={() => { setEditRow({ serviceType: "RIDE", multiplier: 1.5, active: true, name: "" }); setDialogOpen(true); }} sx={{ borderRadius: 2, textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>
          Add Zone
        </Button>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Multiplier</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                <TableCell>{row.serviceType}</TableCell>
                <TableCell>{row.multiplier}×</TableCell>
                <TableCell><StatusChip active={row.active} /></TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditRow({ ...row }); setDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ color: "text.secondary", py: 3 }}>No surge zones configured.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editRow?.id ? "Edit Surge Zone" : "New Surge Zone"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
          <TextField label="Name" size="small" value={editRow?.name ?? ""} onChange={(e) => setEditRow((p) => ({ ...p, name: e.target.value }))} />
          <TextField label="Service Type" size="small" value={editRow?.serviceType ?? ""} onChange={(e) => setEditRow((p) => ({ ...p, serviceType: e.target.value }))} />
          <TextField label="Multiplier" type="number" size="small" value={editRow?.multiplier ?? 1} onChange={(e) => setEditRow((p) => ({ ...p, multiplier: +e.target.value }))} />
          <FormControl size="small">
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={(editRow?.active ?? true) ? "active" : "inactive"} onChange={(e) => setEditRow((p) => ({ ...p, active: e.target.value === "active" }))}>
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
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete surge zone</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Delete surge zone {deleteTarget?.name || deleteTarget?.id}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => deleteTarget && void remove(deleteTarget.id)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast("")} message={toast} />
    </>
  );
}

// ─── Promo Codes Tab ─────────────────────────────────────────────────────────

function PromoCodesTab() {
  const [rows, setRows] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<Partial<PromoCode> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const promos = await listPromoCodes();
      setRows(promos);
    } catch (error) {
      setToast(getErrorMessage(error, "Failed to load promo codes"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editRow) return;
    try {
      if (editRow.id) {
        await patchPromoCode(editRow.id, editRow);
      } else {
        await createPromoCode(editRow);
      }
      setToast("Promo code saved");
      setDialogOpen(false);
      void load();
    } catch (error) {
      setToast(getErrorMessage(error, "Save failed"));
    }
  };

  const remove = async (id: string) => {
    try {
      await deletePromoCode(id);
      setDeleteTarget(null);
      setToast("Promo code deleted");
      void load();
    } catch (error) {
      setToast(getErrorMessage(error, "Delete failed"));
    }
  };

  if (loading) return <CircularProgress sx={{ m: 3 }} />;

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>Promo Codes</Typography>
        <Button size="small" startIcon={<AddIcon />} variant="contained" onClick={() => { setEditRow({ code: "", discountType: "PERCENT", value: 10, active: true }); setDialogOpen(true); }} sx={{ borderRadius: 2, textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>
          Add Promo
        </Button>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{row.code}</TableCell>
                <TableCell>{row.serviceType ?? "All"}</TableCell>
                <TableCell>{row.discountType}</TableCell>
                <TableCell>{row.discountType === "PERCENT" ? `${row.value}%` : fmtUGX(row.value)}</TableCell>
                <TableCell><StatusChip active={row.active} /></TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditRow({ ...row }); setDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ color: "text.secondary", py: 3 }}>No promo codes configured.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editRow?.id ? "Edit Promo Code" : "New Promo Code"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
          <TextField label="Code" size="small" value={editRow?.code ?? ""} onChange={(e) => setEditRow((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
          <TextField label="Service Type" size="small" value={editRow?.serviceType ?? ""} onChange={(e) => setEditRow((p) => ({ ...p, serviceType: e.target.value || undefined }))} helperText="Leave empty for all services if supported by the backend." />
          <FormControl size="small">
            <InputLabel>Discount Type</InputLabel>
            <Select label="Discount Type" value={editRow?.discountType ?? "PERCENT"} onChange={(e) => setEditRow((p) => ({ ...p, discountType: e.target.value as PromoCode["discountType"] }))}>
              <MenuItem value="PERCENT">Percent</MenuItem>
              <MenuItem value="FIXED">Fixed amount</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Value" type="number" size="small" value={editRow?.value ?? 0} onChange={(e) => setEditRow((p) => ({ ...p, value: +e.target.value }))} />
          <FormControl size="small">
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={(editRow?.active ?? true) ? "active" : "inactive"} onChange={(e) => setEditRow((p) => ({ ...p, active: e.target.value === "active" }))}>
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
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete promo code</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Delete promo code {deleteTarget?.code || deleteTarget?.id}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => deleteTarget && void remove(deleteTarget.id)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast("")} message={toast} />
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PricingManagement() {
  const [tab, setTab] = useState(0);
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Pricing Management</Typography>
      <Card>
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Pricing Rules" />
            <Tab label="Surge Zones" />
            <Tab label="Promo Codes" />
          </Tabs>
          {tab === 0 && <PricingRulesTab />}
          {tab === 1 && <SurgeZonesTab />}
          {tab === 2 && <PromoCodesTab />}
        </CardContent>
      </Card>
    </Box>
  );
}
