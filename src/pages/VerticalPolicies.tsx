import React, { useCallback, useEffect, useState } from "react";
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
import {
  createAdminContent,
  listAdminContent,
  patchAdminContent,
  type AdminContentItem,
} from "../services/api/adminApi";

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

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

function AdminVerticalPoliciesLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Vertical Service Policies
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Additional backend-persisted rules applied on top of core service configuration.
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
      requireMedicalPartnerApproval: boolValue(
        ems.requireMedicalPartnerApproval,
        DEFAULT_POLICIES.ems.requireMedicalPartnerApproval,
      ),
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

  return (
    <AdminVerticalPoliciesLayout>
      <Box className="flex items-center justify-between gap-2">
        <Typography variant="caption" color="text.secondary">
          Source: `/admin/content/{CONTENT_KIND}` · Last updated: {formatUpdatedAt(policyRecord?.updatedAt)}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => void load()}
          disabled={loading || saving}
          sx={{ textTransform: "none", borderRadius: 999, fontSize: 11 }}
        >
          Refresh
        </Button>
      </Box>

      {error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void load()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      {!loading && !policyRecord ? (
        <Alert severity="info">
          No saved vertical policy record exists yet. Review the defaults below and save to create the authoritative backend record.
        </Alert>
      ) : null}

      {loading ? (
        <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Loading vertical policies...
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <>
          <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PolicyCard
              title="Rental policies"
              description="Rules applied on top of Ride & Rental services."
            >
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={rental.allowNonEvException}
                    onChange={(event) => updatePolicy("rental", "allowNonEvException", event.target.checked)}
                  />
                }
                label={<PolicyLabel>Allow non-EV exception for specific partners</PolicyLabel>}
              />
              <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <NumberField
                  label="Max vehicle age (years)"
                  value={rental.maxVehicleAgeYears}
                  onChange={(value) => updatePolicy("rental", "maxVehicleAgeYears", value)}
                />
                <NumberField
                  label="Min driver rating"
                  value={rental.minDriverRating}
                  step="0.1"
                  onChange={(value) => updatePolicy("rental", "minDriverRating", value)}
                />
              </Box>
            </PolicyCard>

            <PolicyCard
              title="School shuttle policies"
              description="Extra safeguards for School shuttles: vetting, training and capacity constraints."
            >
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={school.requireBackgroundCheck}
                    onChange={(event) => updatePolicy("school", "requireBackgroundCheck", event.target.checked)}
                  />
                }
                label={<PolicyLabel>Require background check for all School drivers</PolicyLabel>}
              />
              <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <NumberField
                  label="Min training modules"
                  value={school.minTrainingModules}
                  onChange={(value) => updatePolicy("school", "minTrainingModules", value)}
                />
                <NumberField
                  label="Max kids per vehicle"
                  value={school.maxKidsPerVehicle}
                  onChange={(value) => updatePolicy("school", "maxKidsPerVehicle", value)}
                />
              </Box>
            </PolicyCard>

            <PolicyCard
              title="EMS / Ambulance policies"
              description="Mission-critical service rules and partner approval requirements."
            >
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={ems.allowNonEvForAmbulance}
                    onChange={(event) => updatePolicy("ems", "allowNonEvForAmbulance", event.target.checked)}
                  />
                }
                label={<PolicyLabel>Allow non-EV vehicles for Ambulance category</PolicyLabel>}
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={ems.requireMedicalPartnerApproval}
                    onChange={(event) => updatePolicy("ems", "requireMedicalPartnerApproval", event.target.checked)}
                  />
                }
                label={<PolicyLabel>Require approval from Medical module partners</PolicyLabel>}
              />
              <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <NumberField
                  label="Response time target (minutes)"
                  value={ems.responseTimeTargetMin}
                  onChange={(value) => updatePolicy("ems", "responseTimeTargetMin", value)}
                />
              </Box>
            </PolicyCard>

            <PolicyCard
              title="Tours & tourism policies"
              description="Expectations for tour operators, guides, driver thresholds and daily limits."
            >
              <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <NumberField
                  label="Min driver rating"
                  value={tours.minDriverRating}
                  step="0.1"
                  onChange={(value) => updatePolicy("tours", "minDriverRating", value)}
                />
                <NumberField
                  label="Max daily driving hours"
                  value={tours.maxDailyDrivingHours}
                  onChange={(value) => updatePolicy("tours", "maxDailyDrivingHours", value)}
                />
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={tours.requireLocalGuide}
                    onChange={(event) => updatePolicy("tours", "requireLocalGuide", event.target.checked)}
                  />
                }
                label={<PolicyLabel>Require certified local guide for long tours</PolicyLabel>}
              />
            </PolicyCard>
          </Box>

          <Box className="mt-2 flex items-center justify-between gap-3">
            <Typography variant="caption" className="text-[11px] text-slate-500">
              Saved policies are stored as Admin content and should be enforced by the relevant backend domain services.
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<SaveIcon />}
              disabled={saving}
              sx={{
                textTransform: "none",
                borderRadius: 999,
                fontSize: 12,
                bgcolor: EV_COLORS.primary,
                "&:hover": { bgcolor: "#0fb589" },
              }}
              onClick={() => void savePolicies()}
            >
              {saving ? "Saving..." : "Save policies"}
            </Button>
          </Box>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminVerticalPoliciesLayout>
  );
}

function PolicyCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
      <CardContent className="p-4 flex flex-col gap-2">
        <Typography variant="subtitle2" className="font-semibold">
          {title}
        </Typography>
        <Typography variant="caption" className="text-[11px] text-slate-500">
          {description}
        </Typography>
        <Divider className="!my-1" />
        {children}
      </CardContent>
    </Card>
  );
}

function PolicyLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="body2" className="text-[12px] text-slate-500">
      {children}
    </Typography>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: string;
}) {
  return (
    <Box className="flex flex-col gap-1">
      <Typography variant="caption" className="text-[11px] text-slate-500">
        {label}
      </Typography>
      <TextField
        size="small"
        fullWidth
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type="number"
        inputProps={{ step }}
        sx={{ "& .MuiInputBase-input": { fontSize: 12 } }}
      />
    </Box>
  );
}
