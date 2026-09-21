import React, { type ChangeEvent, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Chip,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Snackbar,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import {
  activateAdminCommissionRule,
  createAdminCommissionRule,
  deactivateAdminCommissionRule,
  getAdminCompany,
  listAdminCommissionRules,
  patchAdminCompany,
} from '../services/api/adminApi';
import type { AdminCommissionRule, AdminCompanyResponse } from '../services/api/adminApi';

const EV_COLORS = {
  primary: "#03cd8c",
};

type CompanyVerticalKey = keyof AdminCompanyResponse["verticals"];
type CompanyField = keyof Pick<
  AdminCompanyResponse,
  "companyName" | "contactEmail" | "contactPhone" | "registrationNumber" | "taxId"
>;

type SnackbarState = {
  open: boolean;
  severity: "success" | "error";
  message: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function CompanyHeader({ company }: { company: AdminCompanyResponse }) {
  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: 8,
        border: "1px solid rgba(148,163,184,0.5)",
        mb: 3,
      }}
    >
      <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Box>
          <Typography variant="h6" className="font-semibold">
            {company.companyName}
          </Typography>
          <Typography
            variant="caption"
            className="text-[11px] text-slate-500"
          >
            Fleet Partner · {company.contactEmail || 'No contact email'}
          </Typography>
        </Box>
        <Box className="flex flex-wrap gap-1 items-center">
          <Chip
            size="small"
            label={company.status === "active" ? "Active" : company.status === "suspended" ? "Suspended" : "Inactive"}
            sx={{
              fontSize: 10,
              height: 22,
              bgcolor:
                company.status === "active"
                  ? "#ecfdf5"
                  : company.status === "suspended"
                    ? "#fee2e2"
                    : "#f1f5f9",
              borderColor:
                company.status === "active"
                  ? "#bbf7d0"
                  : company.status === "suspended"
                    ? "#fecaca"
                    : "#cbd5e1",
              borderWidth: 1,
              borderStyle: "solid",
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

function AdminCompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography
            variant="h6"
            className="font-semibold tracking-tight"
            color="text.primary"
          >
            Company Onboarding & Detail
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Review company profile, contract terms, compliance and operational
            metrics.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3">
        {children}
      </Box>
    </Box>
  );
}

export default function CompanyDetailPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<AdminCompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commissionSaving, setCommissionSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commissionError, setCommissionError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, severity: "success", message: "" });
  const [commissionRules, setCommissionRules] = useState<AdminCommissionRule[]>([]);
  const [commissionDraft, setCommissionDraft] = useState({
    serviceType: "RIDE",
    platformFeePercent: 15,
    driverSharePercent: 85,
    taxPercent: 0,
    currency: "UGX",
  });
  const [verticals, setVerticals] = useState<AdminCompanyResponse["verticals"]>({
    ride: false,
    delivery: false,
    rental: false,
    school: false,
    ems: false,
    tours: false,
  });

  useEffect(() => {
    if (!companyId) return;
    const loadCompany = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminCompany(companyId);
        const rules = await listAdminCommissionRules({ organizationId: companyId });
        setCompany(data);
        setCommissionRules(rules);
        setVerticals({
          ride: Boolean(data.verticals?.ride),
          delivery: Boolean(data.verticals?.delivery),
          rental: Boolean(data.verticals?.rental),
          school: Boolean(data.verticals?.school),
          ems: Boolean(data.verticals?.ems),
          tours: Boolean(data.verticals?.tours),
        });
      } catch (e) {
        setError(getErrorMessage(e, 'Failed to load company'));
      } finally {
        setLoading(false);
      }
    };
    loadCompany();
  }, [companyId]);

  const handleCompanyChange = (field: CompanyField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCompany((prev) => prev ? { ...prev, [field]: event.target.value } : null);
  };

  const handleVerticalToggle = (field: CompanyVerticalKey) => (event: ChangeEvent<HTMLInputElement>) => {
    setVerticals((prev) => ({ ...prev, [field]: event.target.checked }));
  };

  const loadCommissionRules = async () => {
    if (!companyId) return;
    const rules = await listAdminCommissionRules({ organizationId: companyId });
    setCommissionRules(rules);
  };

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    try {
      const updated = await patchAdminCompany(company.id, {
        companyName: company.companyName,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        registrationNumber: company.registrationNumber,
        taxId: company.taxId,
        status: company.status,
        verticals,
      });
      setCompany(updated);
      setVerticals(updated.verticals);
      setSnackbar({ open: true, severity: "success", message: "Company profile saved." });
    } catch (e) {
      setSnackbar({ open: true, severity: "error", message: getErrorMessage(e, "Failed to save company") });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCommissionRule = async () => {
    if (!company) return;
    setCommissionSaving(true);
    setCommissionError(null);
    try {
      await createAdminCommissionRule({
        name: `${company.companyName} ${commissionDraft.serviceType} commission`,
        serviceType: commissionDraft.serviceType,
        organizationId: company.id,
        platformFeePercent: Number(commissionDraft.platformFeePercent),
        driverSharePercent: Number(commissionDraft.driverSharePercent),
        taxPercent: Number(commissionDraft.taxPercent),
        tipPayoutPercent: 100,
        fixedPlatformFee: 0,
        priority: 100,
        active: true,
        currency: commissionDraft.currency,
        effectiveFrom: new Date().toISOString(),
      });
      await loadCommissionRules();
      setSnackbar({ open: true, severity: "success", message: "Company commission rule created." });
    } catch (e) {
      setCommissionError(getErrorMessage(e, "Failed to create commission rule"));
    } finally {
      setCommissionSaving(false);
    }
  };

  const handleToggleCommissionRule = async (rule: AdminCommissionRule) => {
    setCommissionSaving(true);
    setCommissionError(null);
    try {
      if (rule.active) {
        await deactivateAdminCommissionRule(rule.id);
      } else {
        await activateAdminCommissionRule(rule.id);
      }
      await loadCommissionRules();
    } catch (e) {
      setCommissionError(getErrorMessage(e, "Failed to update commission rule"));
    } finally {
      setCommissionSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !company) {
    return <Alert severity="error">{error || 'Company not found'}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Button onClick={() => navigate('/admin/companies')} startIcon={<ArrowBackIcon />} size="small" sx={{ textTransform: 'none' }}>
          Back to companies
        </Button>
      </Box>
      <AdminCompanyLayout>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar((current) => ({ ...current, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <CompanyHeader company={company} />

      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Left column – profile & contacts */}
        <Card
          elevation={1}
          sx={{
            flex: 1,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography
              variant="subtitle2"
              className="font-semibold mb-1"
            >
              Company profile
            </Typography>

            <TextField
              label="Legal / trading name"
              size="small"
              fullWidth
              value={company.companyName}
              onChange={handleCompanyChange("companyName")}
              sx={{ "& .MuiOutlinedInput-root": { } }}
            />

            <TextField
              label="Contact email"
              size="small"
              fullWidth
              value={company.contactEmail || ""}
              onChange={handleCompanyChange("contactEmail")}
              sx={{ "& .MuiOutlinedInput-root": { } }}
            />

            <TextField
              label="Contact phone"
              size="small"
              fullWidth
              value={company.contactPhone || ""}
              onChange={handleCompanyChange("contactPhone")}
              sx={{ "& .MuiOutlinedInput-root": { } }}
            />

            <TextField
              label="Registration number"
              size="small"
              fullWidth
              value={company.registrationNumber || ""}
              onChange={handleCompanyChange("registrationNumber")}
              sx={{ "& .MuiOutlinedInput-root": { } }}
            />

            <TextField
              label="Tax ID"
              size="small"
              fullWidth
              value={company.taxId || ""}
              onChange={handleCompanyChange("taxId")}
              sx={{ "& .MuiOutlinedInput-root": { } }}
            />

            <Typography
              variant="caption"
              className="text-[11px] text-slate-500 mt-1"
            >
              Onboarding changes should be reviewed by a Mobility Admin before
              activating the company.
            </Typography>
          </CardContent>
        </Card>

        {/* Right column – payout contract & vertical rights */}
        <Card
          elevation={1}
          sx={{
            flex: 1,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography
              variant="subtitle2"
              className="font-semibold mb-1"
            >
              Payout contract & vertical rights
            </Typography>

            <Alert
              severity="info"
              action={
                <Button
                  size="small"
                  onClick={() => navigate(`/admin/finance/companies/${company.id}`)}
                  sx={{ textTransform: "none" }}
                >
                  Open payout settings
                </Button>
              }
            >
              Payout settings are managed by the backend finance screen. Commission rules below are company-scoped and persisted through the backend commission engine.
            </Alert>

            {commissionError ? <Alert severity="error">{commissionError}</Alert> : null}

            <Box className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <TextField
                select
                size="small"
                label="Service"
                value={commissionDraft.serviceType}
                onChange={(event) => setCommissionDraft((prev) => ({ ...prev, serviceType: event.target.value }))}
              >
                {[
                  ["RIDE", "Ride"],
                  ["DELIVERY", "Delivery"],
                  ["CAR_RENTAL", "Rental"],
                  ["SCHOOL_SHUTTLE", "School"],
                  ["AMBULANCE", "EMS"],
                  ["TOURIST_VEHICLE", "Tours"],
                ].map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                label="Platform %"
                type="number"
                value={commissionDraft.platformFeePercent}
                onChange={(event) => setCommissionDraft((prev) => ({ ...prev, platformFeePercent: Number(event.target.value) }))}
              />
              <TextField
                size="small"
                label="Provider %"
                type="number"
                value={commissionDraft.driverSharePercent}
                onChange={(event) => setCommissionDraft((prev) => ({ ...prev, driverSharePercent: Number(event.target.value) }))}
              />
              <TextField
                size="small"
                label="Tax %"
                type="number"
                value={commissionDraft.taxPercent}
                onChange={(event) => setCommissionDraft((prev) => ({ ...prev, taxPercent: Number(event.target.value) }))}
              />
              <Button
                variant="outlined"
                onClick={handleCreateCommissionRule}
                disabled={commissionSaving}
                sx={{ textTransform: "none" }}
              >
                Add rule
              </Button>
            </Box>

            {commissionRules.length === 0 ? (
              <Alert severity="warning">No company-specific commission rules are configured.</Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Service</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Platform</TableCell>
                    <TableCell align="right">Provider</TableCell>
                    <TableCell align="right">Tax</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {commissionRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>{rule.serviceType}</TableCell>
                      <TableCell><Chip size="small" label={rule.active ? "active" : "inactive"} /></TableCell>
                      <TableCell align="right">{rule.platformFeePercent}%</TableCell>
                      <TableCell align="right">{rule.driverSharePercent}%</TableCell>
                      <TableCell align="right">{rule.taxPercent}%</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => void handleToggleCommissionRule(rule)}
                          disabled={commissionSaving}
                          sx={{ textTransform: "none" }}
                        >
                          {rule.active ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <Divider className="!my-2" />

            <Typography
              variant="subtitle2"
              className="font-semibold mb-1"
            >
              Vertical rights (services this company can operate)
            </Typography>

            <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={verticals.ride}
                    onChange={handleVerticalToggle("ride")}
                  />
                }
                label="Ride-hailing"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={verticals.delivery}
                    onChange={handleVerticalToggle("delivery")}
                  />
                }
                label="Delivery"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={verticals.rental}
                    onChange={handleVerticalToggle("rental")}
                  />
                }
                label="Rental"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={verticals.school}
                    onChange={handleVerticalToggle("school")}
                  />
                }
                label="School shuttles"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={verticals.ems}
                    onChange={handleVerticalToggle("ems")}
                  />
                }
                label="EMS / Ambulance"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={verticals.tours}
                    onChange={handleVerticalToggle("tours")}
                  />
                }
                label="Tours & tourism"
              />
            </Box>

            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Ambulance and school shuttle verticals may require additional
              approvals from the Medical or School modules.
            </Typography>

            <Box className="flex gap-2 mt-2 justify-end">
              <Button
                variant="outlined"
                onClick={() => navigate('/admin/companies')}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                startIcon={<SaveIcon />}
                sx={{
                  bgcolor: EV_COLORS.primary,
                  '&:hover': { bgcolor: '#0fb589' },
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
      </AdminCompanyLayout>
    </Box>
  );
}
