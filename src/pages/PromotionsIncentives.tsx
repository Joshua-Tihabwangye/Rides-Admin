import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import { useNavigate } from "react-router-dom";
import {
  createAdminPromo,
  listAdminPromos,
  type AdminCreatePromoInput,
  type AdminPromoResponse,
} from "../services/api/adminApi";

const EV_GREEN = "#03cd8c";
type PromoTab = "rider" | "driver";
type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info";
};
type PromoDraft = AdminCreatePromoInput;

const DEFAULT_PROMO: PromoDraft = {
  code: "",
  description: "",
  discountType: "percent",
  discountValue: 10,
};

function rewardLabel(promo: AdminPromoResponse) {
  if (promo.discountType === "percent") return `${promo.discountValue}% off`;
  return `UGX ${promo.discountValue.toLocaleString("en-UG")} off`;
}

function statusChip(status?: AdminPromoResponse["status"]) {
  const active = status === "active";
  return <Chip size="small" label={active ? "Active" : "Inactive"} color={active ? "success" : "default"} />;
}

export default function PromotionsIncentivesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<PromoTab>("rider");
  const [promos, setPromos] = useState<AdminPromoResponse[]>([]);
  const [draft, setDraft] = useState<PromoDraft>(DEFAULT_PROMO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", severity: "info" });

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminPromos();
      setPromos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load promotions");
      setPromos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPromos();
  }, [fetchPromos]);

  const activePromos = useMemo(() => promos.filter((promo) => promo.status === "active"), [promos]);
  const inactivePromos = promos.length - activePromos.length;
  const filteredPromos = useMemo(() => {
    const query = search.trim().toLowerCase();
    return promos.filter((promo) => {
      if (statusFilter === "active" && promo.status !== "active") return false;
      if (statusFilter === "inactive" && promo.status === "active") return false;
      const haystack = [promo.code, promo.description, promo.discountType, promo.status].join(" ").toLowerCase();
      return !query || haystack.includes(query);
    });
  }, [promos, search, statusFilter]);

  const handleTabChange = (_event: React.SyntheticEvent, value: number) => {
    setTab(value === 0 ? "rider" : "driver");
  };

  const updateDraft =
    (field: keyof PromoDraft) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = field === "discountValue" ? Number(event.target.value) : event.target.value;
      setDraft((prev) => ({ ...prev, [field]: value }));
    };

  const updateDiscountType = (event: SelectChangeEvent<PromoDraft["discountType"]>) => {
    setDraft((prev) => ({ ...prev, discountType: event.target.value as PromoDraft["discountType"] }));
  };

  const savePromo = async () => {
    if (!draft.code.trim()) {
      setSnackbar({ open: true, message: "Promo code is required.", severity: "error" });
      return;
    }
    if (!Number.isFinite(draft.discountValue) || draft.discountValue <= 0) {
      setSnackbar({ open: true, message: "Discount value must be greater than zero.", severity: "error" });
      return;
    }

    setSaving(true);
    try {
      await createAdminPromo({
        code: draft.code.trim().toUpperCase(),
        description: draft.description?.trim() || undefined,
        discountType: draft.discountType,
        discountValue: draft.discountValue,
      });
      setDraft(DEFAULT_PROMO);
      await fetchPromos();
      setSnackbar({ open: true, message: "Promotion saved.", severity: "success" });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Failed to save promotion",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", pb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <LocalOfferIcon sx={{ color: EV_GREEN }} />
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0 }}>Promotions & Incentives</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Backend promo codes for riders. Driver incentives remain read-only until the backend exposes an incentive contract.
          </Typography>
        </Box>
        <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={() => void fetchPromos()} disabled={loading} sx={{ borderRadius: 1, textTransform: "none" }}>
          Refresh
        </Button>
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Tabs value={tab === "rider" ? 0 : 1} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Rider promotions" sx={{ textTransform: "none" }} />
        <Tab label="Driver incentives" sx={{ textTransform: "none" }} />
      </Tabs>

      {tab === "driver" ? (
        <Alert severity="info">Driver incentives are not exposed by the admin promotions backend contract yet.</Alert>
      ) : (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
            <MetricCard label="Promo codes" value={promos.length} icon={<LocalOfferIcon />} color="#2563eb" onClick={() => setStatusFilter("all")} active={statusFilter === "all"} />
            <MetricCard label="Active" value={activePromos.length} icon={<CheckCircleIcon />} color={EV_GREEN} onClick={() => setStatusFilter("active")} active={statusFilter === "active"} />
            <MetricCard label="Inactive" value={inactivePromos} icon={<PauseCircleIcon />} color="#64748b" onClick={() => setStatusFilter("inactive")} active={statusFilter === "inactive"} />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1fr 420px" }, gap: 3 }}>
            <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)", overflow: "hidden" }}>
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Promo Registry</Typography>
                <Typography variant="caption" color="text.secondary">{filteredPromos.length} codes shown</Typography>
                <TextField size="small" fullWidth value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search promo code or description" sx={{ mt: 1.5 }} />
              </Box>
              <Divider />
              {loading ? (
                <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress size={26} /></Box>
              ) : (
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2, p: 2 }}>
                  {filteredPromos.map((promo) => (
                    <Card key={promo.id} variant="outlined" sx={{ borderRadius: 1, cursor: "pointer" }} onClick={() => navigate(`/admin/promos/${promo.id}`)}>
                      <CardContent sx={{ p: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, letterSpacing: 0.5 }}>{promo.code}</Typography>
                          {statusChip(promo.status)}
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, minHeight: 40 }}>{promo.description || "No description"}</Typography>
                        <Chip size="small" label={rewardLabel(promo)} sx={{ mt: 1 }} />
                      </CardContent>
                    </Card>
                  ))}
                  {filteredPromos.length === 0 ? (
                    <Box sx={{ gridColumn: "1 / -1", textAlign: "center", py: 6 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>No promotions match this view</Typography>
                      <Typography variant="body2" color="text.secondary">Adjust the search or status filter.</Typography>
                    </Box>
                  ) : null}
                </Box>
              )}
            </Card>

            <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <AddIcon sx={{ color: EV_GREEN }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>New Rider Promo Code</Typography>
                </Stack>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
                  <TextField label="Promo code" size="small" value={draft.code} onChange={updateDraft("code")} />
                  <TextField label="Description" size="small" value={draft.description ?? ""} onChange={updateDraft("description")} />
                  <FormControl size="small">
                    <InputLabel>Discount type</InputLabel>
                    <Select label="Discount type" value={draft.discountType} onChange={updateDiscountType}>
                      <MenuItem value="percent">Percent</MenuItem>
                      <MenuItem value="flat">Flat amount</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField label="Discount value" size="small" type="number" value={draft.discountValue} onChange={updateDraft("discountValue")} />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                  <Button variant="contained" size="small" disabled={saving} onClick={() => void savePromo()} sx={{ borderRadius: 1, textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>
                    {saving ? "Saving..." : "Save promo"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function MetricCard({
  label,
  value,
  icon,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      elevation={active ? 2 : 1}
      onClick={onClick}
      sx={{ borderRadius: 1, border: `1px solid ${active ? color : "rgba(148,163,184,0.45)"}`, cursor: "pointer", bgcolor: active ? `${color}10` : "background.paper" }}
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
