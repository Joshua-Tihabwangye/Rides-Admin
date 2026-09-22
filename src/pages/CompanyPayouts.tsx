import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Paper,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  getAdminCompany,
  getAdminCompanyPayoutSettings,
  listAdminCompanies,
  listAdminCompanyPayouts,
  patchAdminCompanyPayoutSettings,
  type AdminCompanyPayoutSettings,
  type AdminCompanyResponse,
  type AdminPayout,
} from "../services/api/adminApi";

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info";
};

type PayoutSettingsForm = {
  schedule: string;
  minimumAmount: string;
  currency: string;
  destination: string;
  enabled: boolean;
};

function AdminFinanceCompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Company Payout Config & History
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Backend-authoritative company payout settings and payout history.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3">{children}</Box>
    </Box>
  );
}

function settingsToForm(settings: AdminCompanyPayoutSettings): PayoutSettingsForm {
  return {
    schedule: settings.schedule || "weekly",
    minimumAmount: Number.isFinite(settings.minimumAmount) ? String(settings.minimumAmount) : "0",
    currency: settings.currency || "UGX",
    destination: settings.destination ?? "",
    enabled: settings.enabled,
  };
}

function formatMoney(amount: number | undefined, currency: string | undefined) {
  return `${currency || "UGX"} ${(amount ?? 0).toLocaleString()}`;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

export default function CompanyPayoutConfigPage() {
  const { companyId } = useParams();
  const [company, setCompany] = useState<AdminCompanyResponse | null>(null);
  const [settings, setSettings] = useState<AdminCompanyPayoutSettings | null>(null);
  const [form, setForm] = useState<PayoutSettingsForm | null>(null);
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", severity: "info" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let selectedCompanyId = companyId;
      if (!selectedCompanyId) {
        const list = await listAdminCompanies();
        selectedCompanyId = list[0]?.id;
      }

      if (!selectedCompanyId) {
        setCompany(null);
        setSettings(null);
        setForm(null);
        setPayouts([]);
        return;
      }

      const [companyResponse, settingsResponse, payoutRows] = await Promise.all([
        getAdminCompany(selectedCompanyId),
        getAdminCompanyPayoutSettings(selectedCompanyId),
        listAdminCompanyPayouts(selectedCompanyId),
      ]);

      setCompany(companyResponse);
      setSettings(settingsResponse);
      setForm(settingsToForm(settingsResponse));
      setPayouts(payoutRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load company payouts");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeVerticals = useMemo(() => {
    if (!company) return [];
    return Object.entries(company.verticals).filter(([, enabled]) => enabled).map(([key]) => key);
  }, [company]);

  const saveSettings = async () => {
    if (!company || !form) return;
    const minimumAmount = Number(form.minimumAmount);
    if (!Number.isFinite(minimumAmount) || minimumAmount < 0) {
      setSnackbar({ open: true, message: "Minimum payout amount must be a valid non-negative number", severity: "error" });
      return;
    }

    setSaving(true);
    try {
      await patchAdminCompanyPayoutSettings(company.id, {
        schedule: form.schedule,
        minimumAmount,
        currency: form.currency,
        destination: form.destination.trim() ? form.destination.trim() : null,
        enabled: form.enabled,
      });
      await load();
      setSnackbar({ open: true, message: "Payout settings saved", severity: "success" });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Failed to save payout settings",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AdminFinanceCompanyLayout>
      {error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void load()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      {!company || !form || !settings ? (
        <Alert severity="info">No company returned from the backend.</Alert>
      ) : (
        <>
          <Box className="flex items-center justify-between gap-2">
            <Typography variant="caption" color="text.secondary">
              Settings source: `/admin/companies/{company.id}/payout-settings`
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => void load()}
              disabled={saving}
              sx={{ textTransform: "none", borderRadius: 999, fontSize: 11 }}
            >
              Refresh
            </Button>
          </Box>

          <Box className="flex flex-col lg:flex-row gap-4">
            <Card elevation={1} sx={{ flex: 1, borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
              <CardContent className="p-4 flex flex-col gap-3">
                <Box className="flex items-center justify-between gap-2">
                  <Box>
                    <Typography variant="subtitle2" className="font-semibold">
                      {company.companyName}
                    </Typography>
                    <Typography variant="caption" className="text-[11px] text-slate-500">
                      Contact {company.contactEmail || "not set"} · {company.contactPhone || "no phone"}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={company.status}
                    color={company.status === "active" ? "success" : company.status === "suspended" ? "warning" : "default"}
                    sx={{ fontSize: 10, height: 22 }}
                  />
                </Box>

                <Divider className="!my-1" />

                <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <InfoField label="Registration number" value={company.registrationNumber || "n/a"} />
                  <InfoField label="Tax ID" value={company.taxId || "n/a"} />
                  <InfoField label="Active verticals" value={activeVerticals.length ? activeVerticals.join(", ") : "none"} />
                  <InfoField label="Backend company ID" value={company.id} />
                </Box>

                <Divider className="!my-1" />

                <Typography variant="subtitle2" className="font-semibold">
                  Payout settings
                </Typography>
                <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <TextField
                    size="small"
                    label="Schedule"
                    value={form.schedule}
                    onChange={(event) => setForm((prev) => prev && { ...prev, schedule: event.target.value })}
                    helperText="Saved and validated by the backend payout settings contract"
                  />
                  <TextField
                    size="small"
                    label="Currency"
                    value={form.currency}
                    onChange={(event) => setForm((prev) => prev && { ...prev, currency: event.target.value })}
                    helperText="Use the company payout currency from backend finance configuration"
                  />
                  <TextField
                    size="small"
                    label="Minimum amount"
                    type="number"
                    value={form.minimumAmount}
                    onChange={(event) => setForm((prev) => prev && { ...prev, minimumAmount: event.target.value })}
                  />
                  <TextField
                    size="small"
                    label="Destination"
                    value={form.destination}
                    onChange={(event) => setForm((prev) => prev && { ...prev, destination: event.target.value })}
                  />
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.enabled}
                      onChange={(event) => setForm((prev) => prev && { ...prev, enabled: event.target.checked })}
                    />
                  }
                  label={<Typography variant="body2">Payouts enabled</Typography>}
                />

                <Box className="flex gap-2 mt-1 justify-end">
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<SaveIcon />}
                    sx={{ textTransform: "none", borderRadius: 999, fontSize: 12, bgcolor: "#03cd8c" }}
                    disabled={saving}
                    onClick={() => void saveSettings()}
                  >
                    {saving ? "Saving..." : "Save payout config"}
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Card elevation={1} sx={{ flex: 1, borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
              <CardContent className="p-4 flex flex-col gap-2">
                <Typography variant="subtitle2" className="font-semibold">
                  Payout history
                </Typography>
                <Divider className="!my-1" />
                {payouts.length === 0 ? (
                  <Alert severity="info">No company payouts were returned by the backend.</Alert>
                ) : (
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "action.hover" }}>
                          <TableCell>ID</TableCell>
                          <TableCell>Recipient</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Created</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payouts.map((payout) => (
                          <TableRow key={payout.id}>
                            <TableCell sx={{ fontSize: 12, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>
                              {payout.id}
                            </TableCell>
                            <TableCell>{payout.recipientId}</TableCell>
                            <TableCell>{formatMoney(payout.amount, payout.currency)}</TableCell>
                            <TableCell>{payout.status}</TableCell>
                            <TableCell>{formatDate(payout.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Box>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminFinanceCompanyLayout>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box className="flex flex-col gap-1">
      <Typography variant="caption" className="text-[11px] text-slate-500">
        {label}
      </Typography>
      <Typography variant="body2" className="font-medium" color="text.primary">
        {value}
      </Typography>
    </Box>
  );
}
