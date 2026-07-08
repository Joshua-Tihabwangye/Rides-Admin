import React, { useState, useEffect } from 'react';
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
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { getAdminCompany, patchAdminCompany } from '../services/api/adminApi';
import type { AdminCompanyResponse } from '../services/api/adminApi';

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

function CompanyHeader({ company, onEdit = () => {} }) {
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
            label={company.status === "approved" ? "Active" : company.status === "pending" ? "Pending" : company.status === "suspended" ? "Suspended" : "Inactive"}
            sx={{
              fontSize: 10,
              height: 22,
              bgcolor:
                company.status === "approved"
                  ? "#ecfdf5"
                  : company.status === "pending"
                    ? "#fefce8"
                    : "#fee2e2",
              borderColor:
                company.status === "approved"
                  ? "#bbf7d0"
                  : company.status === "pending"
                    ? "#facc15"
                    : "#fecaca",
              borderWidth: 1,
              borderStyle: "solid",
            }}
          />
          <Chip
            size="small"
            label="Ride & Delivery"
            sx={{ fontSize: 10, height: 22 }}
          />
          <Chip
            size="small"
            label="Rental"
            sx={{ fontSize: 10, height: 22 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

function AdminCompanyLayout({ children }) {
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
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const [commission, setCommission] = useState({
    baseRate: "12%",
    minFare: "UGX 1,500",
    surgeShare: "80%",
  });
  const [verticals, setVerticals] = useState({
    ride: true,
    delivery: true,
    rental: true,
    school: false,
    ems: false,
    tours: true,
  });

  useEffect(() => {
    if (!companyId) return;
    const loadCompany = async () => {
      setLoading(true);
      try {
        const data = await getAdminCompany(companyId as string);
        setCompany(data);
        // Set verticals from backend if available
        if (data.verticals) {
          setVerticals({
            ride: data.verticals.ride || false,
            delivery: data.verticals.delivery || false,
            rental: data.verticals.rental || false,
            school: data.verticals.school || false,
            ems: data.verticals.ems || false,
            tours: data.verticals.tours || false,
          });
        }
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load company');
      } finally {
        setLoading(false);
      }
    };
    loadCompany();
  }, [companyId]);

  const handleCompanyChange = (field) => (event) => {
    setCompany((prev) => prev ? { ...prev, [field]: event.target.value } : null);
  };

  const handleCommissionChange = (field) => (event) => {
    setCommission((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleVerticalToggle = (field) => (event) => {
    setVerticals((prev) => ({ ...prev, [field]: event.target.checked }));
  };

  const handleSave = async () => {
    if (!company) return;
    try {
      await patchAdminCompany(company.id, {
        companyName: company.companyName,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        registrationNumber: company.registrationNumber,
        taxId: company.taxId,
        status: company.status,
        verticals,
      });
      setSnackbarOpen(true);
    } catch (e) {
      console.error("Failed to save company:", e);
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
    <AdminCompanyLayout>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          Changes saved successfully!
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

        {/* Right column – commission & vertical rights */}
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
              Commission & contract
            </Typography>

            <Box className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <TextField
                label="Base commission rate"
                size="small"
                value={commission.baseRate}
                onChange={handleCommissionChange("baseRate")}
                sx={{ "& .MuiOutlinedInput-root": { } }}
              />
              <TextField
                label="Minimum fare"
                size="small"
                value={commission.minFare}
                onChange={handleCommissionChange("minFare")}
                sx={{ "& .MuiOutlinedInput-root": { } }}
              />
              <TextField
                label="Surge share"
                size="small"
                value={commission.surgeShare}
                onChange={handleCommissionChange("surgeShare")}
                sx={{ "& .MuiOutlinedInput-root": { } }}
              />
            </Box>

            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Commission changes affect payouts for all trips under this
              company. Use cautiously and audit via the system log.
            </Typography>

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
                disabled={loading}
                startIcon={<SaveIcon />}
                sx={{
                  bgcolor: EV_COLORS.primary,
                  '&:hover': { bgcolor: '#0fb589' },
                }}
              >
                Save Changes
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AdminCompanyLayout>
  );
}
