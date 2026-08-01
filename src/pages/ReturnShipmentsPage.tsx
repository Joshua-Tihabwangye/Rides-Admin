import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  listAdminReturnShipments,
  type AdminReturnRequestSource,
  type AdminReturnShipmentStatus,
  type AdminReturnShipmentView,
} from '../services/api/adminApi';
import StatusBadge from '../components/StatusBadge';

const SHIPMENT_STATUSES: Array<{ value: AdminReturnShipmentStatus; label: string }> = [
  { value: 'CREATED', label: 'Created' },
  { value: 'PICKUP_SCHEDULED', label: 'Pickup scheduled' },
  { value: 'IN_TRANSIT', label: 'In transit' },
  { value: 'DELIVERED_TO_MERCHANT', label: 'Delivered to merchant' },
  { value: 'INSPECTED', label: 'Inspected' },
  { value: 'RESTOCKED', label: 'Restocked' },
  { value: 'DISPOSED', label: 'Disposed' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const SOURCES: Array<{ value: AdminReturnRequestSource; label: string }> = [
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'MERCHANT', label: 'Merchant' },
  { value: 'FAILED_DELIVERY', label: 'Failed delivery' },
];

export default function ReturnShipmentsPage() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<AdminReturnShipmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AdminReturnShipmentStatus | ''>('');
  const [sourceFilter, setSourceFilter] = useState<AdminReturnRequestSource | ''>('');
  const [orderInput, setOrderInput] = useState('');
  const [orderId, setOrderId] = useState('');

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listAdminReturnShipments({
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        orderId: orderId || undefined,
      });
      setShipments(items);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load return shipments');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sourceFilter, orderId]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  if (loading && shipments.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Return shipments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reverse logistics runs as its own shipment lifecycle (DLV-192).
          </Typography>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', p: 2 }}>
          <TextField
            size="small"
            placeholder="Order ID"
            value={orderInput}
            onChange={(e) => setOrderInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setOrderId(orderInput.trim());
            }}
            sx={{ width: 220, '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="shipment-status-label">Status</InputLabel>
            <Select
              labelId="shipment-status-label"
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value as AdminReturnShipmentStatus | '')}
              sx={{ fontSize: 12, borderRadius: 2, height: 36 }}
            >
              <MenuItem value="">
                <em>All statuses</em>
              </MenuItem>
              {SHIPMENT_STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="shipment-source-label">Source</InputLabel>
            <Select
              labelId="shipment-source-label"
              value={sourceFilter}
              label="Source"
              onChange={(e) => setSourceFilter(e.target.value as AdminReturnRequestSource | '')}
              sx={{ fontSize: 12, borderRadius: 2, height: 36 }}
            >
              <MenuItem value="">
                <em>All sources</em>
              </MenuItem>
              {SOURCES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Return code</TableCell>
                <TableCell>Order</TableCell>
                <TableCell>Original delivery</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Refund</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shipments.map((shipment) => (
                <TableRow
                  key={shipment.id}
                  hover
                  onClick={() => navigate(`/admin/returns/shipments/${shipment.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>
                    {shipment.returnShipmentCode}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{shipment.orderId}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {shipment.originalTrackingCode || '—'}
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize', fontSize: 12 }}>
                    {shipment.source.toLowerCase().replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={shipment.status} />
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: 12 }}>
                    {shipment.refundAmountCents != null
                      ? `${(shipment.refundAmountCents / 100).toFixed(2)} UGX`
                      : '—'}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>
                    {shipment.createdAt ? new Date(shipment.createdAt).toLocaleString() : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
              {shipments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No return shipments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip size="small" label={`Total: ${shipments.length}`} color="primary" sx={{ borderRadius: 2 }} />
      </Box>
    </Box>
  );
}
