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
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Switch,
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
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
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
import { formatMoney, platformCurrency, useAdminReferenceData } from "../hooks/useAdminReferenceData";

const EV_GREEN = "#03cd8c";

function fmtAmount(n: number | string, currency?: string) {
  return formatMoney(Number(n), currency);
}

type PricingRuleNumberField = "baseFare" | "perKm" | "perMinute" | "minimumFare" | "bookingFee";
type PricingRuleAdvancedField = "cancellationFee" | "waitingPerMinute" | "defaultMultiplier";

const PRICING_RULE_NUMBER_FIELDS: { label: string; key: PricingRuleNumberField; helper: string }[] = [
  { label: "Base Fare", key: "baseFare", helper: "Charged at the start of every trip" },
  { label: "Per KM", key: "perKm", helper: "Charged for each kilometre travelled" },
  { label: "Per Minute", key: "perMinute", helper: "Charged for each minute of trip time" },
  { label: "Booking Fee", key: "bookingFee", helper: "Flat platform fee added to the fare" },
  { label: "Minimum Fare", key: "minimumFare", helper: "The fare never drops below this" },
];

const PRICING_RULE_ADVANCED_FIELDS: { label: string; key: PricingRuleAdvancedField; helper: string; money: boolean }[] = [
  { label: "Cancellation Fee", key: "cancellationFee", helper: "Charged when a rider cancels late", money: true },
  { label: "Waiting / Minute", key: "waitingPerMinute", helper: "Charged while the driver waits", money: true },
  { label: "Default Multiplier", key: "defaultMultiplier", helper: "Base multiplier (0.1 – 10)", money: false },
];

/** Mirrors the backend ServiceType enum (wallet top-ups are not fare-priced). */
const SERVICE_TYPE_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: "RIDE", label: "Ride", description: "Passenger trips" },
  { value: "DELIVERY", label: "Delivery", description: "Parcel and courier jobs" },
  { value: "TOURIST_VEHICLE", label: "Tourist Vehicle", description: "Tour and safari hire" },
  { value: "AMBULANCE", label: "Ambulance", description: "Emergency transport" },
  { value: "CAR_RENTAL", label: "Car Rental", description: "Self-drive and chauffeured rentals" },
  { value: "SCHOOL_SHUTTLE", label: "School Shuttle", description: "Scheduled school runs" },
];

/** Mirrors the backend VehicleType enum. */
const VEHICLE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "BICYCLE", label: "Bicycle" },
  { value: "SCOOTER", label: "Scooter" },
  { value: "MOTORCYCLE", label: "Motorcycle" },
  { value: "BIKE", label: "Bike" },
  { value: "MINI_CAR", label: "Mini Car" },
  { value: "SEDAN", label: "Sedan" },
  { value: "HATCHBACK", label: "Hatchback" },
  { value: "CROSSOVER", label: "Crossover" },
  { value: "SUV", label: "SUV" },
  { value: "EV_LITE", label: "EV Lite" },
  { value: "EV_COMFORT", label: "EV Comfort" },
  { value: "EV_XL", label: "EV XL" },
  { value: "MINIVAN", label: "Minivan" },
  { value: "VAN", label: "Van" },
  { value: "TRUCK", label: "Truck" },
  { value: "LUXURY", label: "Luxury" },
  { value: "BUS", label: "Bus" },
  { value: "AMBULANCE", label: "Ambulance" },
];

const serviceLabel = (value?: string) => SERVICE_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value ?? "—";
const vehicleLabel = (value?: string) => (value ? VEHICLE_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value : "Any vehicle");

/** Only the fields the backend pricing-rule DTO accepts; server-managed fields (id, timestamps, ...) are dropped. */
function toPricingRulePayload(row: Partial<PricingRule>): Partial<PricingRule> {
  const payload: Partial<PricingRule> = {
    serviceType: row.serviceType,
    currency: row.currency,
    active: row.active ?? true,
    baseFare: row.baseFare,
    perKm: row.perKm,
    perMinute: row.perMinute,
    minimumFare: row.minimumFare,
    bookingFee: row.bookingFee,
  };
  if (row.vehicleType) payload.vehicleType = row.vehicleType;
  if (row.zoneId) payload.zoneId = row.zoneId;
  for (const { key } of PRICING_RULE_ADVANCED_FIELDS) {
    if (isPositiveOrZero(row[key])) payload[key] = row[key];
  }
  return payload;
}

const PREVIEW_DISTANCE_KM = 5;
const PREVIEW_DURATION_MIN = 15;

function previewFare(row: Partial<PricingRule>) {
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const raw = n(row.baseFare) + PREVIEW_DISTANCE_KM * n(row.perKm) + PREVIEW_DURATION_MIN * n(row.perMinute) + n(row.bookingFee);
  return Math.max(raw * (n(row.defaultMultiplier) || 1), n(row.minimumFare));
}

function FormSection({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 1, color: "text.secondary", lineHeight: 1.6 }}>{title}</Typography>
      {subtitle && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>{subtitle}</Typography>}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mt: subtitle ? 0 : 1 }}>{children}</Box>
    </Box>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function StatusChip({ active }: { active: boolean }) {
  return <Chip label={active ? "Active" : "Inactive"} size="small" color={active ? "success" : "default"} sx={{ fontSize: 10 }} />;
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 3, color: "text.secondary" }}>
      <CircularProgress size={22} />
      <Typography variant="body2">{label}</Typography>
    </Box>
  );
}

function EmptyTableRow({ colSpan, title, detail }: { colSpan: number; title: string; detail: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 5 }}>
        <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{detail}</Typography>
      </TableCell>
    </TableRow>
  );
}

const isBlank = (value?: string) => !value?.trim();
const isPositiveOrZero = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const isPositive = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value > 0;

function validatePricingRule(row: Partial<PricingRule>) {
  if (isBlank(row.serviceType)) return "Service type is required.";
  if (isBlank(row.currency)) return "Currency is required.";
  const invalidField = PRICING_RULE_NUMBER_FIELDS.find(({ key }) => !isPositiveOrZero(row[key]));
  if (invalidField) return `${invalidField.label} must be zero or greater.`;
  const multiplier = row.defaultMultiplier;
  if (multiplier != null && (!Number.isFinite(multiplier) || multiplier < 0.1 || multiplier > 10)) {
    return "Default multiplier must be between 0.1 and 10.";
  }
  return null;
}

function validateSurgeZone(row: Partial<SurgeZone>) {
  if (isBlank(row.name)) return "Zone name is required.";
  if (isBlank(row.serviceType)) return "Service type is required.";
  if (!isPositive(row.multiplier)) return "Multiplier must be greater than zero.";
  return null;
}

function validatePromoCode(row: Partial<PromoCode>) {
  if (isBlank(row.code)) return "Promo code is required.";
  if (row.discountType !== "PERCENT" && row.discountType !== "FIXED") return "Discount type is required.";
  if (!isPositive(row.value)) return "Discount value must be greater than zero.";
  if (row.discountType === "PERCENT" && Number(row.value) > 100) return "Percent discounts cannot exceed 100%.";
  return null;
}

// ─── Pricing Rules Tab ───────────────────────────────────────────────────────

function PricingRulesTab() {
  const { referenceData } = useAdminReferenceData();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rows, setRows] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<Partial<PricingRule> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PricingRule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rules = await listPricingRules();
      setRows(rules);
    } catch (error) {
      setError(getErrorMessage(error, "Failed to load pricing rules"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditRow({
      serviceType: "RIDE",
      vehicleType: "",
      currency: platformCurrency(),
      active: true,
    });
    setShowAdvanced(false);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!editRow) return;
    const validationError = validatePricingRule(editRow);
    if (validationError) {
      setToast(validationError);
      return;
    }
    setSaving(true);
    try {
      const payload = toPricingRulePayload(editRow);
      if (editRow.id) {
        await patchPricingRule(editRow.id, payload);
      } else {
        await createPricingRule(payload);
      }
      setToast("Pricing rule saved");
      setDialogOpen(false);
      void load();
    } catch (error) {
      setToast(getErrorMessage(error, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    try {
      await deletePricingRule(id);
      setDeleteTarget(null);
      setToast("Pricing rule deleted");
      void load();
    } catch (error) {
      setToast(getErrorMessage(error, "Delete failed"));
    } finally {
      setDeletingId("");
    }
  };

  if (loading) return <LoadingPanel label="Loading pricing rules..." />;

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Typography variant="subtitle1" fontWeight={600}>Pricing Rules</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button size="small" startIcon={<RefreshIcon />} variant="outlined" onClick={() => void load()} sx={{ borderRadius: 2, textTransform: "none" }}>
            Refresh
          </Button>
          <Button size="small" startIcon={<AddIcon />} variant="contained" onClick={openCreate} sx={{ borderRadius: 2, textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>
            Add Rule
          </Button>
        </Box>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button size="small" onClick={() => void load()}>Retry</Button>}>
          {error}
        </Alert>
      )}
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
                <TableCell sx={{ fontWeight: 600 }}>{serviceLabel(row.serviceType)}</TableCell>
                <TableCell>{vehicleLabel(row.vehicleType)}</TableCell>
                <TableCell>{fmtAmount(row.baseFare, row.currency)}</TableCell>
                <TableCell>{fmtAmount(row.perKm, row.currency)}</TableCell>
                <TableCell>{fmtAmount(row.perMinute, row.currency)}</TableCell>
                <TableCell>{fmtAmount(row.minimumFare, row.currency)}</TableCell>
                <TableCell>{fmtAmount(row.bookingFee, row.currency)}</TableCell>
                <TableCell>{row.currency}</TableCell>
                <TableCell><StatusChip active={row.active} /></TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditRow({ ...row }); setShowAdvanced(false); setDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" disabled={deletingId === row.id} onClick={() => setDeleteTarget(row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <EmptyTableRow colSpan={10} title="No pricing rules configured" detail="Create a rule to make backend fare calculation visible to operations." />
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, pb: 1 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>{editRow?.id ? "Edit pricing rule" : "New pricing rule"}</Typography>
            <Typography variant="body2" color="text.secondary">
              Define how fares are calculated for a service and vehicle class.
            </Typography>
          </Box>
          <IconButton size="small" disabled={saving} onClick={() => setDialogOpen(false)} aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 260px" }, gap: 3, pt: "20px !important" }}>
          <Box sx={{ display: "grid", gap: 3 }}>
            <FormSection title="Service scope" subtitle="Which bookings this rule prices.">
              <FormControl size="small" fullWidth required>
                <InputLabel id="pricing-service-type">Service type</InputLabel>
                <Select
                  labelId="pricing-service-type"
                  label="Service type"
                  value={editRow?.serviceType ?? ""}
                  onChange={(e) => setEditRow((p) => ({ ...p, serviceType: e.target.value }))}
                  renderValue={(value) => serviceLabel(value)}
                >
                  {SERVICE_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{option.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{option.description}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel id="pricing-vehicle-type" shrink>Vehicle type</InputLabel>
                <Select
                  labelId="pricing-vehicle-type"
                  label="Vehicle type"
                  notched
                  displayEmpty
                  value={editRow?.vehicleType ?? ""}
                  onChange={(e) => setEditRow((p) => ({ ...p, vehicleType: e.target.value }))}
                  renderValue={(value) => vehicleLabel(value)}
                >
                  <MenuItem value=""><em>Any vehicle</em></MenuItem>
                  {VEHICLE_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth required>
                <InputLabel id="pricing-currency">Currency</InputLabel>
                <Select
                  labelId="pricing-currency"
                  label="Currency"
                  value={editRow?.currency ?? ""}
                  onChange={(e) => setEditRow((p) => ({ ...p, currency: e.target.value }))}
                >
                  {Array.from(new Set([...(referenceData?.currencies ?? []), editRow?.currency, platformCurrency()].filter(Boolean) as string[])).map((code) => (
                    <MenuItem key={code} value={code}>{code}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ display: "flex", alignItems: "center", px: 1.5, border: 1, borderColor: "divider", borderRadius: 1 }}>
                <FormControlLabel
                  sx={{ m: 0, width: "100%", justifyContent: "space-between" }}
                  labelPlacement="start"
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{(editRow?.active ?? true) ? "Active" : "Inactive"}</Typography>
                      <Typography variant="caption" color="text.secondary">Used for live quotes</Typography>
                    </Box>
                  }
                  control={
                    <Switch
                      checked={editRow?.active ?? true}
                      onChange={(e) => setEditRow((p) => ({ ...p, active: e.target.checked }))}
                      sx={{ "& .Mui-checked": { color: EV_GREEN }, "& .Mui-checked + .MuiSwitch-track": { bgcolor: `${EV_GREEN} !important` } }}
                    />
                  }
                />
              </Box>
            </FormSection>

            <FormSection title="Fare components" subtitle="All amounts are in the selected currency.">
              {PRICING_RULE_NUMBER_FIELDS.map(({ label, key, helper }) => (
                <TextField
                  key={key}
                  label={label}
                  type="number"
                  size="small"
                  required
                  helperText={helper}
                  inputProps={{ min: 0, step: "any" }}
                  InputProps={{ startAdornment: <InputAdornment position="start">{editRow?.currency || platformCurrency()}</InputAdornment> }}
                  value={editRow?.[key] ?? ""}
                  onChange={(e) => setEditRow((p) => ({ ...p, [key]: e.target.value === "" ? undefined : +e.target.value }))}
                />
              ))}
            </FormSection>

            <Box>
              <Button
                size="small"
                onClick={() => setShowAdvanced((v) => !v)}
                endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ textTransform: "none", color: "text.secondary", px: 0 }}
              >
                {showAdvanced ? "Hide advanced settings" : "Show advanced settings"}
              </Button>
              {showAdvanced && (
                <Box sx={{ mt: 1 }}>
                  <FormSection title="Advanced">
                    {PRICING_RULE_ADVANCED_FIELDS.map(({ label, key, helper, money }) => (
                      <TextField
                        key={key}
                        label={label}
                        type="number"
                        size="small"
                        helperText={helper}
                        inputProps={{ min: 0, step: "any" }}
                        InputProps={{
                          startAdornment: money ? <InputAdornment position="start">{editRow?.currency || platformCurrency()}</InputAdornment> : undefined,
                          endAdornment: money ? undefined : <InputAdornment position="end">×</InputAdornment>,
                        }}
                        value={editRow?.[key] ?? ""}
                        onChange={(e) => setEditRow((p) => ({ ...p, [key]: e.target.value === "" ? undefined : +e.target.value }))}
                      />
                    ))}
                  </FormSection>
                </Box>
              )}
            </Box>
          </Box>

          <Box
            sx={{
              alignSelf: "start",
              position: { md: "sticky" },
              top: 0,
              p: 2.5,
              borderRadius: 2,
              bgcolor: "action.hover",
              border: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 1, color: "text.secondary" }}>Fare preview</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              Example trip · {PREVIEW_DISTANCE_KM} km · {PREVIEW_DURATION_MIN} min
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mt: 1.5, color: EV_GREEN }}>
              {fmtAmount(previewFare(editRow ?? {}), editRow?.currency)}
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            {[
              ["Base fare", Number(editRow?.baseFare ?? 0)],
              [`Distance (${PREVIEW_DISTANCE_KM} km)`, PREVIEW_DISTANCE_KM * Number(editRow?.perKm ?? 0)],
              [`Time (${PREVIEW_DURATION_MIN} min)`, PREVIEW_DURATION_MIN * Number(editRow?.perMinute ?? 0)],
              ["Booking fee", Number(editRow?.bookingFee ?? 0)],
            ].map(([label, amount]) => (
              <Box key={label as string} sx={{ display: "flex", justifyContent: "space-between", py: 0.4 }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="caption" fontWeight={600}>{fmtAmount(amount as number, editRow?.currency)}</Typography>
              </Box>
            ))}
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.4 }}>
              <Typography variant="caption" color="text.secondary">Minimum fare</Typography>
              <Typography variant="caption" fontWeight={600}>{fmtAmount(Number(editRow?.minimumFare ?? 0), editRow?.currency)}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5, fontFamily: "monospace", fontSize: 10 }}>
              MAX(base + km + min + fee, minimum)
            </Typography>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button disabled={saving} onClick={() => setDialogOpen(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button
            disabled={saving}
            variant="contained"
            onClick={save}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ textTransform: "none", borderRadius: 2, px: 3, bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}
          >
            {saving ? "Saving..." : editRow?.id ? "Save changes" : "Create rule"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!deleteTarget} onClose={() => !deletingId && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete pricing rule</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Delete {deleteTarget?.serviceType} {deleteTarget?.vehicleType ? `· ${deleteTarget.vehicleType}` : ""} pricing?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={!!deletingId} onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button disabled={!!deletingId} color="error" variant="contained" onClick={() => deleteTarget && void remove(deleteTarget.id)}>
            {deletingId ? "Deleting..." : "Delete"}
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
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const zones = await listSurgeZones();
      setRows(zones);
    } catch (error) {
      setError(getErrorMessage(error, "Failed to load surge zones"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editRow) return;
    const validationError = validateSurgeZone(editRow);
    if (validationError) {
      setToast(validationError);
      return;
    }
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteSurgeZone(id);
      setDeleteTarget(null);
      setToast("Surge zone deleted");
      void load();
    } catch (error) {
      setToast(getErrorMessage(error, "Delete failed"));
    } finally {
      setDeletingId("");
    }
  };

  if (loading) return <LoadingPanel label="Loading surge zones..." />;

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Typography variant="subtitle1" fontWeight={600}>Surge Zones</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button size="small" startIcon={<RefreshIcon />} variant="outlined" onClick={() => void load()} sx={{ borderRadius: 2, textTransform: "none" }}>
            Refresh
          </Button>
          <Button size="small" startIcon={<AddIcon />} variant="contained" onClick={() => { setEditRow({ serviceType: "RIDE", multiplier: 1.5, active: true, name: "" }); setDialogOpen(true); }} sx={{ borderRadius: 2, textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>
            Add Zone
          </Button>
        </Box>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button size="small" onClick={() => void load()}>Retry</Button>}>
          {error}
        </Alert>
      )}
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
                  <Tooltip title="Delete"><IconButton size="small" color="error" disabled={deletingId === row.id} onClick={() => setDeleteTarget(row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <EmptyTableRow colSpan={5} title="No surge zones configured" detail="Add a backend surge zone to control live multipliers by service and area." />
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editRow?.id ? "Edit Surge Zone" : "New Surge Zone"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
          <TextField label="Name" size="small" value={editRow?.name ?? ""} onChange={(e) => setEditRow((p) => ({ ...p, name: e.target.value }))} />
          <FormControl size="small">
            <InputLabel>Service Type</InputLabel>
            <Select label="Service Type" value={editRow?.serviceType ?? ""} onChange={(e) => setEditRow((p) => ({ ...p, serviceType: e.target.value }))}>
              {SERVICE_TYPE_OPTIONS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </Select>
          </FormControl>
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
          <Button disabled={saving} onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button disabled={saving} variant="contained" onClick={save} sx={{ bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>{saving ? "Saving..." : "Save"}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!deleteTarget} onClose={() => !deletingId && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete surge zone</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Delete surge zone {deleteTarget?.name || deleteTarget?.id}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={!!deletingId} onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button disabled={!!deletingId} color="error" variant="contained" onClick={() => deleteTarget && void remove(deleteTarget.id)}>
            {deletingId ? "Deleting..." : "Delete"}
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
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const promos = await listPromoCodes();
      setRows(promos);
    } catch (error) {
      setError(getErrorMessage(error, "Failed to load promo codes"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editRow) return;
    const validationError = validatePromoCode(editRow);
    if (validationError) {
      setToast(validationError);
      return;
    }
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    try {
      await deletePromoCode(id);
      setDeleteTarget(null);
      setToast("Promo code deleted");
      void load();
    } catch (error) {
      setToast(getErrorMessage(error, "Delete failed"));
    } finally {
      setDeletingId("");
    }
  };

  if (loading) return <LoadingPanel label="Loading promo codes..." />;

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Typography variant="subtitle1" fontWeight={600}>Promo Codes</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button size="small" startIcon={<RefreshIcon />} variant="outlined" onClick={() => void load()} sx={{ borderRadius: 2, textTransform: "none" }}>
            Refresh
          </Button>
          <Button size="small" startIcon={<AddIcon />} variant="contained" onClick={() => { setEditRow({ code: "", discountType: "PERCENT", value: 10, active: true }); setDialogOpen(true); }} sx={{ borderRadius: 2, textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>
            Add Promo
          </Button>
        </Box>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button size="small" onClick={() => void load()}>Retry</Button>}>
          {error}
        </Alert>
      )}
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
                <TableCell>{row.discountType === "PERCENT" ? `${row.value}%` : fmtAmount(row.value)}</TableCell>
                <TableCell><StatusChip active={row.active} /></TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditRow({ ...row }); setDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" disabled={deletingId === row.id} onClick={() => setDeleteTarget(row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <EmptyTableRow colSpan={6} title="No promo codes configured" detail="Create promo codes from the backend contract before running campaigns." />
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editRow?.id ? "Edit Promo Code" : "New Promo Code"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
          <TextField label="Code" size="small" value={editRow?.code ?? ""} onChange={(e) => setEditRow((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
          <FormControl size="small">
            <InputLabel shrink>Service Type</InputLabel>
            <Select label="Service Type" notched displayEmpty value={editRow?.serviceType ?? ""} onChange={(e) => setEditRow((p) => ({ ...p, serviceType: e.target.value || undefined }))}>
              <MenuItem value=""><em>All services</em></MenuItem>
              {SERVICE_TYPE_OPTIONS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </Select>
          </FormControl>
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
          <Button disabled={saving} onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button disabled={saving} variant="contained" onClick={save} sx={{ bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>{saving ? "Saving..." : "Save"}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!deleteTarget} onClose={() => !deletingId && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete promo code</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Delete promo code {deleteTarget?.code || deleteTarget?.id}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={!!deletingId} onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button disabled={!!deletingId} color="error" variant="contained" onClick={() => deleteTarget && void remove(deleteTarget.id)}>
            {deletingId ? "Deleting..." : "Delete"}
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
