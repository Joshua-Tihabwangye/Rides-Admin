import React, { useCallback, useEffect, useState } from "react";
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
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  getAdminPromo,
  patchAdminPromo,
  type AdminPromoResponse,
} from "../services/api/adminApi";

const EV_COLORS = {
  primary: "#03cd8c",
};

function formatDate(value?: number) {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
}

function discountLabel(promo: AdminPromoResponse) {
  if (promo.discountType === "percent") return `${promo.discountValue}% off`;
  return `Flat ${promo.discountValue.toLocaleString("en-UG")} off`;
}

export default function PromoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [promo, setPromo] = useState<AdminPromoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError("No promo ID provided");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getAdminPromo(id);
      setPromo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load promo");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (status: "active" | "inactive") => {
    if (!promo) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await patchAdminPromo(promo.id, { status });
      setPromo(updated);
      setNotice(`Promo ${status === "active" ? "activated" : "paused"} successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update promo status");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !promo) {
    return <Alert severity="error">{error || "Promo not found"}</Alert>;
  }

  const active = promo.status === "active";

  return (
    <Box className="flex flex-col gap-6">
      <Box className="flex items-center gap-4 flex-wrap">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/admin/promos")}
          sx={{ textTransform: "none", color: "text.secondary" }}
        >
          Back to Promotions
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            {promo.description || promo.code}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {promo.id} · {promo.code}
          </Typography>
        </Box>
        <Chip
          label={active ? "Active" : "Inactive"}
          size="small"
          sx={{
            bgcolor: active ? "#03cd8c15" : "#ef444420",
            color: active ? "#059669" : "#dc2626",
            fontWeight: 600,
          }}
        />
      </Box>

      {notice ? <Alert severity="success">{notice}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
            Campaign Summary
          </Typography>
          <Box className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Box>
              <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                Code
              </Typography>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {promo.code}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                Discount
              </Typography>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {discountLabel(promo)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {formatDate(promo.createdAt)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                Updated
              </Typography>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {formatDate(promo.updatedAt)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
            Analytics
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Detailed redemption analytics are not available from the backend for this promo yet.
          </Typography>
        </CardContent>
      </Card>

      <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
            Campaign Actions
          </Typography>
          <Box className="flex gap-2 flex-wrap">
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              disabled={saving}
              onClick={() => void load()}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              size="small"
              color={active ? "warning" : "success"}
              disabled={saving}
              onClick={() => void updateStatus(active ? "inactive" : "active")}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              {active ? "Pause Campaign" : "Activate Campaign"}
            </Button>
            <Button
              variant="contained"
              size="small"
              disabled={saving || !active}
              onClick={() => void updateStatus("inactive")}
              sx={{ textTransform: "none", borderRadius: 2, bgcolor: EV_COLORS.primary, ml: "auto" }}
            >
              End Campaign
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
