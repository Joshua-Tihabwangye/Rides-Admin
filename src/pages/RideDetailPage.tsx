import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Typography,
  Tabs,
  Tab,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import StatusBadge from '../components/StatusBadge';
import { getAdminRide } from '../services/api/adminApi';
import type { AdminRideDetailResponse } from '../services/api/adminApi';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography variant="body2">{value ?? '—'}</Typography>
    </Box>
  );
}

function fmtDateTime(value?: string) {
  return value ? new Date(value).toLocaleString() : '—';
}

function fmtMoney(amount?: number, currency?: string) {
  if (amount === undefined || amount === null) return '—';
  return `${amount.toLocaleString()} ${currency ?? ''}`.trim();
}

export default function RideDetailPage() {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const [ride, setRide] = useState<AdminRideDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (!rideId) return;
    setLoading(true);
    setError(null);
    getAdminRide(rideId)
      .then(setRide)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load ride'))
      .finally(() => setLoading(false));
  }, [rideId]);

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !ride) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/rides')} sx={{ mb: 2 }}>
          Back to rides
        </Button>
        <Alert severity="error">{error ?? 'Ride not found'}</Alert>
      </Box>
    );
  }

  const tabs = [
    'Overview',
    'Route & Stops',
    'Rider & Passengers',
    'Driver & Vehicle',
    'Dispatch & Matching',
    'Timeline',
    'Pricing & Payment',
    'Actuals & Anomalies',
    'Feedback',
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/rides')}>
          Back
        </Button>
        <DirectionsCarIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Ride {ride.id.slice(0, 8)}
        </Typography>
        <StatusBadge status={ride.status} label={ride.status} />
        {ride.lifecycle?.dispatchFailureReason && (
          <Chip color="error" size="small" label="Dispatch failed" />
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          {tabs.map((label, i) => (
            <Tab key={label} label={label} id={`ride-tab-${i}`} />
          ))}
        </Tabs>
      </Box>

      <CustomTabPanel value={tab} index={0}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Rider" value={ride.rider ? `${ride.rider.name ?? ''} (${ride.rider.id?.slice(0, 8)})` : '—'} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Driver" value={ride.driver ? `${ride.driver.name ?? ''} (${ride.driver.id.slice(0, 8)})` : 'Unassigned'} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Vehicle" value={ride.vehicle ? `${ride.vehicle.plateNumber ?? ride.vehicle.model ?? ''} (${ride.vehicle.id.slice(0, 8)})` : '—'} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Mode / Category / Trip" value={`${ride.mode ?? ''} / ${ride.category ?? ''} / ${ride.tripType ?? ''}`} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Passengers / Seats / Luggage" value={`${ride.configuration?.passengerCount ?? '—'} / ${ride.configuration?.seatCount ?? '—'} / ${ride.configuration?.luggageCount ?? '—'}`} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Scheduled" value={fmtDateTime(ride.scheduling?.scheduledAt)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Estimated distance / duration" value={`${ride.route?.estimatedDistanceKm ?? '—'} km / ${ride.route?.estimatedDurationMinutes ?? '—'} min`} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Estimated fare" value={fmtMoney(ride.pricing?.estimatedFare, ride.pricing?.currency)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Final fare" value={fmtMoney(ride.pricing?.finalFare, ride.pricing?.currency)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Payment" value={ride.payment ? <StatusBadge status={ride.payment.status} label={ride.payment.status} /> : '—'} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Verification" value={ride.verification?.passed ? 'Passed' : ride.verification?.required ? 'Required' : '—'} />
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Lifecycle</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={2}><Field label="Accepted" value={fmtDateTime(ride.lifecycle?.acceptedAt)} /></Grid>
          <Grid item xs={6} sm={4} md={2}><Field label="Arrived" value={fmtDateTime(ride.lifecycle?.arrivedAt)} /></Grid>
          <Grid item xs={6} sm={4} md={2}><Field label="Started" value={fmtDateTime(ride.lifecycle?.startedAt)} /></Grid>
          <Grid item xs={6} sm={4} md={2}><Field label="Completed" value={fmtDateTime(ride.lifecycle?.completedAt)} /></Grid>
          <Grid item xs={6} sm={4} md={2}><Field label="Cancelled" value={fmtDateTime(ride.lifecycle?.cancelledAt)} /></Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Field label="Cancellation reason" value={ride.lifecycle?.cancellationReason} />
          </Grid>
          <Grid item xs={12}>
            <Field label="Dispatch failure reason" value={ride.lifecycle?.dispatchFailureReason} />
          </Grid>
        </Grid>
      </CustomTabPanel>

      <CustomTabPanel value={tab} index={1}>
        <Field label="Pickup" value={ride.route?.pickupAddress} />
        <Field label="Destination" value={ride.route?.destinationAddress} />
        <Box sx={{ mt: 1 }} />
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Stops</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Arrived</TableCell>
                <TableCell>Departed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ride.stops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>No stops recorded</TableCell>
                </TableRow>
              ) : (
                ride.stops.map((stop) => (
                  <TableRow key={stop.id}>
                    <TableCell>{stop.sequence}</TableCell>
                    <TableCell>{stop.type}</TableCell>
                    <TableCell>{stop.address}</TableCell>
                    <TableCell><StatusBadge status={stop.status} label={stop.status} /></TableCell>
                    <TableCell>{fmtDateTime(stop.arrivedAt)}</TableCell>
                    <TableCell>{fmtDateTime(stop.departedAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CustomTabPanel>

      <CustomTabPanel value={tab} index={2}>
        <Field label="Primary rider" value={ride.rider ? `${ride.rider.name ?? ''} ${ride.rider.phone ?? ''}` : '—'} />
        {ride.configuration?.bookingFor && (
          <Box sx={{ mt: 1 }}>
            <Field label="Booked for" value={ride.configuration.bookingFor} />
          </Box>
        )}
        {ride.configuration?.beneficiary && (
          <Box sx={{ mt: 1 }}>
            <Field label="Beneficiary" value={JSON.stringify(ride.configuration.beneficiary)} />
          </Box>
        )}
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Passengers</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Seats</TableCell>
                <TableCell>Fare share</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ride.passengers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>No shared passengers</TableCell>
                </TableRow>
              ) : (
                ride.passengers.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name ?? p.userId?.slice(0, 8) ?? '—'}</TableCell>
                    <TableCell>{p.role}</TableCell>
                    <TableCell>{p.seatCount}</TableCell>
                    <TableCell>{p.fareShare}</TableCell>
                    <TableCell>{p.status}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CustomTabPanel>

      <CustomTabPanel value={tab} index={3}>
        {ride.driver && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}><Field label="Driver ID" value={ride.driver.id.slice(0, 8)} /></Grid>
            <Grid item xs={12} sm={6} md={3}><Field label="Name" value={ride.driver.name} /></Grid>
            <Grid item xs={12} sm={6} md={3}><Field label="Rating" value={ride.driver.rating ?? '—'} /></Grid>
          </Grid>
        )}
        {ride.vehicle && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6} md={3}><Field label="Vehicle" value={`${ride.vehicle.make ?? ''} ${ride.vehicle.model ?? ''}`} /></Grid>
            <Grid item xs={12} sm={6} md={3}><Field label="Plate" value={ride.vehicle.plateNumber} /></Grid>
            <Grid item xs={12} sm={6} md={3}><Field label="Type" value={ride.vehicle.vehicleType} /></Grid>
            <Grid item xs={12} sm={6} md={3}><Field label="Status" value={ride.vehicle.status} /></Grid>
          </Grid>
        )}
        {!ride.driver && !ride.vehicle && <Typography variant="body2">No driver or vehicle assigned.</Typography>}
      </CustomTabPanel>

      <CustomTabPanel value={tab} index={4}>
        {ride.lifecycle?.dispatchFailureReason && (
          <Alert severity="error" sx={{ mb: 2 }}>Dispatch failure: {ride.lifecycle.dispatchFailureReason}</Alert>
        )}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Offers</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Driver</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Offered</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Responded</TableCell>
                <TableCell>Distance to pickup</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ride.offers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>No offers recorded</TableCell>
                </TableRow>
              ) : (
                ride.offers.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>{o.driverName ?? o.driverId.slice(0, 8)}</TableCell>
                    <TableCell><StatusBadge status={o.status} label={o.status} /></TableCell>
                    <TableCell>{fmtDateTime(o.offeredAt)}</TableCell>
                    <TableCell>{fmtDateTime(o.expiresAt)}</TableCell>
                    <TableCell>{fmtDateTime(o.respondedAt)}</TableCell>
                    <TableCell>{o.distanceToPickupKm ?? '—'} km</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CustomTabPanel>

      <CustomTabPanel value={tab} index={5}>
        <List>
          {ride.events.length === 0 ? (
            <ListItem><ListItemText primary="No events recorded" /></ListItem>
          ) : (
            ride.events.map((e) => (
              <ListItem key={e.id} divider>
                <ListItemText
                  primary={e.type}
                  secondary={`${fmtDateTime(e.createdAt)}${e.actorUserId ? ` • actor ${e.actorUserId.slice(0, 8)}` : ''}${e.data ? ` • ${JSON.stringify(e.data)}` : ''}`}
                />
              </ListItem>
            ))
          )}
        </List>
      </CustomTabPanel>

      <CustomTabPanel value={tab} index={6}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}><Field label="Estimated fare" value={fmtMoney(ride.pricing?.estimatedFare, ride.pricing?.currency)} /></Grid>
          <Grid item xs={12} sm={6} md={3}><Field label="Final fare" value={fmtMoney(ride.pricing?.finalFare, ride.pricing?.currency)} /></Grid>
          <Grid item xs={12} sm={6} md={3}><Field label="Discount" value={fmtMoney(ride.pricing?.discountAmount, ride.pricing?.currency)} /></Grid>
          <Grid item xs={12} sm={6} md={3}><Field label="Promo" value={ride.pricing?.promoCode} /></Grid>
          <Grid item xs={12} sm={6} md={3}><Field label="Payment method" value={ride.payment?.method} /></Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Payment status" value={ride.payment ? <StatusBadge status={ride.payment.status} label={ride.payment.status} /> : '—'} />
          </Grid>
        </Grid>
      </CustomTabPanel>

      <CustomTabPanel value={tab} index={7}>
        {ride.actuals ? (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Field label="Est. distance" value={`${ride.route?.estimatedDistanceKm ?? '—'} km`} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Field label="Actual distance" value={`${ride.actuals.actualDistanceKm ?? '—'} km`} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Field label="Est. duration" value={`${ride.route?.estimatedDurationMinutes ?? '—'} min`} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Field label="Actual duration" value={`${ride.actuals.actualDurationMinutes ?? '—'} min`} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Field label="GPS confidence" value={ride.actuals.confidence} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Field label="Breadcrumbs" value={ride.actuals.breadcrumbCount} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Anomaly flags</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                {ride.actuals.anomalyFlags.length === 0 ? (
                  <Chip size="small" color="success" label="None" />
                ) : (
                  ride.actuals.anomalyFlags.map((flag) => (
                    <Chip key={flag} size="small" color="warning" label={flag} />
                  ))
                )}
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="info">No trip actuals recorded for this ride.</Alert>
        )}
      </CustomTabPanel>

      <CustomTabPanel value={tab} index={8}>
        {ride.feedback ? (
          <Card variant="outlined">
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}><Field label="Rating" value={`${ride.feedback.rating} / 5`} /></Grid>
                <Grid item xs={12} sm={6} md={3}><Field label="Tip" value={fmtMoney(ride.feedback.tipAmount, ride.pricing?.currency)} /></Grid>
                <Grid item xs={12}><Field label="Message" value={ride.feedback.message} /></Grid>
              </Grid>
            </CardContent>
          </Card>
        ) : (
          <Alert severity="info">No feedback recorded for this ride.</Alert>
        )}
      </CustomTabPanel>
    </Box>
  );
}
