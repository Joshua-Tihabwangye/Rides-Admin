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
import { getAdminDeliveryEarnings } from '../../services/api/adminApi';
import type { AdminDeliveryEarningResponse } from '../../services/api/adminApi';

function fmt(value?: string) {
  return value ? new Date(value).toLocaleString() : '—';
}

export default function DeliverySettlementSection({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<AdminDeliveryEarningResponse[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getAdminDeliveryEarnings(orderId)
      .then((res) => {
        if (active) setEarnings(res.earnings ?? []);
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Failed to load earnings'))
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
  if (earnings.length === 0) {
    return <Alert severity="info">No driver earnings recorded for this delivery.</Alert>;
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Driver</TableCell>
            <TableCell>Gross</TableCell>
            <TableCell>Base fee</TableCell>
            <TableCell>Tip</TableCell>
            <TableCell>Bonus</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Settled at</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {earnings.map((e, i) => (
            <TableRow key={`${e.driverId}-${i}`}>
              <TableCell>{e.driverId.slice(0, 8)}</TableCell>
              <TableCell>
                {e.amount.toLocaleString()} {e.currency}
              </TableCell>
              <TableCell>{e.baseFee.toLocaleString()}</TableCell>
              <TableCell>{e.tip != null ? e.tip.toLocaleString() : '—'}</TableCell>
              <TableCell>{e.bonus != null ? e.bonus.toLocaleString() : '—'}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  color={e.status === 'SETTLED' ? 'success' : 'default'}
                  label={e.status}
                />
              </TableCell>
              <TableCell>{fmt(e.settledAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
