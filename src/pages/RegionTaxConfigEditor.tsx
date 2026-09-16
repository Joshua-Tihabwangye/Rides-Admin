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
import { useNavigate, useParams } from "react-router-dom";
import {
  createAdminContent,
  listAdminContent,
  patchAdminContent,
  type AdminContentItem,
} from "../services/api/adminApi";

const EV_COLORS = {
  primary: "#03cd8c",
};

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

function AdminFinanceTaxLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Taxes & Invoicing
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Configure backend-persisted tax rules and invoice settings per region.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3">{children}</Box>
    </Box>
  );
}

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
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const editor = (
    <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
      <CardContent sx={{ p: 3 }}>
        <Box className="flex items-center justify-between gap-2">
          <Typography variant="subtitle2" className="font-semibold">
            {regionId ? `Edit Tax Configuration: ${regionId}` : "New tax region"}
          </Typography>
          {selectedRecord ? (
            <Chip size="small" label={`Updated ${formatUpdatedAt(selectedRecord.updatedAt)}`} sx={{ fontSize: 10 }} />
          ) : null}
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        <Box className="flex justify-end gap-2 mt-3">
          {regionId ? (
            <Button size="small" onClick={() => navigate("/admin/finance/tax-invoices")} sx={{ textTransform: "none" }}>
              Back to list
            </Button>
          ) : null}
          <Button
            variant="contained"
            size="small"
            startIcon={<SaveIcon />}
            disabled={saving}
            onClick={() => void handleSave()}
            sx={{ textTransform: "none", borderRadius: 2, bgcolor: EV_COLORS.primary, "&:hover": { bgcolor: "#0fb589" } }}
          >
            {saving ? "Saving..." : "Save tax config"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <AdminFinanceTaxLayout>
      {notice ? <Alert severity={notice.type}>{notice.message}</Alert> : null}
      {regionId ? (
        editor
      ) : (
        <Box className="flex flex-col gap-4">
          {editor}
          <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
            <CardContent className="p-4 flex flex-col gap-2">
              <Typography variant="subtitle2" className="font-semibold">
                Region tax overview
              </Typography>
              <Divider className="!my-1" />
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
                    {records.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.regionName || row.regionCode}</TableCell>
                        <TableCell>{row.country}</TableCell>
                        <TableCell>{row.currency}</TableCell>
                        <TableCell>{row.vatRatePercent}%</TableCell>
                        <TableCell>{row.withholdingRatePercent}%</TableCell>
                        <TableCell>
                          <Chip size="small" label={row.active ? "Active" : "Inactive"} color={row.active ? "success" : "default"} sx={{ fontSize: 10 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => navigate(`/admin/finance/tax-invoices/${encodeURIComponent(row.regionCode || row.id)}/edit`)} sx={{ textTransform: "none" }}>
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {records.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                            No tax regions are configured yet.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}
    </AdminFinanceTaxLayout>
  );
}
