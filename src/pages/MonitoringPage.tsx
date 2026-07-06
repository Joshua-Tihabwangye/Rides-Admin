import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import {
  getAdminMonitoringSnapshot,
  type AdminMonitoringSnapshot,
} from "../services/api/adminApi";

const MONITORING_CARDS: {
  key: keyof AdminMonitoringSnapshot;
  label: string;
  subtitle: string;
}[] = [
  { key: "onlineDrivers", label: "Online drivers", subtitle: "Currently online" },
  { key: "staleDrivers", label: "Stale drivers", subtitle: "Heartbeat > 30s ago" },
  { key: "activeRideJobs", label: "Active ride jobs", subtitle: "Matching/assigned rides" },
  { key: "activeDeliveryJobs", label: "Active delivery jobs", subtitle: "Matching/assigned deliveries" },
  { key: "failedDispatches", label: "Failed dispatches", subtitle: "No driver available" },
  { key: "expiredDocumentCount", label: "Expired documents", subtitle: "Driver/vehicle docs" },
  { key: "compliancePendingCount", label: "Compliance pending", subtitle: "Awaiting review" },
];

export default function MonitoringPage() {
  const [snapshot, setSnapshot] = useState<AdminMonitoringSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminMonitoringSnapshot();
      setSnapshot(data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load monitoring snapshot");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 30000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Live Operations Monitoring
        </Typography>
        <Button variant="outlined" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </Box>

      {error ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        {MONITORING_CARDS.map((card) => {
          const value = snapshot?.[card.key];
          const displayValue = typeof value === "number" ? value.toLocaleString() : "—";
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={card.key}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    {card.label}
                  </Typography>
                  <Typography variant="h3" fontWeight={800} sx={{ my: 1 }}>
                    {loading && value === undefined ? <CircularProgress size={28} /> : displayValue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.subtitle}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Alert severity="info" sx={{ mt: 4 }}>
        Backend endpoint: <code>/admin/monitoring/snapshot</code>. Once implemented, metrics will
        populate automatically. Until then, this page shows the dashboard structure with no
        fabricated data.
      </Alert>
    </Box>
  );
}
