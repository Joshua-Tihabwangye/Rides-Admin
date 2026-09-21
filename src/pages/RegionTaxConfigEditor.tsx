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
  FormControlLabel,
  Stack,
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
import ReceiptIcon from "@mui/icons-material/Receipt";
import PublicIcon from "@mui/icons-material/Public";
import PercentIcon from "@mui/icons-material/Percent";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import { useNavigate, useParams } from "react-router-dom";
import {
  createAdminContent,
  listAdminContent,
  patchAdminContent,
  type AdminContentItem,
} from "../services/api/adminApi";

const EV_GREEN = "#03cd8c";
const CONTENT_KIND = "tax-region-configs";

type TaxRegionConfigDocument = Record<string, unknown> & {
  title: string;
  status: "published" | "archived";
  regionCode: string;
  regionName: string;
  country: string;
  currency: string;
  vatRatePercent: string;
  withholdingRatePercent: string;
  invoicePrefix: string;
  active: boolean;
};

type TaxConfigDraft = Pick<
  TaxRegionConfigDocument,
  | "regionCode"
  | "regionName"
  | "country"
  | "currency"
  | "vatRatePercent"
  | "withholdingRatePercent"
  | "invoicePrefix"
  | "active"
>;

type Notice = {
  type: "success" | "error" | "info";
  message: string;
} | null;

const DEFAULT_DRAFT: TaxConfigDraft = {
  regionCode: "",
  regionName: "",
  country: "Uganda",
  currency: "UGX",
  vatRatePercent: "0",
  withholdingRatePercent: "0",
  invoicePrefix: "EVZ",
  active: true,
};

function textValue(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function boolValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeConfig(row?: Partial<TaxRegionConfigDocument> | null): TaxConfigDraft {
  return {
    regionCode: textValue(row?.regionCode, DEFAULT_DRAFT.regionCode),
    regionName: textValue(row?.regionName, DEFAULT_DRAFT.regionName),
    country: textValue(row?.country, DEFAULT_DRAFT.country),
    currency: textValue(row?.currency, DEFAULT_DRAFT.currency),
    vatRatePercent: textValue(row?.vatRatePercent, DEFAULT_DRAFT.vatRatePercent),
    withholdingRatePercent: textValue(row?.withholdingRatePercent, DEFAULT_DRAFT.withholdingRatePercent),
    invoicePrefix: textValue(row?.invoicePrefix, DEFAULT_DRAFT.invoicePrefix),
    active: boolValue(row?.active, DEFAULT_DRAFT.active),
  };
}

function titleForDraft(draft: TaxConfigDraft) {
  return `${draft.regionName || draft.regionCode || "Region"} tax config`;
}

function formatUpdatedAt(value?: number) {
  if (!value) return "Not saved";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

export default function TaxesInvoicingPage() {
  const navigate = useNavigate();
  const { regionId } = useParams();
  const [records, setRecords] = useState<Array<AdminContentItem<TaxRegionConfigDocument>>>([]);
  const [draft, setDraft] = useState<TaxConfigDraft>(DEFAULT_DRAFT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const selectedRecord = useMemo(
    () => records.find((row) => row.id === regionId || row.regionCode === regionId) ?? null,
    [records, regionId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const rows = await listAdminContent<TaxRegionConfigDocument>(CONTENT_KIND);
      setRecords(rows.filter((row) => row.status !== "archived"));
    } catch (error) {
      console.error("Failed to load tax region configs", error);
      setNotice({ type: "error", message: "Unable to load tax region configuration from the backend." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (regionId) {
      setDraft(selectedRecord ? normalizeConfig(selectedRecord) : { ...DEFAULT_DRAFT, regionCode: regionId });
    } else {
      setDraft(DEFAULT_DRAFT);
    }
  }, [regionId, selectedRecord]);

  const activeRegions = records.filter((record) => record.active).length;
  const currencies = Array.from(new Set(records.map((record) => record.currency).filter(Boolean))).length;

  const handleChange =
    (field: keyof Omit<TaxConfigDraft, "active">) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraft((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSave = async () => {
    if (!draft.regionCode.trim()) {
      setNotice({ type: "error", message: "Region code is required before saving." });
      return;
    }

    setSaving(true);
    setNotice(null);
    const payload: TaxRegionConfigDocument = {
      title: titleForDraft(draft),
      status: "published",
      ...draft,
      regionCode: draft.regionCode.trim(),
      regionName: draft.regionName.trim(),
      country: draft.country.trim(),
      currency: draft.currency.trim().toUpperCase(),
      invoicePrefix: draft.invoicePrefix.trim().toUpperCase(),
    };

    try {
      if (selectedRecord) {
        await patchAdminContent<TaxRegionConfigDocument>(CONTENT_KIND, selectedRecord.id, payload);
      } else {
        await createAdminContent<TaxRegionConfigDocument>(CONTENT_KIND, payload);
      }
      setNotice({ type: "success", message: "Tax region configuration saved." });
      await load();
      if (!regionId) navigate(`/admin/finance/tax-invoices/${encodeURIComponent(payload.regionCode)}/edit`);
    } catch (error) {
      console.error("Failed to save tax region config", error);
      setNotice({ type: "error", message: "Unable to save tax region configuration." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", pb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <ReceiptIcon sx={{ color: EV_GREEN }} />
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0 }}>Taxes & Invoicing</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Backend-persisted tax rules and invoice settings by operating region.
          </Typography>
        </Box>
        {regionId ? (
          <Button size="small" variant="outlined" onClick={() => navigate("/admin/finance/tax-invoices")} sx={{ borderRadius: 1, textTransform: "none" }}>
            Back to regions
          </Button>
        ) : null}
      </Box>

      {notice ? <Alert severity={notice.type} sx={{ mb: 2 }}>{notice.message}</Alert> : null}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
        <MetricCard label="Tax regions" value={records.length} icon={<PublicIcon />} color="#2563eb" />
        <MetricCard label="Active regions" value={activeRegions} icon={<ToggleOnIcon />} color={EV_GREEN} />
        <MetricCard label="Currencies" value={currencies} icon={<PercentIcon />} color="#f59e0b" />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: regionId ? "1fr" : "420px 1fr" }, gap: 3 }}>
        <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)" }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  {regionId ? `Edit ${regionId}` : "New tax region"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedRecord ? `Updated ${formatUpdatedAt(selectedRecord.updatedAt)}` : "Create or edit the authoritative region config"}
                </Typography>
              </Box>
              {selectedRecord ? <Chip size="small" label={selectedRecord.active ? "Active" : "Inactive"} color={selectedRecord.active ? "success" : "default"} /> : null}
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: regionId ? "repeat(2, 1fr)" : "1fr" }, gap: 2 }}>
              <TextField label="Region code" size="small" value={draft.regionCode} onChange={handleChange("regionCode")} />
              <TextField label="Region name" size="small" value={draft.regionName} onChange={handleChange("regionName")} />
              <TextField label="Country" size="small" value={draft.country} onChange={handleChange("country")} />
              <TextField label="Currency" size="small" value={draft.currency} onChange={handleChange("currency")} />
              <TextField label="VAT rate (%)" size="small" type="number" value={draft.vatRatePercent} onChange={handleChange("vatRatePercent")} />
              <TextField label="Withholding rate (%)" size="small" type="number" value={draft.withholdingRatePercent} onChange={handleChange("withholdingRatePercent")} />
              <TextField label="Invoice prefix" size="small" value={draft.invoicePrefix} onChange={handleChange("invoicePrefix")} />
              <FormControlLabel
                control={<Switch checked={draft.active} onChange={(event) => setDraft((prev) => ({ ...prev, active: event.target.checked }))} />}
                label="Active for new invoices"
              />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<SaveIcon />}
                disabled={saving}
                onClick={() => void handleSave()}
                sx={{ textTransform: "none", borderRadius: 1, bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}
              >
                {saving ? "Saving..." : "Save tax config"}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {!regionId ? (
          <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)", overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Region Tax Overview</Typography>
              <Typography variant="caption" color="text.secondary">{records.length} backend records</Typography>
            </Box>
            <Divider />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Region</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Currency</TableCell>
                    <TableCell>VAT</TableCell>
                    <TableCell>Withholding</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 7 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>No tax regions configured yet</Typography>
                        <Typography variant="body2" color="text.secondary">Create the first backend tax record using the form.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{row.regionName || row.regionCode}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.invoicePrefix}</Typography>
                        </TableCell>
                        <TableCell>{row.country}</TableCell>
                        <TableCell>{row.currency}</TableCell>
                        <TableCell>{row.vatRatePercent}%</TableCell>
                        <TableCell>{row.withholdingRatePercent}%</TableCell>
                        <TableCell><Chip size="small" label={row.active ? "Active" : "Inactive"} color={row.active ? "success" : "default"} /></TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => navigate(`/admin/finance/tax-invoices/${encodeURIComponent(row.regionCode || row.id)}/edit`)} sx={{ borderRadius: 1, textTransform: "none" }}>
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        ) : null}
      </Box>
    </Box>
  );
}

function MetricCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)" }}>
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
