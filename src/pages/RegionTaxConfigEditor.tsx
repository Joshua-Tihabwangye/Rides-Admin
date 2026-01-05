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
  TextField,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

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

function AdminFinanceTaxLayout({ children }) {
  // Theme options removed for consistency with other cleanups, or preserved if user didn't ask to remove here.
  // User only asked to remove on Services page. I'll keep it simple/static here for now to avoid complexity.

  return (
    <Box
      className="min-h-screen flex flex-col bg-slate-50 text-slate-900"
      sx={{
        background: `radial-gradient(circle at top left, ${EV_COLORS.primary}12, #ffffff), radial-gradient(circle at bottom right, ${EV_COLORS.secondary}08, #f9fafb)`,
      }}
    >
      {/* Header */}
      <Box className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <Box>
          <Typography
            variant="subtitle2"
            className="tracking-[0.25em] uppercase text-[11px] text-slate-500"
          >
            EVZONE ADMIN
          </Typography>
          <Typography
            variant="caption"
            className="text-[11px] text-slate-600"
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
        </Box>
      </Box>

      {/* Title */}
      <Box className="px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between gap-2">
        <Box>
          <Typography
            variant="h6"
            className="font-semibold tracking-tight text-slate-900"
          >
            Taxes & Invoicing
          </Typography>
          <Typography
            variant="caption"
            className="text-[11px] text-slate-600"
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

// Sub-component for editing a region
function TaxRegionEditor({ regionId, onCancel }) {
  const navigate = useNavigate();
  const region = SAMPLE_REGIONS.find(r => r.id === regionId) || {
    id: regionId, name: 'Unknown', taxName: '', taxRate: '', invoicePrefix: ''
  };

  const [formData, setFormData] = useState(region);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      // In a real app, we'd update state/backend here
      navigate('/admin/finance/tax-invoices');
    }, 800);
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/admin/finance/tax-invoices')}
        sx={{ mb: 2, textTransform: 'none', color: 'text.secondary' }}
      >
        Back to overview
      </Button>

      <Card elevation={1} sx={{ borderRadius: 4, maxWidth: 600 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Edit Tax Configuration: {region.name}
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Box className="flex flex-col gap-4">
            <Box>
              <TextField
                fullWidth
                label="Tax Name"
                value={formData.taxName}
                onChange={(e) => setFormData({ ...formData, taxName: e.target.value })}
                placeholder="e.g. VAT, GST"
                size="small"
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Tax Rate"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                placeholder="e.g. 18%"
                size="small"
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Invoice Prefix"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                placeholder="e.g. UG-INV-"
                size="small"
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button variant="outlined" onClick={() => navigate('/admin/finance/tax-invoices')}>
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                sx={{ bgcolor: EV_COLORS.primary }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function TaxesInvoicingPage() {
  const { regionId } = useParams();
  const navigate = useNavigate();

  // If regionId is present, show the editor
  if (regionId) {
    return (
      <AdminFinanceTaxLayout>
        <TaxRegionEditor regionId={regionId} />
      </AdminFinanceTaxLayout>
    )
  }

  // Dashboard View
  const handleEditRegion = (region) => {
    navigate(`/admin/finance/tax-invoices/${region.id}/edit`);
  };

  const handlePreviewTemplate = () => {
    navigate('/admin/finance/tax-invoices/template-preview');
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
                  {SAMPLE_REGIONS.map((region) => (
                    <TableRow key={region.id}>
                      <TableCell>{region.name}</TableCell>
                      <TableCell>{region.taxName}</TableCell>
                      <TableCell align="right">{region.taxRate}</TableCell>
                      <TableCell>{region.invoicePrefix}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="text"
                          sx={{
                            textTransform: "none",
                            fontSize: 11,
                            minWidth: "auto",
                            padding: 0,
                            color: EV_COLORS.primary,
                          }}
                          onClick={() => handleEditRegion(region)}
                        >
                          Edit
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
    </AdminFinanceTaxLayout>
  );
}
