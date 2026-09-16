import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import {
  createAdminContent,
  listAdminContent,
  patchAdminContent,
  type AdminContentItem,
} from "../services/api/adminApi";

const EV_COLORS = {
  primary: "#03cd8c",
};

const CONTENT_KIND = "invoice-templates";

type InvoiceTemplateDocument = Record<string, unknown> & {
  title: string;
  status: "published" | "archived";
  header: string;
  footer: string;
  showLogo: boolean;
  showTaxBreakdown: boolean;
};

type InvoiceTemplateState = Pick<InvoiceTemplateDocument, "header" | "footer" | "showLogo" | "showTaxBreakdown">;

const DEFAULT_TEMPLATE: InvoiceTemplateState = {
  header: "EVzone Mobility - Official Receipt",
  footer: "Thank you for choosing EVzone. For support: support@evzone.com",
  showLogo: true,
  showTaxBreakdown: true,
};

function AdminInvoiceTemplateLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Invoice Template Preview
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Configure backend-persisted invoice template text and layout flags.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3">{children}</Box>
    </Box>
  );
}

function boolValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function textValue(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function normalizeTemplate(row?: Partial<InvoiceTemplateDocument> | null): InvoiceTemplateState {
  return {
    header: textValue(row?.header, DEFAULT_TEMPLATE.header),
    footer: textValue(row?.footer, DEFAULT_TEMPLATE.footer),
    showLogo: boolValue(row?.showLogo, DEFAULT_TEMPLATE.showLogo),
    showTaxBreakdown: boolValue(row?.showTaxBreakdown, DEFAULT_TEMPLATE.showTaxBreakdown),
  };
}

function fileNameForTemplate(draft: AdminContentItem<InvoiceTemplateDocument>) {
  return `invoice_template_${draft.id}.json`;
}

export default function InvoiceTemplatePreviewPage() {
  const [template, setTemplate] = useState<InvoiceTemplateState>(DEFAULT_TEMPLATE);
  const [drafts, setDrafts] = useState<Array<AdminContentItem<InvoiceTemplateDocument>>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listAdminContent<InvoiceTemplateDocument>(CONTENT_KIND);
      const activeRows = rows.filter((row) => row.status !== "archived");
      setDrafts(activeRows);
      setTemplate(activeRows[0] ? normalizeTemplate(activeRows[0]) : DEFAULT_TEMPLATE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load invoice templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleFieldChange =
    (field: keyof Pick<InvoiceTemplateState, "header" | "footer">) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setTemplate((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleToggle = (field: keyof Pick<InvoiceTemplateState, "showLogo" | "showTaxBreakdown">) => () => {
    setTemplate((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      await createAdminContent<InvoiceTemplateDocument>(CONTENT_KIND, {
        title: `Invoice Template ${new Date().toLocaleDateString()}`,
        status: "published",
        ...template,
      });
      setNotice("Invoice template saved to backend content.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save invoice template");
    } finally {
      setSaving(false);
    }
  };

  const archiveDraft = async (draft: AdminContentItem<InvoiceTemplateDocument>) => {
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      await patchAdminContent<InvoiceTemplateDocument>(CONTENT_KIND, draft.id, { status: "archived" });
      setNotice("Invoice template archived.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to archive invoice template");
    } finally {
      setSaving(false);
    }
  };

  const downloadDraft = (draft: AdminContentItem<InvoiceTemplateDocument>) => {
    const payload = normalizeTemplate(draft);
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(payload, null, 2))}`;
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", fileNameForTemplate(draft));
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <AdminInvoiceTemplateLayout>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {notice ? <Alert severity="success">{notice}</Alert> : null}

      <Box className="flex flex-col lg:flex-row gap-4">
        <Card elevation={1} sx={{ flex: 1, borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography variant="subtitle2" className="font-semibold">
              Template settings
            </Typography>
            <Divider className="!my-1" />

            <TextField
              label="Header text"
              size="small"
              fullWidth
              value={template.header}
              onChange={handleFieldChange("header")}
            />

            <TextField
              label="Footer text"
              size="small"
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              value={template.footer}
              onChange={handleFieldChange("footer")}
            />

            <Box className="flex flex-wrap gap-2 text-[12px] text-slate-500 mt-1">
              <Chip
                size="small"
                label={template.showLogo ? "Logo: shown" : "Logo: hidden"}
                onClick={handleToggle("showLogo")}
                sx={{ fontSize: 10, height: 22, cursor: "pointer" }}
              />
              <Chip
                size="small"
                label={template.showTaxBreakdown ? "Tax breakdown: shown" : "Tax breakdown: hidden"}
                onClick={handleToggle("showTaxBreakdown")}
                sx={{ fontSize: 10, height: 22, cursor: "pointer" }}
              />
            </Box>

            <Box className="flex justify-end mt-2">
              <Button
                variant="contained"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  fontSize: 12,
                  bgcolor: EV_COLORS.primary,
                  "&:hover": { bgcolor: "#0fb589" },
                }}
                disabled={saving}
                onClick={() => void handleSave()}
              >
                {saving ? "Saving..." : "Save template"}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={1} sx={{ flex: 1.2, borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography variant="caption" className="text-[11px] text-slate-500">
              Live preview
            </Typography>
            <Box className="border border-slate-200 rounded-md p-3 text-[12px]">
              {template.showLogo ? (
                <Box className="mb-2 flex items-center gap-2">
                  <Box className="w-6 h-6 rounded-full" sx={{ bgcolor: EV_COLORS.primary }} />
                  <span className="font-semibold">EVzone Mobility</span>
                </Box>
              ) : null}
              <Typography variant="body2" className="font-semibold mb-1 text-[13px]">
                {template.header}
              </Typography>
              <Divider className="!my-1" />
              <Box className="flex justify-between mt-1">
                <Box>
                  <div className="text-[11px] text-slate-500">Invoice to</div>
                  <div>Customer name</div>
                  <div className="text-[11px] text-slate-500">Customer address</div>
                </Box>
                <Box className="text-right">
                  <div className="text-[11px] text-slate-500">Invoice #</div>
                  <div>Generated by backend</div>
                  <div className="text-[11px] text-slate-500 mt-1">Date: issue date</div>
                </Box>
              </Box>

              <Box className="mt-2">
                <TableHeaderRow />
                <LineItemRow label="Ride or service item" qty="1" price="UGX 8,000" total="UGX 8,000" />
                <LineItemRow label="Service fee" qty="1" price="UGX 1,000" total="UGX 1,000" />
              </Box>

              {template.showTaxBreakdown ? (
                <Box className="mt-2 text-[11px] text-slate-500">
                  <div>Subtotal: UGX 9,000</div>
                  <div>VAT: calculated by backend</div>
                  <div className="font-semibold text-[12px] mt-1">Total: calculated by backend</div>
                </Box>
              ) : (
                <Box className="mt-2 text-[11px] text-slate-500">
                  <div className="font-semibold text-[12px] mt-1">Total: tax included</div>
                </Box>
              )}

              <Divider className="!my-2" />
              <Typography variant="caption" className="text-[11px] text-slate-500">
                {template.footer}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {drafts.length > 0 ? (
        <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography variant="subtitle2" className="font-semibold">
              Backend templates
            </Typography>
            <Divider className="!my-1" />
            <Box className="flex flex-col gap-2">
              {drafts.map((draft) => (
                <Box key={draft.id} className="flex items-center justify-between p-2 border border-slate-200 rounded-md">
                  <Box>
                    <Typography variant="body2" className="font-medium">
                      {draft.title || "Invoice template"}
                    </Typography>
                    <Typography variant="caption" className="text-slate-500">
                      Updated {draft.updatedAt ? new Date(draft.updatedAt).toLocaleString() : "by backend"}
                    </Typography>
                  </Box>
                  <Box className="flex gap-1">
                    <Button size="small" onClick={() => setTemplate(normalizeTemplate(draft))} disabled={saving}>
                      Load
                    </Button>
                    <IconButton size="small" onClick={() => downloadDraft(draft)} sx={{ color: EV_COLORS.primary }}>
                      <FileDownloadIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => void archiveDraft(draft)} sx={{ color: "error.main" }} disabled={saving}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      ) : null}
    </AdminInvoiceTemplateLayout>
  );
}

function TableHeaderRow() {
  return (
    <Box className="grid grid-cols-4 gap-2 text-[11px] text-slate-500 border-b border-slate-200 pb-1 mb-1">
      <span>Item</span>
      <span className="text-right">Qty</span>
      <span className="text-right">Price</span>
      <span className="text-right">Total</span>
    </Box>
  );
}

function LineItemRow({ label, qty, price, total }: { label: string; qty: string; price: string; total: string }) {
  return (
    <Box className="grid grid-cols-4 gap-2 text-[12px]">
      <span>{label}</span>
      <span className="text-right">{qty}</span>
      <span className="text-right">{price}</span>
      <span className="text-right">{total}</span>
    </Box>
  );
}
