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
  FormControlLabel,
  Switch,
  TextField,
  Snackbar,
  Alert
} from "@mui/material";

// F5 – Vertical Service Policies (Light/Dark, EVzone themed)
// Route suggestion: /admin/services/policies
// Defines additional constraints per vertical: Rental, School shuttle, EMS,
// Tours. References the same services as in F1 (Ride, Delivery, Rental,
// School shuttles, Tours, EMS) but adds vertical-specific rules such as
// training requirements and EV exceptions.
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - Header shows EVZONE ADMIN and subtitle "Vertical service policies".
//    - Four vertical cards are visible: Rental, School shuttles, EMS, Tours.
// 2) Theme toggle
//    - Toggle Light/Dark; cards and background update while all switches and
//      text field values remain intact.
// 3) Switches
//    - Toggle the switches (e.g. Allow non-EV exceptions for Rental). Expect
//      local state to update and a console log summarizing the vertical
//      policy state.
// 4) Limits & requirements
//    - Edit numeric/text fields (e.g. Min driver rating for Tours) and click
//      "Save policies"; expect a console log with the full policies object.

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

function AdminVerticalPoliciesLayout({ children }) {
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
            Vertical service policies
          </Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <Chip
            size="small"
            label="Verticals"
            sx={{
              bgcolor: "#ecfdf5",
              borderColor: "#bbf7d0",
              color: "#14532d",
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
            Vertical Service Policies
          </Typography>
          <Typography
            variant="caption"
            className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"
              }`}
          >
            Additional rules applied on top of core service configuration for
            Rental, School, EMS and Tours.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col px-4 sm:px-6 pb-6 gap-3">
        {children}
      </Box>
    </Box>
  );
}

export default function VerticalPoliciesPage() {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [policies, setPolicies] = useState({
    rental: {
      allowNonEvException: false,
      maxVehicleAgeYears: 6,
      minDriverRating: 4.2,
    },
    school: {
      requireBackgroundCheck: true,
      minTrainingModules: 3,
      maxKidsPerVehicle: 24,
    },
    ems: {
      allowNonEvForAmbulance: true,
      responseTimeTargetMin: 8,
      requireMedicalPartnerApproval: true,
    },
    tours: {
      minDriverRating: 4.5,
      requireLocalGuide: false,
      maxDailyDrivingHours: 10,
    },
  });

  const handleToggle = (vertical, field) => (event) => {
    const checked = event.target.checked;
    setPolicies((prev) => {
      const next = {
        ...prev,
        [vertical]: { ...prev[vertical], [field]: checked },
      };
      console.log("Updated vertical policies:", vertical, next[vertical]);
      return next;
    });
  };

  const handleNumberChange = (vertical, field) => (event) => {
    const value = Number(event.target.value || 0);
    setPolicies((prev) => ({
      ...prev,
      [vertical]: { ...prev[vertical], [field]: value },
    }));
  };

  const handleSave = () => {
    console.log("Saving vertical policies:", policies);
    setSnackbarOpen(true);
  };

  const { rental, school, ems, tours } = policies;

  return (
    <AdminVerticalPoliciesLayout>
      <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rental */}
        <Card
          elevation={1}
          sx={{
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
              Rental policies
            </Typography>
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Applies on top of Ride & Rental services. Rental vehicles should
              be EV-only except where explicitly allowed.
            </Typography>
            <Divider className="!my-1" />

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={rental.allowNonEvException}
                  onChange={handleToggle("rental", "allowNonEvException")}
                />
              }
              label={
                <Typography
                  variant="body2"
                  className="text-[12px] text-slate-700"
                >
                  Allow non-EV exception for specific partners (tours etc.)
                </Typography>
              }
            />

            <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <NumberField
                label="Max vehicle age (years)"
                value={rental.maxVehicleAgeYears}
                onChange={handleNumberChange("rental", "maxVehicleAgeYears")}
              />
              <NumberField
                label="Min driver rating"
                value={rental.minDriverRating}
                step="0.1"
                onChange={handleNumberChange("rental", "minDriverRating")}
              />
            </Box>
          </CardContent>
        </Card>

        {/* School shuttles */}
        <Card
          elevation={1}
          sx={{
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
              School shuttle policies
            </Typography>
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Extra safeguards for School shuttles: vetting, training and
              capacity constraints.
            </Typography>
            <Divider className="!my-1" />

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={school.requireBackgroundCheck}
                  onChange={handleToggle("school", "requireBackgroundCheck")}
                />
              }
              label={
                <Typography
                  variant="body2"
                  className="text-[12px] text-slate-700"
                >
                  Require background check for all School drivers
                </Typography>
              }
            />

            <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <NumberField
                label="Min training modules"
                value={school.minTrainingModules}
                onChange={handleNumberChange("school", "minTrainingModules")}
              />
              <NumberField
                label="Max kids per vehicle"
                value={school.maxKidsPerVehicle}
                onChange={handleNumberChange("school", "maxKidsPerVehicle")}
              />
            </Box>
          </CardContent>
        </Card>

        {/* EMS */}
        <Card
          elevation={1}
          sx={{
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "linear-gradient(145deg, #fef2f2, #ffffff)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography
              variant="subtitle2"
              className="font-semibold text-slate-900"
            >
              EMS / Ambulance policies
            </Typography>
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              EMS may permit non-EV vehicles for mission-critical cases, but
              still enforces strict response targets.
            </Typography>
            <Divider className="!my-1" />

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={ems.allowNonEvForAmbulance}
                  onChange={handleToggle("ems", "allowNonEvForAmbulance")}
                />
              }
              label={
                <Typography
                  variant="body2"
                  className="text-[12px] text-slate-700"
                >
                  Allow non-EV vehicles for Ambulance category
                </Typography>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={ems.requireMedicalPartnerApproval}
                  onChange={handleToggle("ems", "requireMedicalPartnerApproval")}
                />
              }
              label={
                <Typography
                  variant="body2"
                  className="text-[12px] text-slate-700"
                >
                  Require approval from Medical module partners
                </Typography>
              }
            />

            <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <NumberField
                label="Response time target (minutes)"
                value={ems.responseTimeTargetMin}
                onChange={handleNumberChange("ems", "responseTimeTargetMin")}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Tours */}
        <Card
          elevation={1}
          sx={{
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "linear-gradient(145deg, #fefce8, #ffffff)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography
              variant="subtitle2"
              className="font-semibold text-slate-900"
            >
              Tours & tourism policies
            </Typography>
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Extra expectations for tour operators: driver rating thresholds,
              guide presence and maximum daily hours.
            </Typography>
            <Divider className="!my-1" />

            <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <NumberField
                label="Min driver rating"
                value={tours.minDriverRating}
                step="0.1"
                onChange={handleNumberChange("tours", "minDriverRating")}
              />
              <NumberField
                label="Max daily driving hours"
                value={tours.maxDailyDrivingHours}
                onChange={handleNumberChange("tours", "maxDailyDrivingHours")}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={tours.requireLocalGuide}
                  onChange={handleToggle("tours", "requireLocalGuide")}
                />
              }
              label={
                <Typography
                  variant="body2"
                  className="text-[12px] text-slate-700"
                >
                  Require certified local guide for long tours
                </Typography>
              }
            />
          </CardContent>
        </Card>
      </Box>

      <Box className="mt-2 flex items-center justify-between">
        <Typography
          variant="caption"
          className="text-[11px] text-slate-500"
        >
          These policies are enforced in addition to per-city service toggles
          and pricing rules.
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
          onClick={handleSave}
        >
          Save policies
        </Button>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          Policies saved successfully!
        </Alert>
      </Snackbar>
    </AdminVerticalPoliciesLayout >
  );
}

function NumberField({ label, value, onChange, step = "1" }) {
  return (
    <Box className="flex flex-col gap-1">
      <Typography
        variant="caption"
        className="text-[11px] text-slate-500"
      >
        {label}
      </Typography>
      <TextField
        size="small"
        fullWidth
        value={value}
        onChange={onChange}
        type="number"
        inputProps={{ step }}
        sx={{
          "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" },
          "& .MuiInputBase-input": { fontSize: 12 },
        }}
      />
    </Box>
  );
}
