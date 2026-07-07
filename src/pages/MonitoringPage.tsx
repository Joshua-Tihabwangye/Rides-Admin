import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  getAdminMonitoringSnapshot,
  listAdminActiveDeliveryJobs,
  listAdminActiveRideJobs,
  listAdminFailedDispatches,
  listAdminOnlineDrivers,
  listAdminStaleDrivers,
  type AdminActiveJob,
  type AdminFailedDispatch,
  type AdminMonitoringSnapshot,
  type AdminOnlineDriver,
  type AdminStaleDriver,
} from "../services/api/adminApi";

type CardDef = {
  key: keyof AdminMonitoringSnapshot;
  label: string;
  subtitle: string;
};

const MONITORING_CARDS: CardDef[] = [
  { key: "onlineDrivers", label: "Online drivers", subtitle: "Currently online" },
  { key: "staleDrivers", label: "Stale drivers", subtitle: "Heartbeat > 30s ago" },
  { key: "activeRideJobs", label: "Active ride jobs", subtitle: "Matching/assigned rides" },
  { key: "activeDeliveryJobs", label: "Active delivery jobs", subtitle: "Matching/assigned deliveries" },
  { key: "failedDispatches", label: "Failed dispatches", subtitle: "No driver available" },
  { key: "expiredDocumentCount", label: "Expired documents", subtitle: "Driver/vehicle docs" },
  { key: "compliancePendingCount", label: "Compliance pending", subtitle: "Awaiting review" },
];

type PanelKey =
  | "onlineDrivers"
  | "staleDrivers"
  | "activeRideJobs"
  | "activeDeliveryJobs"
  | "failedDispatches";

export default function MonitoringPage() {
  const [snapshot, setSnapshot] = useState<AdminMonitoringSnapshot | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);

  const [onlineDrivers, setOnlineDrivers] = useState<AdminOnlineDriver[]>([]);
  const [staleDrivers, setStaleDrivers] = useState<AdminStaleDriver[]>([]);
  const [rideJobs, setRideJobs] = useState<AdminActiveJob[]>([]);
  const [deliveryJobs, setDeliveryJobs] = useState<AdminActiveJob[]>([]);
  const [failedDispatches, setFailedDispatches] = useState<AdminFailedDispatch[]>([]);

  const loadSnapshot = async () => {
    setSnapshotLoading(true);
    setSnapshotError(null);
    try {
      const data = await getAdminMonitoringSnapshot();
      setSnapshot(data);
    } catch (err: any) {
      setSnapshotError(err?.message ?? "Failed to load monitoring snapshot");
    } finally {
      setSnapshotLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshot();
    const interval = window.setInterval(loadSnapshot, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const loadPanel = async (panel: PanelKey) => {
    setPanelLoading(true);
    setPanelError(null);
    try {
      switch (panel) {
        case "onlineDrivers":
          setOnlineDrivers(await listAdminOnlineDrivers());
          break;
        case "staleDrivers":
          setStaleDrivers(await listAdminStaleDrivers());
          break;
        case "activeRideJobs":
          setRideJobs(await listAdminActiveRideJobs());
          break;
        case "activeDeliveryJobs":
          setDeliveryJobs(await listAdminActiveDeliveryJobs());
          break;
        case "failedDispatches":
          setFailedDispatches(await listAdminFailedDispatches());
          break;
      }
    } catch (err: any) {
      setPanelError(err?.message ?? `Failed to load ${panel} details`);
    } finally {
      setPanelLoading(false);
    }
  };

  useEffect(() => {
    if (!activePanel) return;
    void loadPanel(activePanel);
  }, [activePanel]);

  const handleCardClick = (key: CardDef["key"]) => {
    const clickable: PanelKey[] = [
      "onlineDrivers",
      "staleDrivers",
      "activeRideJobs",
      "activeDeliveryJobs",
      "failedDispatches",
    ];
    if (!clickable.includes(key as PanelKey)) return;
    setActivePanel((prev) => (prev === key ? null : (key as PanelKey)));
  };

  const panelTitle = useMemo(() => {
    const card = MONITORING_CARDS.find((c) => c.key === activePanel);
    return card ? card.label : "";
  }, [activePanel]);

  const formatTimestamp = (value?: string) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const formatAge = (seconds: number) => {
    if (seconds <= 0) return "N/A (backend gap)";
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ago`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Live Operations Monitoring
        </Typography>
        <Button variant="outlined" onClick={loadSnapshot} disabled={snapshotLoading} startIcon={<RefreshIcon />}>
          Refresh
        </Button>
      </Box>

      {snapshotError ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {snapshotError}
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        {MONITORING_CARDS.map((card) => {
          const value = snapshot?.[card.key];
          const displayValue = typeof value === "number" ? value.toLocaleString() : "—";
          const clickable = [
            "onlineDrivers",
            "staleDrivers",
            "activeRideJobs",
            "activeDeliveryJobs",
            "failedDispatches",
          ].includes(card.key);
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={card.key}>
              <Card
                variant="outlined"
                onClick={() => handleCardClick(card.key)}
                sx={{
                  height: "100%",
                  cursor: clickable ? "pointer" : "default",
                  transition: "box-shadow 0.2s, border-color 0.2s",
                  borderColor: activePanel === card.key ? "primary.main" : "divider",
                  boxShadow: activePanel === card.key ? (theme) => `0 0 0 1px ${theme.palette.primary.main}` : "none",
                  "&:hover": clickable
                    ? {
                        boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.light}`,
                      }
                    : {},
                }}
              >
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    {card.label}
                  </Typography>
                  <Typography variant="h3" fontWeight={800} sx={{ my: 1 }}>
                    {snapshotLoading && value === undefined ? <CircularProgress size={28} /> : displayValue}
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

      {activePanel && (
        <Box sx={{ mt: 4 }}>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid",
                borderColor: "divider",
                bgcolor: "action.hover",
              }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                {panelTitle} details
              </Typography>
              <IconButton size="small" onClick={() => setActivePanel(null)} aria-label="close">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ p: 2 }}>
              {panelError ? (
                <Alert severity="error">{panelError}</Alert>
              ) : panelLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <DetailPanel
                  activePanel={activePanel}
                  onlineDrivers={onlineDrivers}
                  staleDrivers={staleDrivers}
                  rideJobs={rideJobs}
                  deliveryJobs={deliveryJobs}
                  failedDispatches={failedDispatches}
                  formatTimestamp={formatTimestamp}
                  formatAge={formatAge}
                />
              )}
            </Box>
          </Paper>
        </Box>
      )}

      <Alert severity="info" sx={{ mt: 4 }}>
        Backend endpoint: <code>/admin/monitoring/snapshot</code>. Once implemented, metrics will
        populate automatically. Detail lists use the closest available backend endpoints until
        dedicated monitoring detail endpoints are exposed.
      </Alert>
    </Box>
  );
}

function DetailPanel({
  activePanel,
  onlineDrivers,
  staleDrivers,
  rideJobs,
  deliveryJobs,
  failedDispatches,
  formatTimestamp,
  formatAge,
}: {
  activePanel: PanelKey;
  onlineDrivers: AdminOnlineDriver[];
  staleDrivers: AdminStaleDriver[];
  rideJobs: AdminActiveJob[];
  deliveryJobs: AdminActiveJob[];
  failedDispatches: AdminFailedDispatch[];
  formatTimestamp: (value?: string) => string;
  formatAge: (seconds: number) => string;
}) {
  if (activePanel === "onlineDrivers") {
    return (
      <SimpleTable
        columns={["Name", "Phone", "City", "Vehicle", "Status"]}
        rows={onlineDrivers.map((d) => [d.fullName, d.phone, d.city, d.vehicleType, d.status])}
        empty="No online drivers returned from the backend."
      />
    );
  }

  if (activePanel === "staleDrivers") {
    return (
      <SimpleTable
        columns={["Name", "Phone", "City", "Last heartbeat age", "Status"]}
        rows={staleDrivers.map((d) => [
          d.fullName,
          d.phone,
          d.city,
          d.lastHeartbeatAt ? formatTimestamp(d.lastHeartbeatAt) : formatAge(d.secondsSinceHeartbeat),
          d.status,
        ])}
        empty="No stale drivers returned from the backend."
      />
    );
  }

  if (activePanel === "activeRideJobs") {
    return (
      <JobTable
        jobs={rideJobs}
        empty="No active ride jobs returned from the backend."
        formatTimestamp={formatTimestamp}
      />
    );
  }

  if (activePanel === "activeDeliveryJobs") {
    return (
      <JobTable
        jobs={deliveryJobs}
        empty="No active delivery jobs returned from the backend."
        formatTimestamp={formatTimestamp}
      />
    );
  }

  if (activePanel === "failedDispatches") {
    return (
      <FailedDispatchTable
        dispatches={failedDispatches}
        empty="No failed dispatches returned from the backend."
        formatTimestamp={formatTimestamp}
      />
    );
  }

  return null;
}

function SimpleTable({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: React.ReactNode[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        {empty}
      </Alert>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: "action.hover" }}>
            {columns.map((c) => (
              <TableCell key={c}>{c}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {row.map((cell, j) => (
                <TableCell key={j}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function JobTable({
  jobs,
  empty,
  formatTimestamp,
}: {
  jobs: AdminActiveJob[];
  empty: string;
  formatTimestamp: (value?: string) => string;
}) {
  if (jobs.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        {empty}
      </Alert>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: "action.hover" }}>
            <TableCell>ID</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Pickup</TableCell>
            <TableCell>Dropoff</TableCell>
            <TableCell>Created</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{job.id}</TableCell>
              <TableCell>
                <Chip label={job.status} size="small" color="primary" variant="outlined" />
              </TableCell>
              <TableCell>{job.pickupAddress || "—"}</TableCell>
              <TableCell>{job.dropoffAddress || "—"}</TableCell>
              <TableCell>{formatTimestamp(job.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function FailedDispatchTable({
  dispatches,
  empty,
  formatTimestamp,
}: {
  dispatches: AdminFailedDispatch[];
  empty: string;
  formatTimestamp: (value?: string) => string;
}) {
  if (dispatches.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        {empty}
      </Alert>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: "action.hover" }}>
            <TableCell>ID</TableCell>
            <TableCell>Service</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell>Pickup</TableCell>
            <TableCell>Dropoff</TableCell>
            <TableCell>Created</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {dispatches.map((dispatch) => (
            <TableRow key={dispatch.id}>
              <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{dispatch.id}</TableCell>
              <TableCell>
                <Chip
                  label={dispatch.serviceType}
                  size="small"
                  color={dispatch.serviceType === "ride" ? "primary" : "secondary"}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>{dispatch.reason || "—"}</TableCell>
              <TableCell>{dispatch.pickupAddress || "—"}</TableCell>
              <TableCell>{dispatch.dropoffAddress || "—"}</TableCell>
              <TableCell>{formatTimestamp(dispatch.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
