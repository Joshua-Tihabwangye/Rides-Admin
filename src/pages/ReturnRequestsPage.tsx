import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
  decideAdminReturnRequest,
  listAdminReturnRequests,
  type AdminReturnRequestStatus,
  type AdminReturnRequestView,
} from '../services/api/adminApi';
import StatusBadge from '../components/StatusBadge';

const REQUEST_STATUSES: Array<{ value: AdminReturnRequestStatus; label: string }> = [
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'COMPLETED', label: 'Completed' },
];

const REASON_LABELS: Record<string, string> = {
  WRONG_ITEM: 'Wrong item',
  DAMAGED: 'Damaged',
  DEFECTIVE: 'Defective',
  NOT_AS_DESCRIBED: 'Not as described',
  CHANGE_OF_MIND: 'Change of mind',
  MERCHANT_REQUEST: 'Merchant request',
  FAILED_DELIVERY: 'Failed delivery',
  OTHER: 'Other',
};

export default function ReturnRequestsPage() {
  const [requests, setRequests] = useState<AdminReturnRequestView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AdminReturnRequestStatus | ''>('');
  const [actingRequest, setActingRequest] = useState<AdminReturnRequestView | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listAdminReturnRequests({ status: statusFilter || undefined });
      setRequests(items);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load return requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const openDecision = (request: AdminReturnRequestView, decision: 'APPROVE' | 'REJECT') => {
    setActingRequest(request);
    setDecision(decision);
    setDecisionNote('');
  };

  const confirmDecision = async () => {
    if (!actingRequest) return;
    setSubmitting(true);
    setError(null);
    try {
      await decideAdminReturnRequest(actingRequest.id, decision, decisionNote || undefined);
      setActingRequest(null);
      await fetchRequests();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to record decision');
      setActingRequest(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && requests.length === 0) {
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
            Return requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and authorize customer-initiated return requests (DLV-192).
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="request-status-label">Status</InputLabel>
          <Select
            labelId="request-status-label"
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value as AdminReturnRequestStatus | '')}
            sx={{ fontSize: 12, borderRadius: 2, height: 36 }}
          >
            <MenuItem value="">
              <em>All statuses</em>
            </MenuItem>
            {REQUEST_STATUSES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
                <TableCell>Request</TableCell>
                <TableCell>Order</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Eligible refund</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id} hover>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>
                    {request.id}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{request.orderId}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize', fontSize: 12 }}>
                    {request.source.toLowerCase().replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>
                    {REASON_LABELS[request.reason] ?? request.reason}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={request.status} />
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: 12 }}>
                    {request.refundEligibleAmountCents != null
                      ? `${(request.refundEligibleAmountCents / 100).toFixed(2)} UGX`
                      : '—'}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>
                    {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    {request.status === 'REQUESTED' ? (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          sx={{ textTransform: 'none', borderRadius: 999 }}
                          onClick={() => openDecision(request, 'APPROVE')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          sx={{ textTransform: 'none', borderRadius: 999 }}
                          onClick={() => openDecision(request, 'REJECT')}
                        >
                          Reject
                        </Button>
                      </Box>
                    ) : request.decisionNote ? (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                        {request.decisionNote}
                      </Typography>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No return requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={Boolean(actingRequest)} onClose={() => !submitting && setActingRequest(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{decision === 'APPROVE' ? 'Approve return request' : 'Reject return request'}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {actingRequest ? `Order ${actingRequest.orderId} · reason ${REASON_LABELS[actingRequest.reason] ?? actingRequest.reason}.` : ''}{' '}
            {decision === 'APPROVE'
              ? 'Approving creates a return shipment and authorizes a pickup credential.'
              : 'The customer will be notified that the return was declined.'}
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Decision note (optional)"
            value={decisionNote}
            onChange={(e) => setDecisionNote(e.target.value)}
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActingRequest(null)} disabled={submitting} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={() => confirmDecision()}
            disabled={submitting}
            variant="contained"
            color={decision === 'APPROVE' ? 'success' : 'error'}
            sx={{ textTransform: 'none', borderRadius: 999 }}
          >
            {submitting ? 'Saving…' : decision === 'APPROVE' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip size="small" label={`Total: ${requests.length}`} color="primary" sx={{ borderRadius: 2 }} />
      </Box>
    </Box>
  );
}
