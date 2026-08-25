import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
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
  decideAdminDispute,
  getAdminDispute,
  listAdminDisputes,
  markAdminDisputeUnderReview,
  type AdminDisputeReason,
  type AdminDisputeResolution,
  type AdminDisputeStatus,
  type AdminDisputeView,
} from '../services/api/adminApi';
import StatusBadge from '../components/StatusBadge';

const DISPUTE_STATUSES: Array<{ value: AdminDisputeStatus; label: string }> = [
  { value: 'OPEN', label: 'Open' },
  { value: 'UNDER_REVIEW', label: 'Under review' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

const REASON_LABELS: Record<string, string> = {
  NOT_RECEIVED: 'Not received',
  WRONG_ITEM: 'Wrong item',
  DAMAGED: 'Damaged',
  DEFECTIVE: 'Defective',
  MISSING_PARTS: 'Missing parts',
  OVERCHARGED: 'Overcharged',
  UNPROFESSIONAL_DRIVER: 'Unprofessional driver',
  POOR_SERVICE: 'Poor service',
  OTHER: 'Other',
};

const RESOLUTION_LABELS: Record<string, string> = {
  REFUND: 'Full refund',
  PARTIAL_REFUND: 'Partial refund',
  REPLACEMENT: 'Replacement',
  NO_REMEDY: 'No remedy',
};

const DECISION_REQUIRES_AMOUNT: AdminDisputeResolution[] = ['REFUND', 'PARTIAL_REFUND'];

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<AdminDisputeView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AdminDisputeStatus | ''>('');
  const [reasonFilter, setReasonFilter] = useState<AdminDisputeReason | ''>('');
  const [orderQuery, setOrderQuery] = useState('');

  const [detail, setDetail] = useState<AdminDisputeView | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actingDispute, setActingDispute] = useState<AdminDisputeView | null>(null);
  const [resolution, setResolution] = useState<AdminDisputeResolution>('REFUND');
  const [amountCents, setAmountCents] = useState('');
  const [decisionNote, setDecisionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listAdminDisputes({
        status: statusFilter || undefined,
        reason: reasonFilter || undefined,
        orderId: orderQuery.trim() || undefined,
      });
      setDisputes(items);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load delivery disputes');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, reasonFilter, orderQuery]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const openDetail = async (dispute: AdminDisputeView) => {
    setDetailLoading(true);
    setDetail(dispute);
    try {
      const fresh = await getAdminDispute(dispute.id);
      setDetail(fresh);
      setDisputes((prev) => prev.map((d) => (d.id === fresh.id ? fresh : d)));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load dispute detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const startReview = async (dispute: AdminDisputeView) => {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await markAdminDisputeUnderReview(dispute.id);
      setDisputes((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      if (detail?.id === updated.id) setDetail(updated);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to move dispute to under review');
    } finally {
      setSubmitting(false);
    }
  };

  const openDecision = (dispute: AdminDisputeView) => {
    setActingDispute(dispute);
    setResolution('REFUND');
    setAmountCents('');
    setDecisionNote('');
  };

  const confirmDecision = async () => {
    if (!actingDispute) return;
    setSubmitting(true);
    setError(null);
    try {
      const requiresAmount = DECISION_REQUIRES_AMOUNT.includes(resolution);
      const amountValue = requiresAmount ? Math.round(Number(amountCents) || 0) : undefined;
      if (requiresAmount && (!amountValue || amountValue <= 0)) {
        throw new Error('Refund amount must be a positive number');
      }
      const updated = await decideAdminDispute(actingDispute.id, {
        resolution,
        amountCents: amountValue,
        note: decisionNote || undefined,
        clientRequestId: `admin-${crypto.randomUUID()}`,
      });
      setActingDispute(null);
      setDisputes((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      if (detail?.id === updated.id) setDetail(updated);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to record dispute decision');
      setActingDispute(null);
    } finally {
      setSubmitting(false);
    }
  };

  const canReview = (dispute: AdminDisputeView) => dispute.status === 'OPEN';
  const canDecide = (dispute: AdminDisputeView) =>
    dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW';

  if (loading && disputes.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Delivery disputes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Investigate customer disputes and issue bounded refunds (DLV-193).
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Filter by order ID"
            value={orderQuery}
            onChange={(e) => setOrderQuery(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="dispute-status-label">Status</InputLabel>
            <Select
              labelId="dispute-status-label"
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value as AdminDisputeStatus | '')}
            >
              <MenuItem value="">
                <em>All statuses</em>
              </MenuItem>
              {DISPUTE_STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="dispute-reason-label">Reason</InputLabel>
            <Select
              labelId="dispute-reason-label"
              value={reasonFilter}
              label="Reason"
              onChange={(e) => setReasonFilter(e.target.value as AdminDisputeReason | '')}
            >
              <MenuItem value="">
                <em>All reasons</em>
              </MenuItem>
              {Object.entries(REASON_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

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
                <TableCell>Dispute</TableCell>
                <TableCell>Order</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Resolution</TableCell>
                <TableCell align="right">Refund</TableCell>
                <TableCell>Opened</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {disputes.map((dispute) => (
                <TableRow key={dispute.id} hover>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>
                    {dispute.id}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{dispute.orderId}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>
                    {REASON_LABELS[dispute.reason] ?? dispute.reason}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={dispute.status} />
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>
                    {dispute.resolution ? RESOLUTION_LABELS[dispute.resolution] ?? dispute.resolution : '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: 12 }}>
                    {dispute.refundAmountCents != null
                      ? `${(dispute.refundAmountCents / 100).toFixed(2)} UGX`
                      : '—'}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>
                    {dispute.createdAt ? new Date(dispute.createdAt).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      {canDecide(dispute) ? (
                        <Button
                          size="small"
                          variant="contained"
                          sx={{ textTransform: 'none', borderRadius: 999 }}
                          onClick={() => openDecision(dispute)}
                        >
                          Decide
                        </Button>
                      ) : null}
                      {canReview(dispute) ? (
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: 'none', borderRadius: 999 }}
                          onClick={() => startReview(dispute)}
                          disabled={submitting}
                        >
                          Review
                        </Button>
                      ) : null}
                      <Button
                        size="small"
                        variant="text"
                        sx={{ textTransform: 'none', borderRadius: 999 }}
                        onClick={() => openDetail(dispute)}
                      >
                        View
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {disputes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No delivery disputes found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip size="small" label={`Total: ${disputes.length}`} color="primary" sx={{ borderRadius: 2 }} />
      </Box>

      <Dialog
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Dispute details</DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : detail ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
              <Typography variant="body2">
                <strong>Dispute:</strong> <span style={{ fontFamily: 'monospace' }}>{detail.id}</span>
              </Typography>
              <Typography variant="body2">
                <strong>Order:</strong> <span style={{ fontFamily: 'monospace' }}>{detail.orderId}</span>
              </Typography>
              <Typography variant="body2">
                <strong>Reason:</strong> {REASON_LABELS[detail.reason] ?? detail.reason}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> <StatusBadge status={detail.status} />
              </Typography>
              {detail.note ? (
                <Typography variant="body2">
                  <strong>Customer note:</strong> {detail.note}
                </Typography>
              ) : null}
              {detail.evidence && Object.keys(detail.evidence).length > 0 ? (
                <Box>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Evidence:</strong>
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      fontSize: 11,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: 200,
                      overflow: 'auto',
                    }}
                  >
                    {JSON.stringify(detail.evidence, null, 2)}
                  </Box>
                </Box>
              ) : null}
              {detail.resolution ? (
                <Typography variant="body2">
                  <strong>Resolution:</strong>{' '}
                  {RESOLUTION_LABELS[detail.resolution] ?? detail.resolution}
                </Typography>
              ) : null}
              {detail.refundAmountCents != null ? (
                <Typography variant="body2">
                  <strong>Refund:</strong> {(detail.refundAmountCents / 100).toFixed(2)} UGX
                </Typography>
              ) : null}
              {detail.decisionNote ? (
                <Typography variant="body2">
                  <strong>Decision note:</strong> {detail.decisionNote}
                </Typography>
              ) : null}
              {detail.refundReference ? (
                <Typography variant="body2">
                  <strong>Refund reference:</strong> {detail.refundReference}
                </Typography>
              ) : null}
              <Typography variant="body2" color="text.secondary">
                Opened {detail.createdAt ? new Date(detail.createdAt).toLocaleString() : 'N/A'}
                {detail.decidedAt ? ` · decided ${new Date(detail.decidedAt).toLocaleString()}` : ''}
              </Typography>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetail(null)} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(actingDispute)}
        onClose={() => !submitting && setActingDispute(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Decide dispute</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {actingDispute
              ? `Order ${actingDispute.orderId} · ${REASON_LABELS[actingDispute.reason] ?? actingDispute.reason}. Refunds are bounded by the eligible captured funds for the delivery.`
              : ''}
          </DialogContentText>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="resolution-label">Resolution</InputLabel>
              <Select
                labelId="resolution-label"
                value={resolution}
                label="Resolution"
                onChange={(e) => setResolution(e.target.value as AdminDisputeResolution)}
              >
                {Object.entries(RESOLUTION_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {DECISION_REQUIRES_AMOUNT.includes(resolution) ? (
              <TextField
                fullWidth
                type="number"
                size="small"
                label="Refund amount (UGX)"
                value={amountCents}
                onChange={(e) => setAmountCents(e.target.value)}
                helperText="Must not exceed the eligible captured funds for the delivery."
              />
            ) : null}
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label="Decision note (optional)"
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActingDispute(null)} disabled={submitting} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={() => confirmDecision()}
            disabled={submitting}
            variant="contained"
            color="primary"
            sx={{ textTransform: 'none', borderRadius: 999 }}
          >
            {submitting ? 'Saving…' : 'Record decision'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
