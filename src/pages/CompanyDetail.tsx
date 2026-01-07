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
  Switch,
  FormControlLabel,
  Snackbar,
  Alert
} from "@mui/material";

// C2 – Company Onboarding / Detail (Light/Dark, EVzone themed)
// Route suggestion: /admin/companies/:companyId
// Shows company profile, contract & commission, compliance and operations.
// Uses a shared CompanyHeader component (duplicated here for canvas) which
// will also be used in I2.

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

const SAMPLE_COMPANY = {
  id: 1,
  name: "GreenMove Fleet",
  status: "Active",
  type: "Fleet partner",
  regions: "Kampala, Entebbe",
  contactName: "James Fleet",
  contactEmail: "james.fleet@greenmove.com",
  contactPhone: "+256 700 111 111",
};

function CompanyHeader({ company }) {
  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: 8,
        border: "1px solid rgba(148,163,184,0.5)",
        background: "linear-gradient(145deg, #ecfdf5, #ffffff)",
        mb: 3,
      }}
    >
      <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Box>
          <Typography variant="h6" className="font-semibold text-slate-900">
            {company.name}
          </Typography>
          <Typography
            variant="caption"
            className="text-[11px] text-slate-600"
          >
            {company.type} · {company.regions}
          </Typography>
        </Box>
        <Box className="flex flex-wrap gap-1 items-center">
          <Chip
            size="small"
            label={company.status}
            sx={{
              fontSize: 10,
              height: 22,
              bgcolor:
                company.status === "Active"
                  ? "#ecfdf5"
                  : company.status === "Pending"
                    ? "#fefce8"
                    : "#fee2e2",
              borderColor:
                company.status === "Active"
                  ? "#bbf7d0"
                  : company.status === "Pending"
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
      {/* Title */}
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
  const [company, setCompany] = useState(SAMPLE_COMPANY);
  const [commission, setCommission] = useState({
    baseRate: "12%",
    minFare: "$1.50",
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

  const handleCompanyChange = (field) => (event) => {
    setCompany((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleCommissionChange = (field) => (event) => {
    setCommission((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleVerticalToggle = (field) => (event) => {
    setVerticals((prev) => ({ ...prev, [field]: event.target.checked }));
  };

  const [snackbarOpen, setSnackbarOpen] = useState(false);

  React.useEffect(() => {
    const handleSaveTrigger = () => {
      // Mock save delay
      setTimeout(() => setSnackbarOpen(true), 500);
    };
    window.addEventListener('company-save-trigger', handleSaveTrigger);
    return () => window.removeEventListener('company-save-trigger', handleSaveTrigger);
  }, []);

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
            background: "linear-gradient(145deg, #f9fafb, #ffffff)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography
              variant="subtitle2"
              className="font-semibold text-slate-900 mb-1"
            >
              Company profile
            </Typography>

            <TextField
              label="Legal / trading name"
              size="small"
              fullWidth
              value={company.name}
              onChange={handleCompanyChange("name")}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
            />

            <TextField
              label="Primary regions"
              size="small"
              fullWidth
              value={company.regions}
              onChange={handleCompanyChange("regions")}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
            />

            <TextField
              label="Company type"
              size="small"
              fullWidth
              value={company.type}
              onChange={handleCompanyChange("type")}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
            />

            <Divider className="!my-2" />

            <Typography
              variant="subtitle2"
              className="font-semibold text-slate-900 mb-1"
            >
              Contact information
            </Typography>

            <TextField
              label="Contact person"
              size="small"
              fullWidth
              value={company.contactName}
              onChange={handleCompanyChange("contactName")}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
            />

            <TextField
              label="Contact email"
              size="small"
              fullWidth
              value={company.contactEmail}
              onChange={handleCompanyChange("contactEmail")}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
            />

            <TextField
              label="Contact phone"
              size="small"
              fullWidth
              value={company.contactPhone}
              onChange={handleCompanyChange("contactPhone")}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
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
            background: "linear-gradient(145deg, #fefce8, #ffffff)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography
              variant="subtitle2"
              className="font-semibold text-slate-900 mb-1"
            >
              Commission & contract
            </Typography>

            <Box className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <TextField
                label="Base commission rate"
                size="small"
                value={commission.baseRate}
                onChange={handleCommissionChange("baseRate")}
                sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
              />
              <TextField
                label="Minimum fare"
                size="small"
                value={commission.minFare}
                onChange={handleCommissionChange("minFare")}
                sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
              />
              <TextField
                label="Surge share"
                size="small"
                value={commission.surgeShare}
                onChange={handleCommissionChange("surgeShare")}
                sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
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
              className="font-semibold text-slate-900 mb-1"
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
          </CardContent>
        </Card>
      </Box>
    </AdminCompanyLayout>
  );
}
