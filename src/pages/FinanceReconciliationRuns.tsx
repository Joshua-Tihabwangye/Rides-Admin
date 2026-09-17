import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
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
import {
  listAdminReconciliationRuns,
  startAdminReconciliationRun,
  listAdminReconciliationRecords,
  resolveAdminReconciliationRecord,
  listAdminReconciliationProviders,
  type AdminReconciliationRun,
  type AdminReconciliationRecord,
} from '../services/api/adminApi';

const statusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'COMPLETED':
    case 'RESOLVED':
    case 'MATCHED':
      return 'success';
    case 'FAILED':
    case 'VARIANCE':
      return 'error';
    case 'RUNNING':
      return 'info';
    case 'OPEN':
      return 'warning';
    default:
      return 'default';
  }
};

const RUN_TYPES = ['PAYMENTS', 'PAYOUTS', 'CORPORATEPAY'];
const RUN_STATUSES = ['OPEN', 'RUNNING', 'COMPLETED', 'FAILED'];
const RECORD_STATUSES = ['OPEN', 'MATCHED', 'VARIANCE', 'RESOLVED', 'IGNORED'];

export default function FinanceReconciliationRunsPage() {
  const [runs, setRuns] = useState<AdminReconciliationRun[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('PAYMENTS');
  const [provider, setProvider] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [tolerance, setTolerance] = useState('0.01');
  const [submitting, setSubmitting] = useState(false);
  const [runTypeFilter, setRunTypeFilter] = useState('');
  const [runStatusFilter, setRunStatusFilter] = useState('');
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [records, setRecords] = useState<AdminReconciliationRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordStatusFilter, setRecordStatusFilter] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AdminReconciliationRecord | null>(null);
  const [recordStatus, setRecordStatus] = useState('RESOLVED');
  const [recordResolution, setRecordResolution] = useState('');
  const [resolving, setResolving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [runsRes, providersRes] = await Promise.all([
        listAdminReconciliationRuns({
          type: runTypeFilter || undefined,
          status: runStatusFilter || undefined,
        }),
        listAdminReconciliationProviders(),
      ]);
      setRuns(runsRes);
      setProviders(providersRes.providers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reconciliation runs');
    } finally {
      setLoading(false);
    }
  }, [runStatusFilter, runTypeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadRecords = useCallback(async (runId: string) => {
    setRecordsLoading(true);
    setError(null);
    try {
      const res = await listAdminReconciliationRecords(runId, {
        status: recordStatusFilter || undefined,
      });
      setRecords(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records');
    } finally {
      setRecordsLoading(false);
    }
  }, [recordStatusFilter]);

  useEffect(() => {
    if (expandedRunId) void loadRecords(expandedRunId);
  }, [expandedRunId, loadRecords]);

  const handleStart = async () => {
    const parsedTolerance = Number(tolerance);
    if (!periodStart || !periodEnd) {
      setError('Select a period start and period end before starting reconciliation.');
      return;
    }
    if (new Date(periodStart) > new Date(periodEnd)) {
      setError('Period start must be before period end.');
      return;
    }
    if (!Number.isFinite(parsedTolerance) || parsedTolerance < 0) {
      setError('Tolerance must be a valid non-negative number.');
      return;
    }
    setSubmitting(true);
    try {
      await startAdminReconciliationRun({
        type,
        periodStart,
        periodEnd,
        provider: provider || undefined,
        tolerance: parsedTolerance,
      });
      setOpen(false);
      setPeriodStart('');
      setPeriodEnd('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Start run failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRecords = (runId: string) => {
    if (expandedRunId === runId) {
      setExpandedRunId(null);
      setRecords([]);
      return;
    }
    setExpandedRunId(runId);
  };

  const handleResolve = async () => {
    if (!selectedRecord || !expandedRunId) return;
    setResolving(true);
    try {
      await resolveAdminReconciliationRecord(expandedRunId, selectedRecord.id, { status: recordStatus, resolution: recordResolution });
      setSelectedRecord(null);
      setRecordResolution('');
      await loadRecords(expandedRunId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resolve failed');
    } finally {
      setResolving(false);
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
            Reconciliation Runs
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Start and review payment/payout reconciliation runs.
          </Typography>
        </Box>
        <Box className="flex gap-2">
          <Select value={runTypeFilter} displayEmpty size="small" onChange={(e) => setRunTypeFilter(e.target.value)} sx={{ minWidth: 150 }}>
            <MenuItem value=""><em>All types</em></MenuItem>
            {RUN_TYPES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </Select>
          <Select value={runStatusFilter} displayEmpty size="small" onChange={(e) => setRunStatusFilter(e.target.value)} sx={{ minWidth: 150 }}>
            <MenuItem value=""><em>All statuses</em></MenuItem>
            {RUN_STATUSES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </Select>
          <Button variant="outlined" size="small" onClick={() => void load()} sx={{ textTransform: 'none' }}>
            Refresh
          </Button>
          <Button variant="contained" size="small" onClick={() => setOpen(true)} sx={{ textTransform: 'none', bgcolor: '#03cd8c' }}>
            Start run
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box className="flex flex-col gap-3">
        {runs.map((run) => (
          <Card key={run.id} elevation={1} sx={{ borderRadius: 2, border: '1px solid rgba(148,163,184,0.3)' }}>
            <CardContent className="p-3">
              <Box className="flex items-center justify-between gap-2 flex-wrap">
                <Box>
                  <Typography variant="subtitle2" className="font-semibold">{run.type} run</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {run.periodStart ? new Date(run.periodStart).toLocaleDateString() : '-'} → {run.periodEnd ? new Date(run.periodEnd).toLocaleDateString() : '-'} · {run.id}
                  </Typography>
                </Box>
                <Box className="flex items-center gap-2">
                  <Chip size="small" label={run.status} color={statusColor(run.status) as any} sx={{ fontSize: 11 }} />
                  <Button size="small" variant="outlined" sx={{ textTransform: 'none', borderRadius: 999, fontSize: 12 }} onClick={() => toggleRecords(run.id)}>
                    {expandedRunId === run.id ? 'Hide records' : 'Records'}
                  </Button>
                </Box>
              </Box>

              <Collapse in={expandedRunId === run.id}>
                <Box className="pt-3">
                  <Box className="pb-2 flex items-center justify-between gap-2 flex-wrap">
                    <Typography variant="caption" color="text.secondary">
                      Backend records for this run
                    </Typography>
                    <Select value={recordStatusFilter} displayEmpty size="small" onChange={(e) => setRecordStatusFilter(e.target.value)} sx={{ minWidth: 160 }}>
                      <MenuItem value=""><em>All record statuses</em></MenuItem>
                      {RECORD_STATUSES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                    </Select>
                  </Box>
                  {recordsLoading ? <CircularProgress size={20} /> : (
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: 'action.hover' }}>
                            <TableCell>Record</TableCell>
                            <TableCell>Internal</TableCell>
                            <TableCell>Expected</TableCell>
                            <TableCell>Settled</TableCell>
                            <TableCell>Variance</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {records.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                                No records.
                              </TableCell>
                            </TableRow>
                          )}
                          {records.map((rec) => (
                            <TableRow key={rec.id}>
                              <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12 }}>{rec.id}</TableCell>
                              <TableCell sx={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12 }}>{rec.internalRecordType} {rec.internalRecordId}</TableCell>
                              <TableCell>{rec.expectedAmount?.toLocaleString()}</TableCell>
                              <TableCell>{rec.settledAmount?.toLocaleString()}</TableCell>
                              <TableCell>{rec.variance?.toLocaleString()}</TableCell>
                              <TableCell>
                                <Chip size="small" label={rec.status} color={statusColor(rec.status) as any} sx={{ fontSize: 11 }} />
                              </TableCell>
                              <TableCell align="right">
                                {rec.status !== 'RESOLVED' && rec.status !== 'IGNORED' && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    sx={{ textTransform: 'none', borderRadius: 999, fontSize: 12 }}
                                    onClick={() => { setSelectedRecord(rec); setRecordStatus('RESOLVED'); setRecordResolution(''); }}
                                  >
                                    Resolve
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        ))}

        {runs.length === 0 && (
          <Alert severity="info">No reconciliation runs yet.</Alert>
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Start reconciliation run</DialogTitle>
        <DialogContent className="flex flex-col gap-3">
          <TextField label="Type" value={type} onChange={(e) => setType(e.target.value)} fullWidth size="small" helperText="PAYMENTS, PAYOUTS or CORPORATEPAY" />
          <Select value={provider} displayEmpty fullWidth size="small" onChange={(e) => setProvider(e.target.value)}>
            <MenuItem value=""><em>All providers</em></MenuItem>
            {providers.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </Select>
          <TextField label="Period start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          <TextField label="Period end" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          <TextField label="Tolerance" type="number" value={tolerance} onChange={(e) => setTolerance(e.target.value)} fullWidth size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} size="small" sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={() => void handleStart()} variant="contained" size="small" disabled={submitting || !periodStart || !periodEnd} sx={{ textTransform: 'none', bgcolor: '#03cd8c' }}>
            {submitting ? 'Starting...' : 'Start'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!selectedRecord} onClose={() => setSelectedRecord(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Resolve record</DialogTitle>
        <DialogContent className="flex flex-col gap-3">
          <Typography variant="body2">Variance: {selectedRecord?.variance?.toLocaleString()}</Typography>
          <Select value={recordStatus} fullWidth size="small" onChange={(e) => setRecordStatus(e.target.value)}>
            <MenuItem value="RESOLVED">Resolved</MenuItem>
            <MenuItem value="IGNORED">Ignored</MenuItem>
          </Select>
          <TextField label="Resolution note" value={recordResolution} onChange={(e) => setRecordResolution(e.target.value)} fullWidth size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRecord(null)} size="small" sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={() => void handleResolve()} variant="contained" size="small" disabled={resolving} sx={{ textTransform: 'none', bgcolor: '#03cd8c' }}>
            {resolving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
