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
} from '@mui/material';
import { getAdminDeliveryFeedback } from '../../services/api/adminApi';
import type { AdminDeliveryFeedbackResponse } from '../../services/api/adminApi';

function fmt(value?: string) {
  return value ? new Date(value).toLocaleString() : '—';
}

export default function DeliveryFeedbackSection({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AdminDeliveryFeedbackResponse[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getAdminDeliveryFeedback(orderId)
      .then((res) => active && setFeedback(res.feedback ?? []))
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Failed to load feedback'))
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
  if (feedback.length === 0) return <Alert severity="info">No feedback recorded for this delivery.</Alert>;

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Customer</TableCell>
            <TableCell>Driver</TableCell>
            <TableCell>Rating</TableCell>
            <TableCell>Message</TableCell>
            <TableCell>Tip</TableCell>
            <TableCell>When</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {feedback.map((f) => (
            <TableRow key={f.id}>
              <TableCell>{f.customerId.slice(0, 8)}</TableCell>
              <TableCell>{f.driverId ? f.driverId.slice(0, 8) : '—'}</TableCell>
              <TableCell>
                <Chip size="small" color={f.rating >= 4 ? 'success' : f.rating >= 3 ? 'warning' : 'error'} label={`${f.rating} / 5`} />
              </TableCell>
              <TableCell>{f.message ?? '—'}</TableCell>
              <TableCell>{f.tipAmount.toLocaleString()}</TableCell>
              <TableCell>{fmt(f.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
