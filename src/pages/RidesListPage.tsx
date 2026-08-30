import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import StatusBadge from '../components/StatusBadge';
import { listAdminRides } from '../services/api/adminApi';
import type { AdminRideListItemResponse, ListAdminRidesFilters } from '../services/api/adminApi';

const RIDE_STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'SEARCHING', label: 'Searching' },
  { value: 'OFFERED', label: 'Offered' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DRIVER_ASSIGNED', label: 'Driver assigned' },
  { value: 'DRIVER_EN_ROUTE', label: 'Driver en route' },
  { value: 'ARRIVED', label: 'Arrived' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All payments' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CAPTURED', label: 'Captured' },
  { value: 'PAID', label: 'Paid' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
];

const TRIP_TYPE_OPTIONS = [
  { value: '', label: 'All trip types' },
  { value: 'ONE_WAY', label: 'One way' },
  { value: 'ROUND_TRIP', label: 'Round trip' },
  { value: 'MULTI_LEG', label: 'Multi-leg' },
];

export default function RidesListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminRideListItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListAdminRidesFilters>({
    page: 1,
    limit: 10,
    status: '',
    tripType: '',
    paymentStatus: '',
    search: '',
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRides = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listAdminRides({
        ...filters,
        status: filters.status || undefined,
        tripType: filters.tripType || undefined,
        paymentStatus: filters.paymentStatus || undefined,
        search: filters.search || undefined,
      });
      setItems(response.items ?? []);
      setTotal(response.meta?.total ?? 0);
      setTotalPages(response.meta?.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rides');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, limit: parseInt(event.target.value, 10), page: 1 }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <DirectionsCarIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Rides
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search ride, rider or driver"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="ride-status-label">Status</InputLabel>
              <Select
                labelId="ride-status-label"
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
              >
                {RIDE_STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="ride-trip-label">Trip type</InputLabel>
              <Select
                labelId="ride-trip-label"
                label="Trip type"
                value={filters.tripType}
                onChange={(e) => setFilters((prev) => ({ ...prev, tripType: e.target.value, page: 1 }))}
              >
                {TRIP_TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="ride-pay-label">Payment</InputLabel>
              <Select
                labelId="ride-pay-label"
                label="Payment"
                value={filters.paymentStatus}
                onChange={(e) => setFilters((prev) => ({ ...prev, paymentStatus: e.target.value, page: 1 }))}
              >
                {PAYMENT_STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={fetchRides}>
              Refresh
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ride</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Rider</TableCell>
                  <TableCell>Driver</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Fare</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        No rides found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((ride) => (
                    <TableRow key={ride.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {ride.id.slice(0, 8)}
                        </Typography>
                        {ride.dispatchFailed && (
                          <Chip size="small" color="error" label="Dispatch failed" sx={{ mt: 0.5 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ride.status} label={ride.status} />
                      </TableCell>
                      <TableCell>{ride.riderName ?? ride.riderId?.slice(0, 8) ?? '—'}</TableCell>
                      <TableCell>{ride.driverName ?? 'Unassigned'}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{ride.category ?? '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ride.mode ?? ''}
                        </Typography>
                      </TableCell>
                      <TableCell>{ride.tripType ?? '—'}</TableCell>
                      <TableCell>
                        {ride.finalFare ?? ride.estimatedFare ?? 0} {ride.currency ?? ''}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ride.paymentStatus ?? 'unknown'} label={ride.paymentStatus ?? '—'} />
                      </TableCell>
                      <TableCell>
                        {ride.createdAt ? new Date(ride.createdAt).toLocaleString() : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => navigate(`/admin/rides/${ride.id}`)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={(filters.page ?? 1) - 1}
            onPageChange={handleChangePage}
            rowsPerPage={filters.limit ?? 10}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
