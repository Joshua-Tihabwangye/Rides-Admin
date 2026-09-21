import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DescriptionIcon from "@mui/icons-material/Description";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate } from "react-router-dom";
import {
  getAdminMonitoringSnapshot,
  listAdminMonitoringDrivers,
  listAdminMonitoringFailedDispatches,
  listAdminMonitoringJobs,
} from "../services/api/adminApi";
import type {
  AdminMonitoringDriver,
  AdminMonitoringFailedDispatch,
  AdminMonitoringJob,
  AdminMonitoringSnapshot,
} from "../services/api/adminApi";

const EV_GREEN = "#03cd8c";
const EV_ORANGE = "#f77f00";
type MonitorView = "online" | "offline" | "rides" | "deliveries" | "failed" | "compliance";

function formatTimestamp(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" });
}

function formatAge(seconds?: number) {
  if (seconds == null) return "-";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function shortId(value?: string) {
  return value ? value.slice(0, 8) : "-";
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 4, color: "text.secondary" }}>
        {text}
      </TableCell>
    </TableRow>
  );
}

export default function MonitoringPage() {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<AdminMonitoringSnapshot | null>(null);
  const [drivers, setDrivers] = useState<AdminMonitoringDriver[]>([]);
  const [rideJobs, setRideJobs] = useState<AdminMonitoringJob[]>([]);
  const [deliveryJobs, setDeliveryJobs] = useState<AdminMonitoringJob[]>([]);
  const [failedDispatches, setFailedDispatches] = useState<AdminMonitoringFailedDispatch[]>([]);
  const [selectedView, setSelectedView] = useState<MonitorView>("offline");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    setError(null);
    try {
      const [snapshotData, driverData, rideJobData, deliveryJobData, failedData] = await Promise.all([
        getAdminMonitoringSnapshot(),
        listAdminMonitoringDrivers(),
        listAdminMonitoringJobs("ride"),
        listAdminMonitoringJobs("delivery"),
        listAdminMonitoringFailedDispatches(),
      ]);
      setSnapshot(snapshotData);
      setDrivers(driverData ?? []);
      setRideJobs(rideJobData ?? []);
      setDeliveryJobs(deliveryJobData ?? []);
      setFailedDispatches(failedData ?? []);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err?.message ?? "Failed to load monitoring data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(interval);
  }, [load]);

  const onlineDrivers = useMemo(() => drivers.filter((driver) => driver.online), [drivers]);
  const offlineDrivers = useMemo(() => drivers.filter((driver) => !driver.online), [drivers]);
  const problemCount = (snapshot?.failedDispatches ?? 0) + (snapshot?.offlineDrivers ?? offlineDrivers.length) + (snapshot?.expiredDocumentCount ?? 0);

  const cards = [
    {
      key: "online" as const,
      label: "Online drivers",
      value: snapshot?.onlineDrivers ?? onlineDrivers.length,
      helper: "Heartbeat received within 15s",
      icon: <CheckCircleIcon fontSize="small" />,
      accent: EV_GREEN,
    },
    {
      key: "offline" as const,
      label: "Offline drivers",
      value: snapshot?.offlineDrivers ?? offlineDrivers.length,
      helper: "No fresh heartbeat inside 15s",
      icon: <ErrorOutlineIcon fontSize="small" />,
      accent: EV_ORANGE,
    },
    {
      key: "rides" as const,
      label: "Active ride jobs",
      value: snapshot?.activeRideJobs ?? rideJobs.length,
      helper: "Assigned ride dispatch jobs",
      icon: <DirectionsCarIcon fontSize="small" />,
      accent: "#2563eb",
    },
    {
      key: "deliveries" as const,
      label: "Active delivery jobs",
      value: snapshot?.activeDeliveryJobs ?? deliveryJobs.length,
      helper: "Assigned delivery dispatch jobs",
      icon: <LocalShippingIcon fontSize="small" />,
      accent: "#7c3aed",
    },
    {
      key: "failed" as const,
      label: "Failed dispatches",
      value: snapshot?.failedDispatches ?? failedDispatches.length,
      helper: "Exhausted matching jobs",
      icon: <ErrorOutlineIcon fontSize="small" />,
      accent: "#dc2626",
    },
    {
      key: "compliance" as const,
      label: "Compliance queue",
      value: snapshot?.compliancePendingCount ?? 0,
      helper: `${snapshot?.expiredDocumentCount ?? 0} expired documents`,
      icon: <DescriptionIcon fontSize="small" />,
      accent: "#64748b",
    },
  ];

  if (loading && !snapshot) {
    return (
      <Box sx={{ minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} size="small" sx={{ textTransform: "none" }}>
          Back
        </Button>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h5" fontWeight={800}>Live Operations Monitoring</Typography>
            <Chip size="small" label={problemCount > 0 ? `${problemCount} needs attention` : "Healthy"} color={problemCount > 0 ? "warning" : "success"} variant="outlined" />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Driver heartbeat is expected every 10 seconds and treated as offline after 15 seconds.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {lastUpdated ? <Typography variant="caption" color="text.secondary">Updated {lastUpdated.toLocaleTimeString()}</Typography> : null}
          <Button variant="outlined" size="small" startIcon={refreshing ? <CircularProgress size={14} /> : <RefreshIcon />} onClick={() => void load(true)} disabled={refreshing} sx={{ textTransform: "none", borderRadius: 2 }}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} lg={4} xl={2} key={card.key}>
            <Card
              variant="outlined"
              onClick={() => setSelectedView(card.key)}
              sx={{
                height: "100%",
                borderRadius: 2,
                cursor: "pointer",
                borderColor: selectedView === card.key ? card.accent : "divider",
                bgcolor: selectedView === card.key ? `${card.accent}0f` : "background.paper",
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>{card.label}</Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>{Number(card.value ?? 0).toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", color: card.accent, bgcolor: `${card.accent}18`, p: 1, borderRadius: 2 }}>{card.icon}</Box>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{card.helper}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
          {selectedView === "online" || selectedView === "offline" ? (
            <DriverTable title={selectedView === "online" ? "Online drivers" : "Offline drivers"} drivers={selectedView === "online" ? onlineDrivers : offlineDrivers} />
          ) : selectedView === "rides" ? (
            <JobTable title="Active ride jobs" jobs={rideJobs} />
          ) : selectedView === "deliveries" ? (
            <JobTable title="Active delivery jobs" jobs={deliveryJobs} />
          ) : selectedView === "failed" ? (
            <FailedDispatchTable rows={failedDispatches} />
          ) : (
            <Box>
              <Typography variant="h6" fontWeight={800}>Compliance queue</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Document review and expiration work requiring admin action.</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Chip label={`${snapshot?.compliancePendingCount ?? 0} pending review`} />
                <Chip label={`${snapshot?.expiredDocumentCount ?? 0} expired documents`} color={(snapshot?.expiredDocumentCount ?? 0) ? "warning" : "success"} variant="outlined" />
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function DriverTable({ title, drivers }: { title: string; drivers: AdminMonitoringDriver[] }) {
  return (
    <Box>
      <Typography variant="h6" fontWeight={800}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Online means the last heartbeat is within the 15 second grace window.</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Driver</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Heartbeat age</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drivers.slice(0, 50).map((driver) => (
              <TableRow key={driver.driverId} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={700}>{driver.name || shortId(driver.driverId)}</Typography>
                  <Typography variant="caption" color="text.secondary">{driver.phone || shortId(driver.driverId)}</Typography>
                </TableCell>
                <TableCell>{driver.vehicleType || "-"}</TableCell>
                <TableCell><Chip size="small" label={driver.online ? "Online" : "Offline"} color={driver.online ? "success" : "default"} variant="outlined" /></TableCell>
                <TableCell>{formatAge(driver.secondsSinceHeartbeat)}</TableCell>
              </TableRow>
            ))}
            {drivers.length === 0 ? <EmptyRow colSpan={4} text={`No ${title.toLowerCase()} returned by the monitoring endpoint.`} /> : null}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function JobTable({ title, jobs }: { title: string; jobs: AdminMonitoringJob[] }) {
  return (
    <Box>
      <Typography variant="h6" fontWeight={800}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Assigned dispatch work currently being handled.</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Job</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell>Pickup</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.slice(0, 50).map((job) => (
              <TableRow key={job.id} hover>
                <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{shortId(job.id)}</TableCell>
                <TableCell><Chip size="small" label={job.serviceType} color={String(job.serviceType).toUpperCase() === "RIDE" ? "primary" : "secondary"} variant="outlined" /></TableCell>
                <TableCell>{job.driverName || shortId(job.assignedDriverId)}</TableCell>
                <TableCell>{job.pickupAddress || "-"}</TableCell>
                <TableCell>{formatTimestamp(job.createdAt)}</TableCell>
              </TableRow>
            ))}
            {jobs.length === 0 ? <EmptyRow colSpan={5} text="No active dispatch jobs for this category." /> : null}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function FailedDispatchTable({ rows }: { rows: AdminMonitoringFailedDispatch[] }) {
  return (
    <Box>
      <Typography variant="h6" fontWeight={800}>Failed dispatch queue</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Recent exhausted matching jobs that need operational follow-up.</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Pickup</TableCell>
              <TableCell>Dropoff</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(0, 50).map((dispatch) => (
              <TableRow key={dispatch.id} hover>
                <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{shortId(dispatch.id)}</TableCell>
                <TableCell>{dispatch.serviceType}</TableCell>
                <TableCell>{dispatch.reason || "-"}</TableCell>
                <TableCell>{dispatch.pickupAddress || "-"}</TableCell>
                <TableCell>{dispatch.dropoffAddress || "-"}</TableCell>
                <TableCell>{formatTimestamp(dispatch.createdAt)}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? <EmptyRow colSpan={6} text="No failed dispatches are currently in the queue." /> : null}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
