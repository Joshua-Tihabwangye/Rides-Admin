import React, { useEffect, useState } from 'react';
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
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import { listAdminPayments, refundAdminPayment, type AdminPayment } from '../services/api/adminApi';

const statusColor = (status: string) => {
  switch (status) {
    case 'paid':
    case 'completed':
      return 'success';
    case 'failed':
    case 'refunded':
      return 'error';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
};

export default function FinancePaymentsPage() {
  const [items, setItems] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminPayment | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAdminPayments({ limit: 100 });
      setItems(res.items || []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleRefund = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await refundAdminPayment(selected.id, {
        amount: amount ? Number(amount) : undefined,
        reason,
        idempotencyKey: `refund-${selected.id}-${Date.now()}`,
      });
      setSelected(null);
      setAmount('');
      setReason('');
      await load();
    } catch (err: any) {
      setError(err?.message ?? 'Refund failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Payments
          </Typography>
          <Typography variant="caption" color="text.secondary">
            View payments and issue refunds.
          </Typography>
        </Box>
        <Button variant="outlined" size="small" onClick={load} sx={{ textTransform: 'none' }}>
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card elevation={1} sx={{ borderRadius: 2, border: '1px solid rgba(148,163,184,0.3)' }}>
        <CardContent className="p-0">
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell>ID</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No payments found.
                    </TableCell>
                  </TableRow>
                )}
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12 }}>{item.id}</TableCell>
                    <TableCell sx={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.userId}</TableCell>
                    <TableCell>{item.currency} {item.amount?.toLocaleString()}</TableCell>
                    <TableCell>{item.method}</TableCell>
                    <TableCell>
                      <Chip size="small" label={item.status} color={statusColor(item.status) as any} sx={{ fontSize: 11 }} />
                    </TableCell>
                    <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'none', borderRadius: 999, fontSize: 12 }}
                        onClick={() => {
                          setSelected(item);
                          setAmount('');
                          setReason('');
                        }}
                      >
                        Refund
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Refund payment</DialogTitle>
        <DialogContent className="flex flex-col gap-3">
          <Typography variant="body2">
            {selected ? `${selected.currency} ${selected.amount?.toLocaleString()} (leave amount blank for full refund)` : ''}
          </Typography>
          <TextField label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} fullWidth size="small" />
          <TextField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} fullWidth size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)} size="small" sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleRefund} variant="contained" size="small" disabled={submitting} sx={{ textTransform: 'none', bgcolor: '#03cd8c' }}>
            {submitting ? 'Processing...' : 'Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
