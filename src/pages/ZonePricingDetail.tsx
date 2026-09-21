import React, { type ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalculateIcon from "@mui/icons-material/Calculate";
import SaveIcon from "@mui/icons-material/Save";
import { getAdminPricingZone, patchAdminPricingZone } from "../services/api/adminApi";
import type { AdminPricingZoneResponse, AdminUpdatePricingZoneInput } from "../services/api/adminApi";

const EV_COLORS = {
  primary: "#03cd8c",
};

type PricingState = {
  baseFare: string;
  perKm: string;
  perMin: string;
  minFare: string;
  surgeMultiplier: string;
};

type PricingField = keyof PricingState;

type ToastState = {
  open: boolean;
  severity: "success" | "error";
  message: string;
};

const pricingFields: { key: PricingField; label: string }[] = [
  { key: "baseFare", label: "Base Fare (UGX)" },
  { key: "perKm", label: "Per KM (UGX)" },
  { key: "perMin", label: "Per Minute (UGX)" },
  { key: "minFare", label: "Minimum Fare (UGX)" },
  { key: "surgeMultiplier", label: "Surge Multiplier (1.0 = None)" },
];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function ZonePricingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [toast, setToast] = useState<ToastState>({ open: false, severity: "success", message: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [pricing, setPricing] = useState<PricingState>({
    baseFare: "5000",
    perKm: "2000",
    perMin: "200",
    minFare: "7000",
    surgeMultiplier: "1.0",
  });

  const [zone, setZone] = useState<AdminPricingZoneResponse | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadZone = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminPricingZone(id as string);
        setZone(data);
        if (data.pricingRules && !Array.isArray(data.pricingRules)) {
          const rules = data.pricingRules;
          setPricing({
            baseFare: String(rules.baseFare ?? "5000"),
            perKm: String(rules.perKm ?? "2000"),
            perMin: String(rules.perMin ?? "200"),
            minFare: String(rules.minFare ?? "7000"),
            surgeMultiplier: String(rules.surgeMultiplier ?? "1.0"),
          });
        }
      } catch (loadError) {
        setError(getErrorMessage(loadError, "Failed to load zone"));
      } finally {
        setLoading(false);
      }
    };
    loadZone();
  }, [id]);

  const handleChange = (field: PricingField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPricing((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const update: AdminUpdatePricingZoneInput = {
        pricingRules: {
          baseFare: getNumber(pricing.baseFare),
          perKm: getNumber(pricing.perKm),
          perMin: getNumber(pricing.perMin),
          minFare: getNumber(pricing.minFare),
          surgeMultiplier: getNumber(pricing.surgeMultiplier, 1),
        },
      };
      const updated = await patchAdminPricingZone(id, update);
      setZone(updated);
      setToast({ open: true, severity: "success", message: "Pricing rule saved successfully." });
    } catch (saveError) {
      setToast({
        open: true,
        severity: "error",
        message: getErrorMessage(saveError, "Failed to save pricing rule"),
      });
    } finally {
      setSaving(false);
    }
  };

  const exampleFare = useMemo(() => {
    const distance = 5;
    const duration = 15;
    const base = getNumber(pricing.baseFare);
    const perKm = getNumber(pricing.perKm);
    const perMin = getNumber(pricing.perMin);
    const minFare = getNumber(pricing.minFare);
    const surge = getNumber(pricing.surgeMultiplier, 1);
    const calculated = (base + distance * perKm + duration * perMin) * surge;
    return Math.max(calculated, minFare);
  }, [pricing]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !zone) {
    return <Alert severity="error">{error || 'Zone not found'}</Alert>;
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 2, md: 4 } }}>
      <Box className="flex items-center justify-between mb-4">
        <Box className="flex items-center gap-2">
          <Button
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/pricing/zones')}
            sx={{ color: 'text.secondary', textTransform: 'none' }}
          >
            Back
          </Button>
          <Typography variant="h6" className="font-semibold">
            Pricing Details: {zone.name}
          </Typography>
        </Box>
        <Box className="flex gap-2">
          <ChipLikePreview fare={exampleFare} />
          <Button
            size="small"
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => void handleSave()}
            disabled={saving}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              bgcolor: EV_COLORS.primary,
              '&:hover': { bgcolor: '#0fb589' }
            }}
          >
            {saving ? 'Saving...' : 'Save Rule'}
          </Button>
        </Box>
      </Box>

      <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
        <CardContent className="p-6">
          <Typography variant="subtitle1" className="font-semibold mb-4">
            Tariff Configuration
          </Typography>
          <Grid container spacing={3}>
            {pricingFields.map((field) => (
              <Grid key={field.key} item xs={12} sm={4}>
                <TextField
                  label={field.label}
                  type="number"
                  fullWidth
                  size="small"
                  value={pricing[field.key]}
                  onChange={handleChange(field.key)}
                />
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 4 }} />

          {/* Pricing Rule Display */}
          <Card elevation={0} sx={{ bgcolor: 'background.default', p: 3, mb: 3 }}>
            <Typography variant="subtitle2" className="font-semibold mb-2">
              Pricing Rule Formula
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, fontFamily: 'monospace' }}>
              Fare = (Base Fare + (Distance × Per KM) + (Duration × Per Minute)) × Surge Multiplier
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, fontFamily: 'monospace' }}>
              Final Fare = MAX(Calculated Fare, Minimum Fare)
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" className="font-semibold mb-2">
              Example Calculation
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Trip: 5 km, 15 minutes
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}>
              = ({pricing.baseFare} + (5 × {pricing.perKm}) + (15 × {pricing.perMin})) × {pricing.surgeMultiplier}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600, mt: 1 }}>
              = {exampleFare.toLocaleString()} UGX
            </Typography>
          </Card>

          <Typography variant="caption" color="text.secondary">
            These changes will apply immediately to all new trips created in this zone.
          </Typography>
        </CardContent>
      </Card>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((current) => ({ ...current, open: false }))}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function ChipLikePreview({ fare }: { fare: number }) {
  return (
    <Button
      size="small"
      variant="outlined"
      startIcon={<CalculateIcon />}
      disabled
      sx={{
        borderRadius: 2,
        color: "text.primary",
        textTransform: "none",
        "&.Mui-disabled": {
          borderColor: "rgba(3,205,140,0.35)",
          color: "text.primary",
        },
      }}
    >
      5 km preview: {fare.toLocaleString()} UGX
    </Button>
  );
}
