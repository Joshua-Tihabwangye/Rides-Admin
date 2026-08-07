import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import Paper from '@mui/material/Paper';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import { listAdminDeliveryLabels } from '../services/api/adminApi';
import type { AdminLabelRegistryResponse } from '../services/api/adminApi';

function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export default function LabelExceptionsPage() {
  const navigate = useNavigate();
  const [labels, setLabels] = useState<AdminLabelRegistryResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<'CANCELLED' | 'EXPIRED'>('CANCELLED');

  const fetchExceptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listAdminDeliveryLabels({ page, limit, status });
      setLabels(response.items ?? []);
      setTotal(response.meta?.total ?? response.items?.length ?? 0);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load label exceptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status]);

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage + 1);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(1);
  };

  if (loading && labels.length === 0) {
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
            Label Exceptions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cancelled and expired labels with their replacement lineage for auditing.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchExceptions} sx={{ textTransform: 'none', borderRadius: 2 }}>
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              select
              size="small"
              label="Exception type"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as 'CANCELLED' | 'EXPIRED');
                setPage(1);
              }}
              sx={{ minWidth: 200 }}
            >
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </TextField>
            <Typography variant="body2" color="text.secondary">
              Regenerated labels are cancelled with a reference to the replacement version.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tracking code</TableCell>
              <TableCell>Package</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Issued</TableCell>
              <TableCell>Cancelled / expired</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Replaced by</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {labels.map((label) => {
              const packageId = label.package?.id ?? '';
              return (
                <TableRow key={label.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {label.delivery?.trackingCode || label.delivery?.id || '—'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {label.package?.packageName || 'Unnamed package'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {label.package?.packageIdentifier || label.package?.id || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>v{label.version}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={status === 'CANCELLED' ? 'error' : 'warning'}
                      label={String(label.status ?? status).toUpperCase()}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{formatDate(label.issuedAt || label.generatedAt)}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{formatDate(label.cancelledAt || label.revokedAt)}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{label.cancellationReason || label.revokeReason || '—'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                    {label.replacedByVersionId ? label.replacedByVersionId.slice(0, 8) : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      disabled={!packageId}
                      onClick={() => packageId && navigate(`/admin/delivery-packages/${packageId}/label`)}
                      sx={{ textTransform: 'none' }}
                    >
                      Open package
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {labels.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No {status.toLowerCase()} labels found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page - 1}
        onPageChange={handleChangePage}
        rowsPerPage={limit}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 20, 50, 100]}
      />
    </Box>
  );
}
