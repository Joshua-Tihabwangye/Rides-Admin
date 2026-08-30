import React, { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import {
  getAdminDeliveryAttempts,
} from '../../services/api/adminApi';
import type { AdminDeliveryAttemptResponse } from '../../services/api/adminApi';

function fmt(value?: string) {
  return value ? new Date(value).toLocaleString() : '—';
}

export default function DeliveryAttemptsSection({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<AdminDeliveryAttemptResponse[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getAdminDeliveryAttempts(orderId)
      .then((res) => {
        if (active) setAttempts(res.attempts ?? []);
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Failed to load attempts'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  if (error) return <Alert severity="error">{error}</Alert>;
  if (attempts.length === 0) {
    return <Alert severity="info">No delivery attempts recorded.</Alert>;
  }

  return (
    <Box>
      {attempts.map((attempt) => (
        <Box key={attempt.id} sx={{ mb: 3 }}>
          <Typography variant="subtitle2">
            Attempt {attempt.attemptNumber} — <StatusChip status={attempt.status} />
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.5, mb: 1 }}>
            <Typography variant="caption" color="text.secondary">Driver: {attempt.driverId ?? 'Unassigned'}</Typography>
            <Typography variant="caption" color="text.secondary">Scheduled: {fmt(attempt.scheduledFor)}</Typography>
            <Typography variant="caption" color="text.secondary">Started: {fmt(attempt.startedAt)}</Typography>
            <Typography variant="caption" color="text.secondary">Completed: {fmt(attempt.completedAt)}</Typography>
          </Box>
          {attempt.note && <Typography variant="body2">Note: {attempt.note}</Typography>}

          {attempt.failures.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="error.main" sx={{ fontWeight: 700 }}>
                Failures
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Reason</TableCell>
                      <TableCell>Retry eligible</TableCell>
                      <TableCell>Next action</TableCell>
                      <TableCell>Retries</TableCell>
                      <TableCell>Terminal policy</TableCell>
                      <TableCell>When</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attempt.failures.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>{f.reason}</TableCell>
                        <TableCell>{f.retryEligible ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{f.nextAction}</TableCell>
                        <TableCell>{f.retryCount}</TableCell>
                        <TableCell>{f.terminalPolicy ?? '—'}</TableCell>
                        <TableCell>{fmt(f.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      ))}
    </Box>
  );
}

function StatusChip({ status }: { status: string }) {
  const color =
    status === 'COMPLETED' || status === 'SUCCESS'
      ? 'success'
      : status === 'FAILED'
        ? 'error'
        : 'default';
  return <Chip size="small" color={color as any} label={status} />;
}
