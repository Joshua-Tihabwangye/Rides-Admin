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
import { listAdminWalletReconciliations, createAdminWalletReconciliation, type AdminWalletReconciliation } from '../services/api/adminApi';

const statusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'failed':
      return 'error';
    case 'running':
      return 'info';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
};

export default function FinanceWalletReconciliationPage() {
  const [items, setItems] = useState<AdminWalletReconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [type, setType] = useState('PAYMENTS');
  const [currency, setCurrency] = useState('UGX');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAdminWalletReconciliations({ limit: 100 });
      setItems(res.items || []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load wallet reconciliations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await createAdminWalletReconciliation({ periodStart, periodEnd, type, currency });
      setOpen(false);
      setPeriodStart('');
      setPeriodEnd('');
      await load();
    } catch (err: any) {
      setError(err?.message ?? 'Create failed');
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
            Wallet Reconciliation
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Reconcile wallet movements for a given period.
          </Typography>
        </Box>
        <Box className="flex gap-2">
          <Button variant="outlined" size="small" onClick={load} sx={{ textTransform: 'none' }}>
            Refresh
          </Button>
          <Button variant="contained" size="small" onClick={() => setOpen(true)} sx={{ textTransform: 'none', bgcolor: '#03cd8c' }}>
            New reconciliation
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card elevation={1} sx={{ borderRadius: 2, border: '1px solid rgba(148,163,184,0.3)' }}>
        <CardContent className="p-0">
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell>ID</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Currency</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No wallet reconciliations found.
                    </TableCell>
                  </TableRow>
                )}
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12 }}>{item.id}</TableCell>
                    <TableCell>{item.periodStart ? new Date(item.periodStart).toLocaleDateString() : '-'} → {item.periodEnd ? new Date(item.periodEnd).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.currency}</TableCell>
                    <TableCell>
                      <Chip size="small" label={item.status} color={statusColor(item.status) as any} sx={{ fontSize: 11 }} />
                    </TableCell>
                    <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New wallet reconciliation</DialogTitle>
        <DialogContent className="flex flex-col gap-3">
          <TextField label="Period start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          <TextField label="Period end" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          <TextField label="Type" value={type} onChange={(e) => setType(e.target.value)} fullWidth size="small" helperText="PAYMENTS, PAYOUTS or CORPORATEPAY" />
          <TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} fullWidth size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} size="small" sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" size="small" disabled={submitting || !periodStart || !periodEnd} sx={{ textTransform: 'none', bgcolor: '#03cd8c' }}>
            {submitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
