import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
} from '@mui/material';
import { listAdminPayouts, retryAdminPayout, type AdminPayout } from '../services/api/adminApi';

const statusColor = (status: string) => {
  switch (status) {
    case 'completed':
    case 'success':
      return 'success';
    case 'failed':
      return 'error';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
};

export default function FinancePayoutsPage() {
  const [items, setItems] = useState<AdminPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAdminPayouts({ limit: 100 });
      setItems(res.items || []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      await retryAdminPayout(id);
      await load();
    } catch (err: any) {
      setError(err?.message ?? 'Retry failed');
    } finally {
      setRetryingId(null);
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
            Payouts
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Monitor and retry company and driver payouts.
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
                  <TableCell>Recipient</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No payouts found.
                    </TableCell>
                  </TableRow>
                )}
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12 }}>{item.id}</TableCell>
                    <TableCell sx={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.recipientId}</TableCell>
                    <TableCell>{item.currency} {item.amount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip size="small" label={item.status} color={statusColor(item.status) as any} sx={{ fontSize: 11 }} />
                    </TableCell>
                    <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'none', borderRadius: 999, fontSize: 12 }}
                        disabled={retryingId === item.id}
                        onClick={() => handleRetry(item.id)}
                      >
                        {retryingId === item.id ? 'Retrying...' : 'Retry'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
