import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
  getAdminReturnShipment,
  inspectAdminReturnShipment,
  refundAdminReturnShipment,
  type AdminReturnDisposition,
  type AdminReturnInspectionCondition,
  type AdminReturnShipmentView,
} from '../services/api/adminApi';
import StatusBadge from '../components/StatusBadge';

const CONDITIONS: Array<{ value: AdminReturnInspectionCondition; label: string }> = [
  { value: 'ACCEPTABLE', label: 'Acceptable' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'WRONG_ITEM', label: 'Wrong item' },
  { value: 'PARTIALLY_COMPLETE', label: 'Partially complete' },
];

const DISPOSITIONS: Array<{ value: AdminReturnDisposition; label: string }> = [
  { value: 'RESTOCK', label: 'Restock to inventory' },
  { value: 'DISPOSE', label: 'Dispose' },
];

const STATUS_TIMELINE: Record<string, { label: string; key?: string }> = {
  CREATED: { label: 'Return shipment created' },
  PICKUP_SCHEDULED: { label: 'Pickup scheduled' },
  IN_TRANSIT: { label: 'Picked up', key: 'pickedUpAt' },
  DELIVERED_TO_MERCHANT: { label: 'Delivered to merchant', key: 'deliveredToMerchantAt' },
  INSPECTED: { label: 'Inspected', key: 'inspectedAt' },
  RESTOCKED: { label: 'Restocked', key: 'restockedAt' },
  DISPOSED: { label: 'Disposed', key: 'disposedAt' },
  REFUNDED: { label: 'Refunded', key: 'refundedAt' },
  CANCELLED: { label: 'Cancelled' },
};

export default function ReturnShipmentDetailPage() {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<AdminReturnShipmentView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inspectOpen, setInspectOpen] = useState(false);
  const [condition, setCondition] = useState<AdminReturnInspectionCondition>('ACCEPTABLE');
  const [disposition, setDisposition] = useState<AdminReturnDisposition>('RESTOCK');
  const [restockVariant, setRestockVariant] = useState('');
  const [restockLocation, setRestockLocation] = useState('');
  const [restockQuantity, setRestockQuantity] = useState('1');
  const [inspectNotes, setInspectNotes] = useState('');
  const [inspectBusy, setInspectBusy] = useState(false);

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundBusy, setRefundBusy] = useState(false);

  const load = useCallback(async () => {
    if (!shipmentId) return;
    setLoading(true);
    setError(null);
    try {
      setShipment(await getAdminReturnShipment(shipmentId));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load return shipment');
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const submitInspection = async () => {
    if (!shipmentId) return;
    setInspectBusy(true);
    setError(null);
    try {
      const restockTargets =
        disposition === 'RESTOCK' &&
        restockVariant.trim() &&
        restockLocation.trim() &&
        Number(restockQuantity) > 0
          ? [
              {
                productVariantId: restockVariant.trim(),
                merchantLocationId: restockLocation.trim(),
                quantity: Number(restockQuantity),
              },
            ]
          : undefined;
      setShipment(
        await inspectAdminReturnShipment(shipmentId, {
          condition,
          disposition,
          restockTargets,
          notes: inspectNotes || undefined,
        }),
      );
      setInspectOpen(false);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to record inspection');
    } finally {
      setInspectBusy(false);
    }
  };

  const submitRefund = async () => {
    if (!shipmentId) return;
    setRefundBusy(true);
    setError(null);
    try {
      const amountCents = refundAmount.trim() ? Math.round(Number(refundAmount) * 100) : undefined;
      setShipment(
        await refundAdminReturnShipment(shipmentId, amountCents, `admin-refund-${Date.now()}`),
      );
      setRefundOpen(false);
      setRefundAmount('');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to record refund');
    } finally {
      setRefundBusy(false);
    }
  };

  if (loading && !shipment) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!shipment) {
    return (
      <Box>
        <Button onClick={() => navigate('/admin/returns')} sx={{ textTransform: 'none', mb: 2 }}>
          ← Back to return shipments
        </Button>
        <Alert severity="error">{error ?? 'Return shipment not found'}</Alert>
      </Box>
    );
  }

  const timeline = STATUS_TIMELINE[shipment.status];
  const canInspect = ['DELIVERED_TO_MERCHANT', 'INSPECTED'].includes(shipment.status);
  const canRefund = ['DELIVERED_TO_MERCHANT', 'INSPECTED', 'RESTOCKED', 'DISPOSED'].includes(shipment.status) && !shipment.refundedAt;

  return (
    <Box>
      <Button onClick={() => navigate('/admin/returns')} sx={{ textTransform: 'none', mb: 2 }}>
        ← Back to return shipments
      </Button>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={700} fontFamily="monospace">
            {shipment.returnShipmentCode}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Return shipment {shipment.id} · order {shipment.orderId}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <StatusBadge status={shipment.status} />
          {canInspect ? (
            <Button
              variant="contained"
              sx={{ textTransform: 'none', borderRadius: 999 }}
              onClick={() => {
                setInspectOpen(true);
                setError(null);
              }}
            >
              Inspect
            </Button>
          ) : null}
          {canRefund ? (
            <Button
              variant="contained"
              color="success"
              sx={{ textTransform: 'none', borderRadius: 999 }}
              onClick={() => {
                setRefundOpen(true);
                setError(null);
              }}
            >
              Refund
            </Button>
          ) : null}
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Source
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                {shipment.source.toLowerCase().replace(/_/g, ' ')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Original delivery
              </Typography>
              <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                {shipment.originalTrackingCode || '—'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {new Date(shipment.createdAt).toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Timeline
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {timeline?.label ?? shipment.status}
                {timeline?.key && shipment[timeline.key as keyof AdminReturnShipmentView]
                  ? ` · ${new Date(shipment[timeline.key as keyof AdminReturnShipmentView] as string).toLocaleString()}`
                  : ''}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Refund
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {shipment.refundAmountCents != null
                  ? `${(shipment.refundAmountCents / 100).toFixed(2)} UGX`
                  : 'Not refunded'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Request
              </Typography>
              <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                {shipment.returnRequestId}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {shipment.credential ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              Return-pickup credential
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <StatusBadge status={shipment.credential.status} />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Issued
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {new Date(shipment.credential.issuedAt).toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Expires
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {new Date(shipment.credential.expiresAt).toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Version
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  v{shipment.credential.version}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Purpose
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {shipment.credential.purpose}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Consumed by driver
                </Typography>
                <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                  {shipment.credential.consumedByDriverId || '—'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ) : null}

      {shipment.inspections && shipment.inspections.length > 0 ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              Inspections
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Condition</TableCell>
                    <TableCell>Disposition</TableCell>
                    <TableCell align="right">Restocked qty</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell>Inspected</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shipment.inspections.map((inspection) => (
                    <TableRow key={inspection.id}>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{inspection.condition.toLowerCase()}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{inspection.disposition.toLowerCase()}</TableCell>
                      <TableCell align="right">{inspection.restockedQuantity ?? '—'}</TableCell>
                      <TableCell>{inspection.notes || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{new Date(inspection.inspectedAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={inspectOpen} onClose={() => !inspectBusy && setInspectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Inspect return</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Record the returned item condition and disposition. Restock requires inventory targets.
          </DialogContentText>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="condition-label">Condition</InputLabel>
              <Select
                labelId="condition-label"
                value={condition}
                label="Condition"
                onChange={(e) => setCondition(e.target.value as AdminReturnInspectionCondition)}
              >
                {CONDITIONS.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel id="disposition-label">Disposition</InputLabel>
              <Select
                labelId="disposition-label"
                value={disposition}
                label="Disposition"
                onChange={(e) => setDisposition(e.target.value as AdminReturnDisposition)}
              >
                {DISPOSITIONS.map((d) => (
                  <MenuItem key={d.value} value={d.value}>
                    {d.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {disposition === 'RESTOCK' ? (
              <>
                <TextField
                  size="small"
                  label="Product variant ID"
                  value={restockVariant}
                  onChange={(e) => setRestockVariant(e.target.value)}
                />
                <TextField
                  size="small"
                  label="Merchant location ID"
                  value={restockLocation}
                  onChange={(e) => setRestockLocation(e.target.value)}
                />
                <TextField
                  size="small"
                  label="Quantity"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                />
              </>
            ) : null}
            <TextField
              size="small"
              label="Notes (optional)"
              multiline
              rows={2}
              value={inspectNotes}
              onChange={(e) => setInspectNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInspectOpen(false)} disabled={inspectBusy} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={() => submitInspection()}
            disabled={inspectBusy}
            variant="contained"
            sx={{ textTransform: 'none', borderRadius: 999 }}
          >
            {inspectBusy ? 'Saving…' : 'Record inspection'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={refundOpen} onClose={() => !refundBusy && setRefundOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Refund return</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Refunds are capped at the eligible captured funds. Leave the amount empty to refund the full
            eligible amount.
          </DialogContentText>
          <TextField
            fullWidth
            size="small"
            label="Amount (UGX, optional)"
            type="number"
            inputProps={{ min: 0, step: '0.01' }}
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundOpen(false)} disabled={refundBusy} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={() => submitRefund()}
            disabled={refundBusy}
            variant="contained"
            color="success"
            sx={{ textTransform: 'none', borderRadius: 999 }}
          >
            {refundBusy ? 'Processing…' : 'Issue refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
