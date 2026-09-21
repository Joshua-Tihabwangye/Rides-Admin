import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControlLabel,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import PolicyIcon from "@mui/icons-material/Policy";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import SchoolIcon from "@mui/icons-material/School";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import TourIcon from "@mui/icons-material/Tour";
import {
  createAdminContent,
  listAdminContent,
  patchAdminContent,
  type AdminContentItem,
} from "../services/api/adminApi";

const EV_GREEN = "#03cd8c";
const CONTENT_KIND = "vertical-policies";

type RentalPolicy = {
  allowNonEvException: boolean;
  maxVehicleAgeYears: string;
  minDriverRating: string;
};

type SchoolPolicy = {
  requireBackgroundCheck: boolean;
  minTrainingModules: string;
  maxKidsPerVehicle: string;
};

type EmsPolicy = {
  allowNonEvForAmbulance: boolean;
  responseTimeTargetMin: string;
  requireMedicalPartnerApproval: boolean;
};

type ToursPolicy = {
  minDriverRating: string;
  requireLocalGuide: boolean;
  maxDailyDrivingHours: string;
};

type VerticalPolicies = {
  rental: RentalPolicy;
  school: SchoolPolicy;
  ems: EmsPolicy;
  tours: ToursPolicy;
};

type VerticalPolicyDocument = Record<string, unknown> & {
  title: string;
  status: "published";
  policies: VerticalPolicies;
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info";
};

const DEFAULT_POLICIES: VerticalPolicies = {
  rental: {
    allowNonEvException: false,
    maxVehicleAgeYears: "",
    minDriverRating: "",
  },
  school: {
    requireBackgroundCheck: true,
    minTrainingModules: "",
    maxKidsPerVehicle: "",
  },
  ems: {
    allowNonEvForAmbulance: true,
    responseTimeTargetMin: "",
    requireMedicalPartnerApproval: true,
  },
  tours: {
    minDriverRating: "",
    requireLocalGuide: false,
    maxDailyDrivingHours: "",
  },
};

function textValue(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function boolValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function normalizePolicies(value: unknown): VerticalPolicies {
  const root = recordValue(value);
  const rental = recordValue(root.rental);
  const school = recordValue(root.school);
  const ems = recordValue(root.ems);
  const tours = recordValue(root.tours);

  return {
    rental: {
      allowNonEvException: boolValue(rental.allowNonEvException, DEFAULT_POLICIES.rental.allowNonEvException),
      maxVehicleAgeYears: textValue(rental.maxVehicleAgeYears),
      minDriverRating: textValue(rental.minDriverRating),
    },
    school: {
      requireBackgroundCheck: boolValue(school.requireBackgroundCheck, DEFAULT_POLICIES.school.requireBackgroundCheck),
      minTrainingModules: textValue(school.minTrainingModules),
      maxKidsPerVehicle: textValue(school.maxKidsPerVehicle),
    },
    ems: {
      allowNonEvForAmbulance: boolValue(ems.allowNonEvForAmbulance, DEFAULT_POLICIES.ems.allowNonEvForAmbulance),
      responseTimeTargetMin: textValue(ems.responseTimeTargetMin),
      requireMedicalPartnerApproval: boolValue(ems.requireMedicalPartnerApproval, DEFAULT_POLICIES.ems.requireMedicalPartnerApproval),
    },
    tours: {
      minDriverRating: textValue(tours.minDriverRating),
      requireLocalGuide: boolValue(tours.requireLocalGuide, DEFAULT_POLICIES.tours.requireLocalGuide),
      maxDailyDrivingHours: textValue(tours.maxDailyDrivingHours),
    },
  };
}

function formatUpdatedAt(value?: number) {
  if (!value) return "Not saved yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function enabledCount(policies: VerticalPolicies) {
  return [
    policies.rental.allowNonEvException,
    policies.school.requireBackgroundCheck,
    policies.ems.allowNonEvForAmbulance,
    policies.ems.requireMedicalPartnerApproval,
    policies.tours.requireLocalGuide,
  ].filter(Boolean).length;
}

export default function VerticalPoliciesPage() {
  const [policyRecord, setPolicyRecord] = useState<AdminContentItem<VerticalPolicyDocument> | null>(null);
  const [policies, setPolicies] = useState<VerticalPolicies>(DEFAULT_POLICIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", severity: "info" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listAdminContent<VerticalPolicyDocument>(CONTENT_KIND);
      const latest = rows[0] ?? null;
      setPolicyRecord(latest);
      setPolicies(latest ? normalizePolicies(latest.policies) : DEFAULT_POLICIES);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load vertical policies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updatePolicy = <Section extends keyof VerticalPolicies, Field extends keyof VerticalPolicies[Section]>(
    section: Section,
    field: Field,
    value: VerticalPolicies[Section][Field],
  ) => {
    setPolicies((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const savePolicies = async () => {
    setSaving(true);
    setError(null);
    const payload: VerticalPolicyDocument = {
      title: "Vertical service policies",
      status: "published",
      policies,
    };

    try {
      if (policyRecord) {
        await patchAdminContent<VerticalPolicyDocument>(CONTENT_KIND, policyRecord.id, payload);
      } else {
        await createAdminContent<VerticalPolicyDocument>(CONTENT_KIND, payload);
      }
      await load();
      setSnackbar({ open: true, message: "Vertical policies saved", severity: "success" });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Unable to save vertical policies",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const { rental, school, ems, tours } = policies;
  const metrics = useMemo(() => [
    { label: "Verticals", value: 4, icon: <PolicyIcon />, color: "#2563eb" },
    { label: "Enabled rules", value: enabledCount(policies), icon: <SaveIcon />, color: EV_GREEN },
    { label: "Content records", value: policyRecord ? 1 : 0, icon: <PolicyIcon />, color: "#f59e0b" },
  ], [policies, policyRecord]);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", pb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <PolicyIcon sx={{ color: EV_GREEN }} />
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0 }}>Vertical Service Policies</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Backend-persisted service rules layered on top of core service configuration.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Source: /admin/content/{CONTENT_KIND} · Last updated: {formatUpdatedAt(policyRecord?.updatedAt)}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={() => void load()} disabled={loading || saving} sx={{ borderRadius: 1, textTransform: "none" }}>
            Refresh
          </Button>
          <Button variant="contained" size="small" startIcon={<SaveIcon />} disabled={saving || loading} onClick={() => void savePolicies()} sx={{ borderRadius: 1, textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>
            {saving ? "Saving..." : "Save policies"}
          </Button>
        </Stack>
      </Box>

      {error ? (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void load()}>Retry</Button>} sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {!loading && !policyRecord ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No saved vertical policy record exists yet. Review the defaults below and save to create the authoritative backend record.
        </Alert>
      ) : null}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </Box>

      {loading ? (
        <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)" }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">Loading vertical policies...</Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" }, gap: 2 }}>
          <PolicyCard title="Rental policies" description="Rules for rental operations and partner exceptions." icon={<DirectionsCarIcon />}>
            <PolicySwitch checked={rental.allowNonEvException} onChange={(value) => updatePolicy("rental", "allowNonEvException", value)} label="Allow non-EV exception for specific partners" />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2 }}>
              <NumberField label="Max vehicle age (years)" value={rental.maxVehicleAgeYears} onChange={(value) => updatePolicy("rental", "maxVehicleAgeYears", value)} />
              <NumberField label="Min driver rating" value={rental.minDriverRating} step="0.1" onChange={(value) => updatePolicy("rental", "minDriverRating", value)} />
            </Box>
          </PolicyCard>

          <PolicyCard title="School shuttle policies" description="Safeguards for school transport workflows." icon={<SchoolIcon />}>
            <PolicySwitch checked={school.requireBackgroundCheck} onChange={(value) => updatePolicy("school", "requireBackgroundCheck", value)} label="Require background check for all School drivers" />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2 }}>
              <NumberField label="Min training modules" value={school.minTrainingModules} onChange={(value) => updatePolicy("school", "minTrainingModules", value)} />
              <NumberField label="Max kids per vehicle" value={school.maxKidsPerVehicle} onChange={(value) => updatePolicy("school", "maxKidsPerVehicle", value)} />
            </Box>
          </PolicyCard>

          <PolicyCard title="EMS / Ambulance policies" description="Mission-critical service and partner approval requirements." icon={<MedicalServicesIcon />}>
            <PolicySwitch checked={ems.allowNonEvForAmbulance} onChange={(value) => updatePolicy("ems", "allowNonEvForAmbulance", value)} label="Allow non-EV vehicles for Ambulance category" />
            <PolicySwitch checked={ems.requireMedicalPartnerApproval} onChange={(value) => updatePolicy("ems", "requireMedicalPartnerApproval", value)} label="Require approval from Medical module partners" />
            <NumberField label="Response time target (minutes)" value={ems.responseTimeTargetMin} onChange={(value) => updatePolicy("ems", "responseTimeTargetMin", value)} />
          </PolicyCard>

          <PolicyCard title="Tours & tourism policies" description="Guide, driver threshold, and daily limit controls." icon={<TourIcon />}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2 }}>
              <NumberField label="Min driver rating" value={tours.minDriverRating} step="0.1" onChange={(value) => updatePolicy("tours", "minDriverRating", value)} />
              <NumberField label="Max daily driving hours" value={tours.maxDailyDrivingHours} onChange={(value) => updatePolicy("tours", "maxDailyDrivingHours", value)} />
            </Box>
            <PolicySwitch checked={tours.requireLocalGuide} onChange={(value) => updatePolicy("tours", "requireLocalGuide", value)} label="Require certified local guide for long tours" />
          </PolicyCard>
        </Box>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
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

function PolicyCard({ title, description, icon, children }: { title: string; description: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <Box sx={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 1, bgcolor: `${EV_GREEN}18`, color: EV_GREEN }}>{icon}</Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{title}</Typography>
            <Typography variant="caption" color="text.secondary">{description}</Typography>
          </Box>
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        <Stack spacing={2}>{children}</Stack>
      </CardContent>
    </Card>
  );
}

function PolicySwitch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <FormControlLabel
      control={<Switch size="small" checked={checked} onChange={(event) => onChange(event.target.checked)} />}
      label={<Typography variant="body2" color="text.secondary">{label}</Typography>}
    />
  );
}

function NumberField({ label, value, onChange, step = "1" }: { label: string; value: string; onChange: (value: string) => void; step?: string }) {
  return (
    <TextField
      size="small"
      fullWidth
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      type="number"
      inputProps={{ step }}
    />
  );
}
