import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Link, Paper, Stack, Typography } from '@mui/material';
import {
  Alert,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { useNavigate } from 'react-router-dom';
import {
  bulkExportAdminLabels,
  listAdminDeliveryLabels,
} from '../services/api/adminApi';
import type { AdminLabelExportEntry, AdminLabelRegistryResponse } from '../services/api/adminApi';

function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export default function PrintQueuePage() {
  const navigate = useNavigate();
  const [labels, setLabels] = useState<AdminLabelRegistryResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [manifest, setManifest] = useState<AdminLabelExportEntry[] | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listAdminDeliveryLabels({ page, limit, status: 'ACTIVE' });
      setLabels(response.items ?? []);
      setTotal(response.meta?.total ?? response.items?.length ?? 0);
      setSelectedIds(new Set());
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load the print queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const toggleSelected = (packageId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(packageId)) {
        next.delete(packageId);
      } else {
        next.add(packageId);
      }
      return next;
    });
  };

  const handleMassPrint = async () => {
    if (selectedIds.size === 0) return;
    setExporting(true);
    setError(null);
    try {
      const result = await bulkExportAdminLabels([...selectedIds], 'admin-print-queue');
      setManifest(result.labels ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Bulk print failed');
    } finally {
      setExporting(false);
    }
  };

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
            Print Queue
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Active labels ready to print. Select one or more and run a mass print to export their PDFs.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          disabled={selectedIds.size === 0 || exporting}
          onClick={handleMassPrint}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Mass print ({selectedIds.size})
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            size="small"
            placeholder="Print queue shows all active labels across deliveries — use the Labels page for filters and search."
            disabled
            fullWidth
          />
        </CardContent>
      </Card>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedIds.size > 0 && selectedIds.size < labels.length}
                  checked={labels.length > 0 && selectedIds.size === labels.length}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setSelectedIds(new Set(labels.map((label) => label.package?.id).filter((id): id is string => Boolean(id))));
                    } else {
                      setSelectedIds(new Set());
                    }
                  }}
                />
              </TableCell>
              <TableCell>Tracking code</TableCell>
              <TableCell>Package</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Printed</TableCell>
              <TableCell>Issued</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {labels.map((label) => {
              const packageId = label.package?.id ?? '';
              return (
                <TableRow key={label.id} hover onClick={() => packageId && navigate(`/admin/delivery-packages/${packageId}/label`)} sx={{ cursor: 'pointer' }}>
                  <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      checked={Boolean(packageId && selectedIds.has(packageId))}
                      onChange={() => packageId && toggleSelected(packageId)}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {label.delivery?.trackingCode || label.delivery?.id || '—'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {label.package?.packageName || 'Unnamed package'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {label.package?.packageIdentifier || label.package?.id || ''}
                      {label.package?.packageNumber ? ` · ${label.package.packageNumber}/${label.package.totalPackages ?? '?'}` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>v{label.version}</TableCell>
                  <TableCell>
                    <Chip size="small" color="success" label="ACTIVE" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>
                    {label.printCount ? `${label.printCount}× · ${formatDate(label.printedAt)}` : 'Not printed'}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{formatDate(label.issuedAt || label.generatedAt)}</TableCell>
                </TableRow>
              );
            })}
            {labels.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No active labels in the print queue.
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

      <Dialog open={manifest !== null} onClose={() => setManifest(null)} maxWidth="md" fullWidth>
        <DialogTitle>Mass print exported</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {manifest?.length ?? 0} label PDFs generated. A print event was recorded for each label.
          </Typography>
          <Stack spacing={1}>
            {(manifest ?? []).map((entry) => (
              <Paper key={entry.labelId} variant="outlined" sx={{ p: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {entry.trackingCode ? `${entry.trackingCode} · ` : ''}
                      {entry.packageName || 'Unnamed package'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {entry.packageIdentifier || entry.packageId}
                      {entry.packageNumber ? ` · package ${entry.packageNumber}` : ''}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    {entry.downloadUrl ? (
                      <Link href={entry.downloadUrl} target="_blank" rel="noreferrer" underline="hover">
                        Open PDF
                      </Link>
                    ) : null}
                    {entry.qrDownloadUrl ? (
                      <Link href={entry.qrDownloadUrl} target="_blank" rel="noreferrer" underline="hover">
                        QR
                      </Link>
                    ) : null}
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManifest(null)} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
