// @ts-nocheck
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Chip,
  Button,
  Divider,
} from "@mui/material";

// Invoice Template Preview – shared lightweight screen
// In a real app this could be a modal or side panel launched from I3.
// For this canvas, treat it as a standalone page/component that renders a
// sample invoice and allows editing header/footer and a few toggles.
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - Header shows EVZONE ADMIN and subtitle "Finance · Invoice template".
//    - Title "Invoice Template Preview" visible.
//    - Form on the left to edit header text, footer text and show/hide EV
//      logo and tax breakdown.
//    - On the right, a sample invoice preview card shows company, invoice
//      number, dates, line items and totals.
// 2) Theme toggle
//    - Toggle Light/Dark; both the form and the preview adjust colours while
//      keeping content intact.
// 3) Editing fields
//    - Changing header/footer text updates the preview instantly.
// 4) Save
//    - Clicking "Save template" saves to local list and downloads a JSON file.
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

function AdminInvoiceTemplateLayout({ children }) {
  const [mode, setMode] = useState("light");
  const isDark = mode === "dark";

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <Box
      className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? "bg-slate-950 text-slate-50" : "bg-slate-50 text-slate-900"
        }`}
      sx={{
        background: isDark
          ? `radial-gradient(circle at top left, ${EV_COLORS.primary}18, #020617), radial-gradient(circle at bottom right, ${EV_COLORS.secondary}10, #020617)`
          : `radial-gradient(circle at top left, ${EV_COLORS.primary}12, #ffffff), radial-gradient(circle at bottom right, ${EV_COLORS.secondary}08, #f9fafb)`,
      }}
    >
      {/* Header */}
      <Box className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <Box>
          <Typography
            variant="subtitle2"
            className={`tracking-[0.25em] uppercase text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"
              }`}
          >
            EVZONE ADMIN
          </Typography>
          <Typography
            variant="caption"
            className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"
              }`}
          >
            Finance · Invoice template
          </Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <Chip
            size="small"
            label="Template"
            sx={{
              bgcolor: "#eef2ff",
              borderColor: "#c7d2fe",
              color: "#1e3a8a",
              fontSize: 10,
            }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={toggleMode}
            sx={{
              textTransform: "none",
              borderRadius: 999,
              borderColor: isDark ? "#1f2937" : "#e5e7eb",
              color: isDark ? "#e5e7eb" : "#374151",
              px: 1.8,
              py: 0.4,
              fontSize: 11,
              minWidth: "auto",
            }}
          >
            {isDark ? "Dark" : "Light"}
          </Button>
        </Box>
      </Box>

      {/* Title */}
      <Box className="px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between gap-2">
        <Box>
          <Typography
            variant="h6"
            className={`font-semibold tracking-tight ${isDark ? "text-slate-50" : "text-slate-900"
              }`}
          >
            Invoice Template Preview
          </Typography>
          <Typography
            variant="caption"
            className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"
              }`}
          >
            Adjust header, footer and basic layout. Detailed styling happens in
            your design system.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col px-4 sm:px-6 pb-6 gap-3">
        {children}
      </Box>
    </Box>
  );
}

export default function InvoiceTemplatePreviewPage() {
  const [template, setTemplate] = useState({
    header: "EVzone Mobility – Official Receipt",
    footer: "Thank you for choosing EVzone. For support: support@evzone.com",
    showLogo: true,
    showTaxBreakdown: true,
  });

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setTemplate((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field) => () => {
    setTemplate((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const [drafts, setDrafts] = useState([]);

  const handleSave = () => {
    // Save to drafts
    const newDraft = {
      id: Date.now(),
      name: `Template Draft ${drafts.length + 1}`,
      date: new Date().toLocaleDateString(),
      data: { ...template }
    };
    setDrafts(prev => [newDraft, ...prev]);

    // Download file
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `invoice_template_${newDraft.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const deleteDraft = (id) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  const downloadDraft = (draft) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(draft.data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `invoice_template_${draft.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <AdminInvoiceTemplateLayout>
      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Left – Form */}
        <Card
          elevation={1}
          sx={{
            flex: 1,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "linear-gradient(145deg, #f9fafb, #ffffff)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography
              variant="subtitle2"
              className="font-semibold text-slate-900"
            >
              Template settings
            </Typography>
            <Divider className="!my-1" />

            <TextField
              label="Header text"
              size="small"
              fullWidth
              value={template.header}
              onChange={handleFieldChange("header")}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
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
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
            />

            <Box className="flex flex-wrap gap-2 text-[12px] text-slate-700 mt-1">
              <Chip
                size="small"
                label={template.showLogo ? "Logo: shown" : "Logo: hidden"}
                onClick={handleToggle("showLogo")}
                sx={{ fontSize: 10, height: 22, cursor: "pointer" }}
              />
              <Chip
                size="small"
                label={
                  template.showTaxBreakdown
                    ? "Tax breakdown: shown"
                    : "Tax breakdown: hidden"
                }
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
                onClick={handleSave}
              >
                Save template
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Right – Preview */}
        <Card
          elevation={1}
          sx={{
            flex: 1.2,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "#ffffff",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Live preview (sample invoice)
            </Typography>
            <Box className="border border-slate-200 rounded-md p-3 text-[12px] text-slate-800">
              {template.showLogo && (
                <Box className="mb-2 flex items-center gap-2">
                  <Box
                    className="w-6 h-6 rounded-full"
                    sx={{ bgcolor: EV_COLORS.primary }}
                  />
                  <span className="font-semibold">EVzone Mobility</span>
                </Box>
              )}
              <Typography
                variant="body2"
                className="font-semibold mb-1 text-[13px]"
              >
                {template.header}
              </Typography>
              <Divider className="!my-1" />
              <Box className="flex justify-between mt-1">
                <Box>
                  <div className="text-[11px] text-slate-500">Invoice to</div>
                  <div>Example Customer</div>
                  <div className="text-[11px] text-slate-500">
                    Kampala, Uganda
                  </div>
                </Box>
                <Box className="text-right">
                  <div className="text-[11px] text-slate-500">Invoice #</div>
                  <div>UG-INV-000123</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Date: 2025-11-25
                  </div>
                </Box>
              </Box>

              <Box className="mt-2">
                <TableHeaderRow />
                <LineItemRow
                  label="EV Ride – City"
                  qty="1"
                  price="$8.00"
                  total="$8.00"
                />
                <LineItemRow
                  label="Service fee"
                  qty="1"
                  price="$1.00"
                  total="$1.00"
                />
              </Box>

              {template.showTaxBreakdown && (
                <Box className="mt-2 text-[11px] text-slate-600">
                  <div>Subtotal: $9.00</div>
                  <div>VAT (18%): $1.62</div>
                  <div className="font-semibold text-[12px] mt-1">
                    Total: $10.62
                  </div>
                </Box>
              )}

              {!template.showTaxBreakdown && (
                <Box className="mt-2 text-[11px] text-slate-600">
                  <div className="font-semibold text-[12px] mt-1">
                    Total: $10.62 (tax included)
                  </div>
                </Box>
              )}

              <Divider className="!my-2" />
              <Typography
                variant="caption"
                className="text-[11px] text-slate-500"
              >
                {template.footer}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
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

function LineItemRow({ label, qty, price, total }) {
  return (
    <Box className="grid grid-cols-4 gap-2 text-[12px] text-slate-800">
      <span>{label}</span>
      <span className="text-right">{qty}</span>
      <span className="text-right">{price}</span>
      <span className="text-right">{total}</span>
    </Box>
  );
}
