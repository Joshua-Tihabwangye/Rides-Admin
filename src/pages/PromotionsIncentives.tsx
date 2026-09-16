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
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useNavigate } from "react-router-dom";
import {
  createAdminPromo,
  listAdminPromos,
  type AdminCreatePromoInput,
  type AdminPromoResponse,
} from "../services/api/adminApi";

const EV_COLORS = {
  primary: "#03cd8c",
};

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

function AdminPromotionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Promotions & Incentives
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Configure backend-backed rider promo codes. Driver incentives are shown only when a contract exists.
          </Typography>
        </Box>
      </Box>
      <Box className="flex-1 flex flex-col gap-3">{children}</Box>
    </Box>
  );
}

function rewardLabel(promo: AdminPromoResponse) {
  if (promo.discountType === "percent") return `${promo.discountValue}% off`;
  return `UGX ${promo.discountValue.toLocaleString("en-UG")} off`;
}

function statusChip(status?: AdminPromoResponse["status"]) {
  const active = status === "active";
  return (
    <Chip
      size="small"
      label={active ? "Active" : "Inactive"}
      color={active ? "success" : "default"}
      sx={{ fontSize: 10, height: 22 }}
    />
  );
}

export default function PromotionsIncentivesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<PromoTab>("rider");
  const [promos, setPromos] = useState<AdminPromoResponse[]>([]);
  const [draft, setDraft] = useState<PromoDraft>(DEFAULT_PROMO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", severity: "info" });

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminPromos();
      setPromos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load promotions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPromos();
  }, [fetchPromos]);

  const activePromos = useMemo(() => promos.filter((promo) => promo.status === "active"), [promos]);

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
    <AdminPromotionsLayout>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
        <CardContent className="p-0 flex flex-col">
          <Tabs
            value={tab === "rider" ? 0 : 1}
            onChange={handleTabChange}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Rider promotions" sx={{ textTransform: "none", fontSize: 13 }} />
            <Tab label="Driver incentives" sx={{ textTransform: "none", fontSize: 13 }} />
          </Tabs>

          <Divider />

          {tab === "rider" ? (
            <Box className="p-4">
              <Box className="flex flex-wrap gap-2 mb-3">
                <Chip size="small" label={`${promos.length} promo codes`} />
                <Chip size="small" color="success" label={`${activePromos.length} active`} />
                <Button size="small" onClick={() => void fetchPromos()} disabled={loading} sx={{ textTransform: "none", ml: "auto" }}>
                  Refresh
                </Button>
              </Box>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={26} />
                </Box>
              ) : (
                <Box className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {promos.map((promo) => (
                    <Card
                      key={promo.id}
                      elevation={0}
                      sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.4)", cursor: "pointer" }}
                      onClick={() => navigate(`/admin/promos/${promo.id}`)}
                    >
                      <CardContent className="p-3 flex flex-col gap-1">
                        <Box className="flex items-center justify-between gap-2">
                          <Typography variant="body2" className="text-[13px] font-semibold">
                            {promo.code}
                          </Typography>
                          {statusChip(promo.status)}
                        </Box>
                        <Typography variant="caption" className="text-[11px] text-slate-500">
                          {promo.description || "No description"}
                        </Typography>
                        <Typography variant="body2" className="text-[12px] text-slate-500">
                          {rewardLabel(promo)}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                  {promos.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center", gridColumn: "1 / -1" }}>
                      No promotions configured.
                    </Typography>
                  ) : null}
                </Box>
              )}
            </Box>
          ) : (
            <Box className="p-4">
              <Alert severity="info">
                Driver incentives are not exposed by the admin promotions backend contract yet. This tab will remain read-only until an incentive API exists.
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>

      {tab === "rider" ? (
        <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)", mt: 3 }}>
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography variant="subtitle2" className="font-semibold">
              New rider promo code
            </Typography>
            <Typography variant="caption" className="text-[11px] text-slate-500">
              Only fields supported by the backend promo contract are editable here.
            </Typography>
            <Box className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
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
            <Box className="flex justify-end">
              <Button
                variant="contained"
                size="small"
                disabled={saving}
                sx={{ textTransform: "none", borderRadius: 2, fontSize: 12, bgcolor: EV_COLORS.primary, "&:hover": { bgcolor: "#0fb589" } }}
                onClick={() => void savePromo()}
              >
                {saving ? "Saving..." : "Save promo"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : null}

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
    </AdminPromotionsLayout>
  );
}
