import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReplayIcon from "@mui/icons-material/Replay";
import {
  getAdminMatchingJobDetail,
  listAdminMatchingJobs,
  retryAdminMatchingJob,
  type AdminMatchingJob,
  type AdminMatchingJobDetail,
} from "../services/api/adminApi";

export default function MatchingInspectionPage() {
  const [jobs, setJobs] = useState<AdminMatchingJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminMatchingJobDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const loadJobs = async () => {
    setJobsLoading(true);
    setJobsError(null);
    try {
      const result = await listAdminMatchingJobs(undefined, 50);
      setJobs(result.items || []);
    } catch (err: any) {
      setJobsError(err?.message ?? "Failed to load matching jobs");
    } finally {
      setJobsLoading(false);
    }
  };

  const loadDetail = async (jobId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      setDetail(await getAdminMatchingJobDetail(jobId));
    } catch (err: any) {
      setDetailError(err?.message ?? "Failed to load job detail");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    void loadJobs();
    const interval = window.setInterval(loadJobs, 15000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedJobId) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedJobId);
  }, [selectedJobId]);

  const handleRetry = async () => {
    if (!selectedJobId) return;
    setRetrying(true);
    try {
      await retryAdminMatchingJob(selectedJobId);
      await loadDetail(selectedJobId);
      await loadJobs();
    } catch (err: any) {
      setDetailError(err?.message ?? "Retry failed");
    } finally {
      setRetrying(false);
    }
  };

  const formatTime = (value?: string) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const statusColor = (status: string): "default" | "primary" | "success" | "error" | "warning" => {
    switch (status) {
      case "assigned":
        return "success";
      case "exhausted":
      case "cancelled":
        return "error";
      case "dispatching":
        return "primary";
      case "waiting":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Matching Inspection
        </Typography>
        <Button variant="outlined" onClick={loadJobs} disabled={jobsLoading} startIcon={<RefreshIcon />}>
          Refresh
        </Button>
      </Box>

      {jobsError ? <Alert severity="warning" sx={{ mb: 3 }}>{jobsError}</Alert> : null}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ height: "calc(100vh - 220px)", overflow: "auto" }}>
            {jobsLoading && !jobs.length ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <List disablePadding>
                {jobs.map((job) => (
                  <ListItem
                    key={job.id}
                    button
                    selected={selectedJobId === job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    divider
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Chip label={job.serviceType} size="small" color="primary" variant="outlined" />
                          <Chip label={job.status} size="small" color={statusColor(job.status)} />
                        </Box>
                      }
                      secondary={`Round ${job.dispatchRound} · ${job.currentRadiusMeters}m · ${formatTime(job.createdAt)}`}
                    />
                  </ListItem>
                ))}
                {!jobs.length && !jobsLoading ? (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography color="text.secondary">No matching jobs found.</Typography>
                  </Box>
                ) : null}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          {!selectedJobId ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">Select a job to inspect matching details.</Typography>
            </Paper>
          ) : detailLoading && !detail ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <CircularProgress size={32} />
            </Box>
          ) : detailError ? (
            <Alert severity="error">{detailError}</Alert>
          ) : detail ? (
            <Box>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="h6" fontWeight={700}>
                      Job {detail.job.id}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={retrying || detail.job.status === "assigned"}
                      onClick={handleRetry}
                      startIcon={<ReplayIcon />}
                    >
                      {retrying ? "Retrying…" : "Retry Match"}
                    </Button>
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                    <Chip label={detail.job.serviceType} color="primary" variant="outlined" />
                    <Chip label={detail.job.status} color={statusColor(detail.job.status)} />
                    {detail.failureReason ? (
                      <Chip label={`Failure: ${detail.failureReason}`} color="error" />
                    ) : null}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Service ID: {detail.job.serviceId} · Round {detail.job.dispatchRound} · Radius {detail.job.currentRadiusMeters}m
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Expires: {formatTime(detail.job.expiresAt)} · Updated: {formatTime(detail.job.updatedAt)}
                  </Typography>
                </CardContent>
              </Card>

              {detail.dispatchSnapshot ? (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          NEARBY DRIVERS
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                          {detail.dispatchSnapshot.nearbyDrivers.length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          ELIGIBLE DRIVERS
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                          {detail.dispatchSnapshot.eligibleDrivers.length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          REJECTED DRIVERS
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                          {detail.dispatchSnapshot.rejectedDrivers.length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          RANKED DRIVERS
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                          {detail.dispatchSnapshot.rankedDrivers.length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info" sx={{ mb: 3 }}>
                  No dispatch snapshot available yet. Dispatch may still be pending.
                </Alert>
              )}

              {detail.dispatchSnapshot ? (
                <>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    Ranked drivers
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Rank</TableCell>
                          <TableCell>Driver ID</TableCell>
                          <TableCell>Distance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detail.dispatchSnapshot.rankedDrivers.map((driver) => (
                          <TableRow key={driver.driverId}>
                            <TableCell>{driver.rank}</TableCell>
                            <TableCell>{driver.driverId}</TableCell>
                            <TableCell>{driver.distanceKm.toFixed(2)} km</TableCell>
                          </TableRow>
                        ))}
                        {!detail.dispatchSnapshot.rankedDrivers.length ? (
                          <TableRow>
                            <TableCell colSpan={3} align="center">
                              No ranked drivers.
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    Rejection reasons
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Driver ID</TableCell>
                          <TableCell>Reason</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detail.dispatchSnapshot.rejectedDrivers.map((rejection, idx) => (
                          <TableRow key={`${rejection.driverId}-${idx}`}>
                            <TableCell>{rejection.driverId}</TableCell>
                            <TableCell>{rejection.reason}</TableCell>
                          </TableRow>
                        ))}
                        {!detail.dispatchSnapshot.rejectedDrivers.length ? (
                          <TableRow>
                            <TableCell colSpan={2} align="center">
                              No rejected drivers.
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : null}

              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Offers
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Driver ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Distance</TableCell>
                      <TableCell>Offered</TableCell>
                      <TableCell>Expires</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detail.offers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell>{offer.driverId}</TableCell>
                        <TableCell>
                          <Chip label={offer.status} size="small" color={statusColor(offer.status)} />
                        </TableCell>
                        <TableCell>{offer.distanceMeters ? `${(offer.distanceMeters / 1000).toFixed(2)} km` : "—"}</TableCell>
                        <TableCell>{formatTime(offer.offeredAt)}</TableCell>
                        <TableCell>{formatTime(offer.expiresAt)}</TableCell>
                      </TableRow>
                    ))}
                    {!detail.offers.length ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No offers created yet.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : null}
        </Grid>
      </Grid>
    </Box>
  );
}
