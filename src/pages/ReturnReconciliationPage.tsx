import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  listAdminReturnReconciliation,
  type AdminReturnReconciliationView,
} from '../services/api/adminApi';

function ReconChip({ ok }: { ok: boolean }) {
  return <Chip size="small" label={ok ? 'OK' : 'Mismatch'} color={ok ? 'success' : 'error'} sx={{ borderRadius: 2 }} />;
}

export default function ReturnReconciliationPage() {
  const [rows, setRows] = useState<AdminReturnReconciliationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listAdminReturnReconciliation());
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load return reconciliation');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const mismatches = rows.filter((r) => !r.refundWithinEligible || !r.paymentReconciled || !r.inventoryReconciled).length;

  if (loading && rows.length === 0) {
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
            Return reconciliation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Refund bounds, payment linkage, and inventory restock consistency per return (DLV-192).
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => {
            setRefreshing(true);
            fetchRows();
          }}
          disabled={refreshing}
          sx={{ textTransform: 'none', borderRadius: 999 }}
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip size="small" label={`Total: ${rows.length}`} color="primary" sx={{ borderRadius: 2 }} />
        <Chip
          size="small"
          label={`Mismatches: ${mismatches}`}
          color={mismatches > 0 ? 'error' : 'success'}
          sx={{ borderRadius: 2 }}
        />
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Return code</TableCell>
                <TableCell>Order</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Eligible captured</TableCell>
                <TableCell align="right">Refunded</TableCell>
                <TableCell align="right">Refund bound</TableCell>
                <TableCell align="right">Payment</TableCell>
                <TableCell align="right">Inventory</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.returnShipmentId} hover>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>
                    {row.returnShipmentCode}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{row.orderId}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{row.status}</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12 }}>
                    {(row.eligibleCapturedCents / 100).toFixed(2)} UGX
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: 12 }}>
                    {row.refundedCents != null ? `${(row.refundedCents / 100).toFixed(2)} UGX` : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <ReconChip ok={row.refundWithinEligible} />
                  </TableCell>
                  <TableCell align="right">
                    <ReconChip ok={row.paymentReconciled} />
                  </TableCell>
                  <TableCell align="right">
                    <ReconChip ok={row.inventoryReconciled} />
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No return shipments to reconcile.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
