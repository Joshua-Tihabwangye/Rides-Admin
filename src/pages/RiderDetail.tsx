import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import StatusBadge from "../components/StatusBadge";
import { getAdminRidePayments, getAdminRider, listAdminRiderServices, listAdminRides, patchAdminRider } from "../services/api/adminApi";
import type { AdminRideListItemResponse, AdminRidePaymentResponse, AdminRiderResponse, AdminRiderServiceResponse } from "../services/api/adminApi";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null}
    </div>
  );
}

function formatMoney(value: unknown, currency = "UGX") {
  const numericValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(numericValue)) return "-";
  return `${currency} ${numericValue.toLocaleString("en-UG")}`;
}

function formatDate(value: string | number | undefined | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" });
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function riderDisplayName(rider: AdminRiderResponse) {
  return rider.fullName || `${rider.firstName || ""} ${rider.lastName || ""}`.trim() || rider.email || rider.phone || "Unnamed rider";
}

export default function RiderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [rider, setRider] = useState<AdminRiderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rides, setRides] = useState<AdminRideListItemResponse[]>([]);
  const [payments, setPayments] = useState<AdminRidePaymentResponse[]>([]);
  const [services, setServices] = useState<AdminRiderServiceResponse[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const loadRider = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setDetailsError(null);
    try {
      const data = await getAdminRider(id);
      setRider(data);
      const riderId = data.riderId || data.userId || id;
      setDetailsLoading(true);
      try {
        const [rideResponse, serviceResponse] = await Promise.all([
          listAdminRides({ riderId, limit: 10 }),
          listAdminRiderServices({ riderId }),
        ]);
        const nextRides = rideResponse.items ?? [];
        setRides(nextRides);
        setServices(serviceResponse ?? []);
        const ridePayments = await Promise.all(nextRides.slice(0, 8).map(async (ride) => {
          try {
            const response = await getAdminRidePayments(ride.id);
            return response.payments ?? [];
          } catch {
            return [];
          }
        }));
        setPayments(ridePayments.flat());
      } catch (detailsLoadError) {
        setDetailsError(getErrorMessage(detailsLoadError, "Failed to load rider trip and payment records"));
      }
    } catch (e) {
      setError(getErrorMessage(e, "Failed to load rider"));
    } finally {
      setLoading(false);
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    void loadRider();
  }, [id]);

  const toggleStatus = async () => {
    if (!rider) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await patchAdminRider(rider.userId, { status: rider.status === "active" ? "suspended" : "active" });
      await loadRider();
    } catch (e) {
      setActionError(getErrorMessage(e, "Failed to update rider status"));
    } finally {
      setActionLoading(false);
    }
  };

  const paymentTotal = useMemo(() => payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0), [payments]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !rider) return <Alert severity="error">{error || "Rider not found"}</Alert>;

  const displayName = riderDisplayName(rider);
  const phone = rider.phone || "-";
  const email = rider.email || "-";
  const trips = rider.totalTrips ?? rides.length;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/admin/riders")} sx={{ color: "text.secondary", textTransform: "none" }}>
          Back to Riders
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: "center", pt: 4 }}>
              <Avatar sx={{ width: 100, height: 100, mx: "auto", mb: 2, bgcolor: "primary.main", fontSize: 32 }}>
                <PersonIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6" fontWeight={800} gutterBottom>{displayName}</Typography>
              <Stack direction="row" justifyContent="center" spacing={1} sx={{ mb: 3 }}>
                <StatusBadge status={rider.status === "active" ? "active" : rider.status} />
              </Stack>

              <Stack spacing={2} sx={{ textAlign: "left" }}>
                <InfoLine icon={<EmailIcon color="action" fontSize="small" />} label="Email" value={email} />
                <InfoLine icon={<PhoneIcon color="action" fontSize="small" />} label="Phone" value={phone} />
                <InfoLine icon={<CalendarTodayIcon color="action" fontSize="small" />} label="Join date" value={formatDate(rider.createdAt)} />
              </Stack>

              <Divider sx={{ my: 3 }} />
              <Stack spacing={1.25}>
                <MetricLine label="Total trips" value={trips.toLocaleString()} />
                <MetricLine label="Ride payments" value={formatMoney(paymentTotal)} />
                <MetricLine label="Account status" value={rider.status.toUpperCase()} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          {actionError ? <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert> : null}
          <Card sx={{ borderRadius: 2, mb: 2 }}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={2}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>Rider account</Typography>
                  <Typography variant="body2" color="text.secondary">Client profile, trip history, and payments.</Typography>
                </Box>
                <Button variant={rider.status === "active" ? "outlined" : "contained"} color={rider.status === "active" ? "error" : "success"} onClick={toggleStatus} disabled={actionLoading} sx={{ textTransform: "none", borderRadius: 999 }}>
                  {rider.status === "active" ? "Suspend account" : "Activate account"}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ minHeight: 400, borderRadius: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)}>
                <Tab label="Trip History" />
                <Tab label="Payments" />
                <Tab label="Service Requests" />
              </Tabs>
            </Box>

            <CardContent>
              {detailsError ? <Alert severity="error" sx={{ mb: 2 }}>{detailsError}</Alert> : null}
              {detailsLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : null}

              <CustomTabPanel value={tabValue} index={0}>
                {rides.length === 0 ? (
                  <Typography color="text.secondary">No ride history returned for this rider.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Ride</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Driver</TableCell>
                        <TableCell>Pickup</TableCell>
                        <TableCell>Drop off</TableCell>
                        <TableCell align="right">Fare</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rides.map((ride) => (
                        <TableRow key={ride.id} hover onClick={() => navigate(`/admin/rides/${ride.id}`)} sx={{ cursor: "pointer" }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>#{ride.id.slice(0, 8)}</Typography>
                            <Typography variant="caption" color="text.secondary">{ride.tripType || ride.mode || ride.category || "Ride"}</Typography>
                          </TableCell>
                          <TableCell><Chip size="small" label={ride.status} /></TableCell>
                          <TableCell>{ride.driverName || ride.driverId || "-"}</TableCell>
                          <TableCell>{ride.pickupAddress || "-"}</TableCell>
                          <TableCell>{ride.destinationAddress || "-"}</TableCell>
                          <TableCell align="right">{formatMoney(ride.finalFare ?? ride.estimatedFare, ride.currency)}</TableCell>
                          <TableCell>{formatDate(ride.createdAt ?? ride.scheduledAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CustomTabPanel>

              <CustomTabPanel value={tabValue} index={1}>
                {payments.length === 0 ? (
                  <Typography color="text.secondary">No ride payments returned for this rider.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Reference</TableCell>
                        <TableCell>Provider</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Paid</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.reference || payment.providerReference || payment.id}</TableCell>
                          <TableCell>{payment.provider}</TableCell>
                          <TableCell>{payment.method}</TableCell>
                          <TableCell><Chip size="small" label={payment.status} /></TableCell>
                          <TableCell align="right">{formatMoney(payment.amount, payment.currency)}</TableCell>
                          <TableCell>{formatDate(payment.paidAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CustomTabPanel>

              <CustomTabPanel value={tabValue} index={2}>
                {services.length === 0 ? (
                  <Typography color="text.secondary">No rental, tour, ambulance, or other service requests returned for this rider.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Request</TableCell>
                        <TableCell>Service</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Driver</TableCell>
                        <TableCell>Updated</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {services.map((service) => (
                        <TableRow key={service.id} hover>
                          <TableCell>{service.id}</TableCell>
                          <TableCell>{service.serviceType}</TableCell>
                          <TableCell><Chip size="small" label={service.status} /></TableCell>
                          <TableCell>{service.driverId || "-"}</TableCell>
                          <TableCell>{formatDate(service.updatedAt || service.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CustomTabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function InfoLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      {icon}
      <Box>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body2">{value}</Typography>
      </Box>
    </Stack>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={700}>{value}</Typography>
    </Stack>
  );
}
