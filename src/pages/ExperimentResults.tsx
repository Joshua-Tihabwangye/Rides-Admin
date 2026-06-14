// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { listAdminFeatureFlags, type AdminFeatureFlagResponse } from "../services/api/adminApi";

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

export default function ExperimentResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flags, setFlags] = useState<AdminFeatureFlagResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listAdminFeatureFlags();
        if (cancelled) return;
        setFlags(data);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message ?? "Failed to load feature flags");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedFlag = useMemo(() => {
    if (flags.length === 0) return null;
    const numeric = Number(id);
    if (Number.isFinite(numeric) && numeric > 0) {
      return flags[(numeric - 1) % flags.length];
    }
    return flags[0];
  }, [flags, id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!selectedFlag) {
    return <Alert severity="info">No feature flags returned by the backend.</Alert>;
  }

  return (
    <Box className="p-4 sm:p-6 flex flex-col gap-6">
      <Box className="flex items-center gap-4">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/admin/system/flags")}
          sx={{ textTransform: "none", color: "text.secondary" }}
        >
          Back to Flags
        </Button>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Feature Flag: {selectedFlag.description || selectedFlag.key}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Key: {selectedFlag.key} · Scope: {selectedFlag.scope}
          </Typography>
        </Box>
        <Chip
          label={selectedFlag.enabled ? "Enabled" : "Disabled"}
          size="small"
          color={selectedFlag.enabled ? "success" : "default"}
          sx={{ ml: "auto" }}
        />
      </Box>

      <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
            Live flag details
          </Typography>
          <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DetailItem label="Flag ID" value={selectedFlag.id} />
            <DetailItem label="Scope" value={selectedFlag.scope} />
            <DetailItem label="State" value={selectedFlag.enabled ? "Enabled" : "Disabled"} />
            <DetailItem label="Updated" value={selectedFlag.updatedAt ? new Date(selectedFlag.updatedAt).toLocaleString() : "n/a"} />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            Experiment metrics and A/B variant series are not exposed by the backend yet. This page now shows the live flag record instead of demo data.
          </Typography>
        </CardContent>
      </Card>

      <Alert severity="warning">
        Backend experiment analytics are still pending. Use the flags list and audit log for operational review until metrics are added.
      </Alert>

      <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
            Related actions
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button variant="outlined" onClick={() => navigate("/admin/system/flags")} sx={{ textTransform: "none" }}>
              Open flag inventory
            </Button>
            <Button variant="outlined" onClick={() => navigate("/admin/system/audit-log")} sx={{ textTransform: "none" }}>
              View audit log
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} color="text.primary">
        {value}
      </Typography>
    </Box>
  );
}
