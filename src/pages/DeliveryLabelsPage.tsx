import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
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
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import {
  bulkExportAdminLabels,
  downloadAdminLabelAsset,
  listAdminDeliveryLabels,
  recordAdminLabelPrintEvent,
} from '../services/api/adminApi';
import { getAuthUser } from '../auth/auth';
import { hasAnyPermission } from '../auth/permissions';
import type { AdminPermission } from '../auth/permissions';
import type {
  AdminLabelExportEntry,
  AdminLabelRegistryResponse,
  ListAdminLabelsFilters,
} from '../services/api/adminApi';

function hasAny(permissions: AdminPermission[]) {
  const user = getAuthUser();
  if (!user) return false;
  return hasAnyPermission(user, permissions);
}

const LABEL_STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CONSUMED', label: 'Consumed' },
];

function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function labelStatusColor(status: string): 'success' | 'error' | 'warning' | 'default' | 'info' {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return 'success';
    case 'CANCELLED':
      return 'error';
    case 'EXPIRED':
      return 'warning';
    case 'CONSUMED':
      return 'info';
    default:
      return 'default';
  }
}

export default function DeliveryLabelsPage() {
  const navigate = useNavigate();
  const canPrint = hasAny(['print_delivery_labels']);

  const [labels, setLabels] = useState<AdminLabelRegistryResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListAdminLabelsFilters>({
    page: 1,
    limit: 20,
    status: '',
    fromDate: '',
    toDate: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchManifest, setBatchManifest] = useState<AdminLabelExportEntry[] | null>(null);
  const [bulkExporting, setBulkExporting] = useState(false);

  const fetchLabels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listAdminDeliveryLabels({
        page: filters.page,
        limit: filters.limit,
        status: filters.status || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        search: searchInput || undefined,
      });
      setLabels(response.items ?? []);
      setTotal(response.meta?.total ?? response.items?.length ?? 0);
      setSelectedIds(new Set());
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load labels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.status, filters.fromDate, filters.toDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, limit: parseInt(event.target.value, 10), page: 1 }));
  };

  const handleDownloadPdf = async (label: AdminLabelRegistryResponse) => {
    try {
      const asset = await downloadAdminLabelAsset(label.id, 'pdf');
      window.open(asset.downloadUrl, '_blank');
    } catch {
      setError('Failed to prepare the PDF download.');
    }
  };

  const handlePrint = async (label: AdminLabelRegistryResponse) => {
    try {
      await recordAdminLabelPrintEvent(label.id, 'admin-portal');
      const asset = await downloadAdminLabelAsset(label.id, 'pdf');
      window.open(asset.downloadUrl, '_blank');
    } catch {
      setError('Failed to print this label.');
    }
  };

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
    setBulkExporting(true);
    setError(null);
    try {
      const result = await bulkExportAdminLabels(
        [...selectedIds],
        'admin-bulk-print'
      );
      setBatchManifest(result.labels ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Bulk export failed');
    } finally {
      setBulkExporting(false);
    }
  };

  const selectedPackageIds = useMemo(() => {
    return new Set(
      labels
        .filter((label) => selectedIds.has(label.package?.id ?? ''))
        .map((label) => label.package?.id)
        .filter((id): id is string => Boolean(id))
    );
  }, [labels, selectedIds]);

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
            Delivery Labels
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Every label version across packages — allocate labels to products, download, and print in bulk.
          </Typography>
        </Box>
        {canPrint && (
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            disabled={selectedPackageIds.size === 0 || bulkExporting}
            onClick={handleMassPrint}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Mass print ({selectedPackageIds.size})
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              size="small"
              label="Search tracking / package"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
              sx={{ flex: 2 }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={filters.status}
                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value, page: 1 }))}
              >
                {LABEL_STATUSES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              type="date"
              label="From (issued)"
              InputLabelProps={{ shrink: true }}
              value={filters.fromDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, fromDate: event.target.value, page: 1 }))}
            />
            <TextField
              size="small"
              type="date"
              label="To (issued)"
              InputLabelProps={{ shrink: true }}
              value={filters.toDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, toDate: event.target.value, page: 1 }))}
            />
          </Stack>
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
              <TableCell>Issued</TableCell>
              <TableCell>Printed</TableCell>
              <TableCell>Attached</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {labels.map((label) => {
              const packageId = label.package?.id ?? '';
              return (
                <TableRow key={label.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      disabled={!canPrint || !packageId}
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
                    {label.package && label.package.attributes && label.package.attributes.length > 0 ? (
                      <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {label.package.attributes.slice(0, 4).map((attribute) => (
                          <Chip key={attribute.key} size="small" variant="outlined" label={`${attribute.label}: ${attribute.value ?? ''}`} sx={{ fontSize: 10 }} />
                        ))}
                      </Box>
                    ) : null}
                  </TableCell>
                  <TableCell>v{label.version}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={labelStatusColor(label.status)}
                      label={String(label.status ?? 'unknown').toUpperCase()}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{formatDate(label.issuedAt || label.generatedAt)}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>
                    {label.printCount ? `${label.printCount}×` : '—'}
                    {label.printedAt ? ` · ${formatDate(label.printedAt)}` : ''}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{label.attachedAt ? formatDate(label.attachedAt) : '—'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      title="Open label page"
                      onClick={() => navigate(`/admin/delivery-packages/${packageId}/label`)}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      title="Download PDF"
                      onClick={() => void handleDownloadPdf(label)}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                    {canPrint && (
                      <IconButton size="small" title="Print label" onClick={() => void handlePrint(label)}>
                        <PrintIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {labels.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No labels match the current filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={(filters.page ?? 1) - 1}
        onPageChange={handleChangePage}
        rowsPerPage={filters.limit ?? 20}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 20, 50, 100]}
      />

      <Dialog open={batchManifest !== null} onClose={() => setBatchManifest(null)} maxWidth="md" fullWidth>
        <DialogTitle>Bulk print manifest</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {batchManifest?.length ?? 0} labels exported. Print events have been recorded for each label.
          </Typography>
          <Stack spacing={1}>
            {(batchManifest ?? []).map((entry) => (
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
          <Button onClick={() => setBatchManifest(null)} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
