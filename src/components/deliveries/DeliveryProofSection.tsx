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
import { getAdminDeliveryProofs } from '../../services/api/adminApi';
import type { AdminDeliveryProofResponse } from '../../services/api/adminApi';

function fmt(value?: string) {
  return value ? new Date(value).toLocaleString() : '—';
}

export default function DeliveryProofSection({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proofs, setProofs] = useState<AdminDeliveryProofResponse[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getAdminDeliveryProofs(orderId)
      .then((res) => active && setProofs(res.items ?? []))
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Failed to load proofs'))
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
  if (proofs.length === 0) return <Alert severity="info">No proof-of-delivery records for this delivery.</Alert>;

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Attempt</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Verification</TableCell>
            <TableCell>Receiver type</TableCell>
            <TableCell>Captured</TableCell>
            <TableCell>Review</TableCell>
            <TableCell>Notes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {proofs.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.attempt ?? '—'}</TableCell>
              <TableCell><Chip size="small" label={p.status} /></TableCell>
              <TableCell>{p.verificationMethod ?? '—'}</TableCell>
              <TableCell>{p.receiverIdentityType ?? '—'}</TableCell>
              <TableCell>{fmt(p.capturedAt ?? p.submittedAt)}</TableCell>
              <TableCell>
                {p.reviewState ? `${p.reviewState}${p.reviewDecision ? ` (${p.reviewDecision})` : ''}` : '—'}
              </TableCell>
              <TableCell>{p.notes ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
