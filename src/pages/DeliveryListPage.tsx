import React, { useEffect, useMemo, useState } from 'react';
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
import AddIcon from '@mui/icons-material/Add';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StatusBadge from '../components/StatusBadge';
import {
  listAdminDeliveries,
} from '../services/api/adminApi';
import type { AdminDeliveryOrderResponse, ListAdminDeliveriesFilters } from '../services/api/adminApi';

const ORIGIN_TYPES = [
  { value: '', label: 'All origins' },
  { value: 'merchant', label: 'Merchant' },
  { value: 'individual', label: 'Individual' },
];

const STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'failed', label: 'Failed' },
];

const READINESS_STATUSES = [
  { value: '', label: 'All readiness' },
  { value: 'not_ready', label: 'Not ready' },
  { value: 'ready', label: 'Ready' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'completed', label: 'Completed' },
];

export default function DeliveryListPage() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<AdminDeliveryOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListAdminDeliveriesFilters>({
    page: 1,
    limit: 10,
    originType: '',
    status: '',
    readinessStatus: '',
    trackingCode: '',
    fromDate: '',
    toDate: '',
  });
  const [total, setTotal] = useState(0);

  const fetchDeliveries = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listAdminDeliveries({
        ...filters,
        originType: filters.originType || undefined,
        status: filters.status || undefined,
        readinessStatus: filters.readinessStatus || undefined,
        trackingCode: filters.trackingCode || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      });
      setDeliveries(response.items);
      setTotal(response.meta.total);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.originType, filters.status, filters.readinessStatus, filters.fromDate, filters.toDate]);

  // Debounce search and tracking code inputs
  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const [trackingInput, setTrackingInput] = useState(filters.trackingCode ?? '');

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, trackingCode: trackingInput || undefined, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [trackingInput]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, limit: parseInt(event.target.value, 10), page: 1 }));
  };

  const handleRowClick = (id: string) => {
    navigate(`/admin/deliveries/${id}`);
  };

  const originTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    deliveries.forEach((d) => {
      const key = d.originType || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [deliveries]);

  if (loading && deliveries.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Deliveries
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track, manage, and inspect delivery orders across the platform.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ textTransform: 'none', borderRadius: 999 }}
          onClick={() => navigate('/admin/delivery-labels/print-queue')}
        >
          Bulk Print Queue
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', p: 2 }}>
          <TextField
            size="small"
            placeholder="Search deliveries..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 260, '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
          />
          <TextField
            size="small"
            placeholder="Tracking code"
            value={trackingInput}
            onChange={(e) => setTrackingInput(e.target.value)}
            sx={{ width: 180, '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="origin-type-label">Origin</InputLabel>
            <Select
              labelId="origin-type-label"
              value={filters.originType}
              label="Origin"
              onChange={(e) => setFilters((prev) => ({ ...prev, originType: e.target.value, page: 1 }))}
              sx={{ fontSize: 12, borderRadius: 2, height: 36 }}
            >
              {ORIGIN_TYPES.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              value={filters.status}
              label="Status"
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
              sx={{ fontSize: 12, borderRadius: 2, height: 36 }}
            >
              {STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="readiness-label">Readiness</InputLabel>
            <Select
              labelId="readiness-label"
              value={filters.readinessStatus}
              label="Readiness"
              onChange={(e) => setFilters((prev) => ({ ...prev, readinessStatus: e.target.value, page: 1 }))}
              sx={{ fontSize: 12, borderRadius: 2, height: 36 }}
            >
              {READINESS_STATUSES.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            type="date"
            label="From"
            value={filters.fromDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value, page: 1 }))}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 150, '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={filters.toDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value, page: 1 }))}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 150, '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
          />
        </CardContent>
      </Card>

      {/* Origin summary chips */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          size="small"
          icon={<LocalShippingIcon fontSize="small" />}
          label={`Total: ${total}`}
          color="primary"
          sx={{ borderRadius: 2 }}
        />
        {Object.entries(originTypeCounts).map(([key, count]) => (
          <Chip
            key={key}
            size="small"
            label={`${key}: ${count}`}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'capitalize' }}
          />
        ))}
      </Box>

      {/* Table */}
      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tracking code</TableCell>
                <TableCell>Origin</TableCell>
                <TableCell>Sender</TableCell>
                <TableCell>Recipient</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Readiness</TableCell>
                <TableCell>Labels</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deliveries.map((delivery) => (
                <TableRow
                  key={delivery.id}
                  hover
                  onClick={() => handleRowClick(delivery.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>
                    {delivery.trackingCode || delivery.id}
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{delivery.originType || 'N/A'}</TableCell>
                  <TableCell>{delivery.sender?.contactName || delivery.sender?.address || 'N/A'}</TableCell>
                  <TableCell>{delivery.recipient?.contactName || delivery.recipient?.address || 'N/A'}</TableCell>
                  <TableCell>{delivery.driverName || delivery.driverId || 'Unassigned'}</TableCell>
                  <TableCell>
                    <StatusBadge status={delivery.status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={delivery.readinessStatus || 'unknown'} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={delivery.labelStatus || 'pending'} />
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>
                    {delivery.createdAt ? new Date(delivery.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
              {deliveries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No deliveries found.
                  </TableCell>
                </TableRow>
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
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>
    </Box>
  );
}
