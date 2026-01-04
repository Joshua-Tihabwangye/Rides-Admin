// @ts-nocheck
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
} from "@mui/material";

// I3 – Taxes & Invoicing (Light/Dark, EVzone themed)
// Route suggestion: /admin/finance/tax-invoices
// This screen gives a bird's-eye view of tax regions and invoice templates.
// It conceptually links to:
//  - Invoice Template Preview (separate canvas / modal page)
//  - Region Tax Config Editor (/admin/finance/tax-invoices/:regionId/edit)
// Strong audit integration: all relevant actions log AuditLog-style entries.
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - Header shows EVZONE ADMIN and subtitle "Finance · Taxes & Invoicing".
//    - Title "Taxes & Invoicing" with subtitle about tax rules & templates.
//    - Region tax overview card and Invoice template summary card are visible.
// 2) Theme toggle
//    - Toggle Light/Dark using the header button; cards update while data
//      remains intact.
// 3) Edit region
//    - Click the "Edit" button for Uganda or Kenya.
//    - Expect a console log indicating navigation to the Region Tax Config
//      Editor for that region, plus an AuditLog-style entry.
//    - A small inline "Currently editing" card should also appear at the
//      bottom showing the selected region id + name.
// 4) Preview template
//    - Click "Preview template"; expect a console log indicating opening the
//      template preview editor and an AuditLog-style entry.
// 5) Row click safety
//    - Clicking directly on a table cell (not the Edit button) should NOT
//      throw errors; behavior is read-only.

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

function AdminFinanceTaxLayout({ children }) {
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
            Finance · Taxes & Invoicing
          </Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <Chip
            size="small"
            label="Taxes & Invoices"
            sx={{
              bgcolor: "#fefce8",
              borderColor: "#facc15",
              color: "#92400e",
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
            Taxes & Invoicing
          </Typography>
          <Typography
            variant="caption"
            className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"
              }`}
          >
            Configure tax rules and invoice templates per region. All changes
            should be written to the audit log.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col px-4 sm:px-6 pb-6 gap-3">
        {children}
      </Box>
    </Box>
  );
}

const SAMPLE_REGIONS = [
  {
    id: "UG",
    name: "Uganda",
    taxName: "VAT",
    taxRate: "18%",
    invoicePrefix: "UG-INV-",
  },
  {
    id: "KE",
    name: "Kenya",
    taxName: "VAT",
    taxRate: "16%",
    invoicePrefix: "KE-INV-",
  },
];

export default function TaxesInvoicingPage() {
  const [regions] = useState(SAMPLE_REGIONS);
  const [editingRegion, setEditingRegion] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleEditRegion = (region) => {
    setEditingRegion(region);
    console.log("Navigate to Region Tax Config Editor for region:", region.id);
    console.log("AuditLog:", {
      event: "TAX_REGION_EDIT_OPENED",
      regionId: region.id,
      regionName: region.name,
      at: new Date().toISOString(),
      actor: "Admin (simulated)",
    });
  };

  const handlePreviewTemplate = () => {
    console.log("Open Invoice Template Preview editor");
    console.log("AuditLog:", {
      event: "INVOICE_TEMPLATE_PREVIEW_OPENED",
      at: new Date().toISOString(),
      actor: "Admin (simulated)",
    });
  };

  return (
    <AdminFinanceTaxLayout>
      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Region tax overview */}
        <Card
          elevation={1}
          sx={{
            flex: 1.4,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "linear-gradient(145deg, #f9fafb, #ffffff)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography
              variant="subtitle2"
              className="font-semibold text-slate-900"
            >
              Region tax overview
            </Typography>
            <Divider className="!my-1" />
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f3f4f6" }}>
                    <TableCell>Region</TableCell>
                    <TableCell>Tax name</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell>Invoice prefix</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {regions.map((region) => (
                    <TableRow key={region.id}>
                      <TableCell>{region.name}</TableCell>
                      <TableCell>{region.taxName}</TableCell>
                      <TableCell align="right">{region.taxRate}</TableCell>
                      <TableCell>{region.invoicePrefix}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="text"
                          disabled={isSaving}
                          sx={{
                            textTransform: "none",
                            fontSize: 11,
                            minWidth: "auto",
                            padding: 0,
                            color: EV_COLORS.primary,
                          }}
                          onClick={() => {
                            setIsSaving(true);
                            handleEditRegion(region);
                            setTimeout(() => setIsSaving(false), 1500);
                          }}
                        >
                          {isSaving ? 'Saving...' : 'Edit'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Invoice template summary */}
        <Card
          elevation={1}
          sx={{
            flex: 1,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "linear-gradient(145deg, #eef2ff, #ffffff)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography
              variant="subtitle2"
              className="font-semibold text-slate-900"
            >
              Invoice template settings
            </Typography>
            <Typography
              variant="caption"
              className="text-[11px] text-slate-600"
            >
              Header/footer text, logo placement and line-item layout. These
              apply globally, with per-region overrides for tax lines.
            </Typography>
            <Divider className="!my-1" />

            <Box className="flex flex-col gap-1 text-[12px] text-slate-800">
              <Typography variant="body2">
                • Global header: "EVzone Mobility – Official Receipt".
              </Typography>
              <Typography variant="body2">
                • Footer: "Thank you for choosing EVzone" + contact info.
              </Typography>
              <Typography variant="body2">
                • Tax lines: region-specific name & rate taken from region
                config.
              </Typography>
            </Box>

            <Box className="flex items-center justify-between mt-2">
              <Typography
                variant="caption"
                className="text-[11px] text-slate-500"
              >
                Edit templates in the dedicated Invoice Template Preview
                editor.
              </Typography>
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
                onClick={handlePreviewTemplate}
              >
                Preview template
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Inline feedback: currently editing region */}
      {editingRegion && (
        <Card
          elevation={0}
          sx={{
            mt: 2,
            borderRadius: 8,
            border: "1px dashed rgba(148,163,184,0.7)",
            background: "#f9fafb",
          }}
        >
          <CardContent className="p-3 flex items-center justify-between gap-2">
            <Typography
              variant="caption"
              className="text-[11px] text-slate-600"
            >
              Currently editing configuration for region: {editingRegion.name} ({
                editingRegion.id
              }).
            </Typography>
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Suggested route: /admin/finance/tax-invoices/{editingRegion.id}/edit
            </Typography>
          </CardContent>
        </Card>
      )}
    </AdminFinanceTaxLayout>
  );
}
