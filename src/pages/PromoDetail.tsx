// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Card, CardContent, Typography, Button, Chip, Divider, CircularProgress, Alert } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getAdminPromo } from "../services/api/adminApi";

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
  blue: "#3b82f6",
  red: "#ef4444",
};

export default function PromoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [promo, setPromo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("No promo ID provided");
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminPromo(id);
        setPromo(data);
      } catch (err) {
        setError(err?.message || "Failed to load promo");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

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

  const status = promo.status === "active" ? "Active" : "Inactive";
  const discountLabel =
    promo.discountType === "percent"
      ? `${promo.discountValue}% off`
      : promo.discountType === "flat"
      ? `Flat ${promo.discountValue} off`
      : `${promo.discountValue}`;

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
          label={status}
          size="small"
          sx={{
            bgcolor: status === "Active" ? "#03cd8c15" : "#ef444420",
            color: status === "Active" ? "#059669" : "#dc2626",
            fontWeight: 600,
          }}
        />
      </Box>

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
                {discountLabel}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {promo.createdAt ? new Date(promo.createdAt).toLocaleDateString() : "N/A"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                Updated
              </Typography>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {promo.updatedAt ? new Date(promo.updatedAt).toLocaleDateString() : "N/A"}
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
            Detailed redemption analytics are not available from the backend for this promo. Once the backend exposes
            promo analytics, they will be displayed here.
          </Typography>
        </CardContent>
      </Card>

      <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
            Campaign Actions
          </Typography>
          <Box className="flex gap-2 flex-wrap">
            <Button variant="outlined" size="small" sx={{ textTransform: "none", borderRadius: 2 }}>
              Edit Campaign
            </Button>
            <Button variant="outlined" size="small" color="warning" sx={{ textTransform: "none", borderRadius: 2 }}>
              Pause Campaign
            </Button>
            <Button variant="outlined" size="small" color="error" sx={{ textTransform: "none", borderRadius: 2 }}>
              End Campaign
            </Button>
            <Button
              variant="contained"
              size="small"
              sx={{ textTransform: "none", borderRadius: 2, bgcolor: EV_COLORS.primary, ml: "auto" }}
            >
              Duplicate Campaign
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
