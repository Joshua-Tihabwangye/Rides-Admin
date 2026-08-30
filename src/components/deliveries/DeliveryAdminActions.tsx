import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import GppGoodIcon from '@mui/icons-material/GppGood';
import {
  adminCancelDelivery,
  adminForceDeliveryStatus,
  adminReassignDelivery,
  listAdminDrivers,
} from '../../services/api/adminApi';
import type { AdminDriverResponse } from '../../services/api/adminApi';
import { getAuthUser } from '../../auth/auth';
import { hasAnyPermission } from '../../auth/permissions';

const FORCE_STATUS_OPTIONS = [
  'CREATED',
  'READY',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'RETURNED',
];

type DialogKind = 'none' | 'force' | 'reassign' | 'cancel';

export default function DeliveryAdminActions({
  orderId,
  currentStatus,
  onChanged,
}: {
  orderId?: string;
  currentStatus?: string;
  onChanged?: () => void;
}) {
  const canManage = (() => {
    const user = getAuthUser();
    return user ? hasAnyPermission(user, ['manage_deliveries']) : false;
  })();

  const [dialog, setDialog] = useState<DialogKind>('none');
  const [reason, setReason] = useState('');
  const [targetStatus, setTargetStatus] = useState('');
  const [newDriverId, setNewDriverId] = useState('');
  const [drivers, setDrivers] = useState<AdminDriverResponse[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!canManage || !orderId) return null;

  const openDialog = async (kind: Exclude<DialogKind, 'none'>) => {
    setError(null);
    setReason('');
    setTargetStatus('');
    setNewDriverId('');
    if (kind === 'reassign') {
      try {
        setDrivers(await listAdminDrivers());
      } catch {
        setDrivers([]);
      }
    }
    setDialog(kind);
  };

  const close = () => setDialog('none');

  const run = async (fn: () => Promise<unknown>, okMessage: string) => {
    if (!reason.trim()) {
      setError('A reason is required for this administrative action.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await fn();
      setSuccess(okMessage);
      close();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 2, borderColor: 'warning.main' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <GppGoodIcon color="warning" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Admin Actions
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Authorized delivery control commands. Every action is audited by the backend and requires a reason.
          Current status: {currentStatus ?? '—'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
          <Button size="small" variant="outlined" onClick={() => openDialog('force')}>
            Force / reconcile status
          </Button>
          <Button size="small" variant="outlined" onClick={() => openDialog('reassign')}>
            Reassign driver
          </Button>
          <Button size="small" variant="outlined" color="error" onClick={() => openDialog('cancel')}>
            Cancel delivery
          </Button>
        </Box>
      </CardContent>

      <Dialog open={dialog === 'force'} onClose={close} maxWidth="xs" fullWidth>
        <DialogTitle>Force / reconcile status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel id="force-status-label">Target status</InputLabel>
            <Select
              labelId="force-status-label"
              label="Target status"
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
            >
              {FORCE_STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="dense"
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button
            disabled={busy || !targetStatus}
            variant="contained"
            onClick={() => run(() => adminForceDeliveryStatus(orderId, targetStatus, reason), 'Status updated')}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'reassign'} onClose={close} maxWidth="xs" fullWidth>
        <DialogTitle>Reassign driver</DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel id="reassign-driver-label">New driver</InputLabel>
            <Select
              labelId="reassign-driver-label"
              label="New driver"
              value={newDriverId}
              onChange={(e) => setNewDriverId(e.target.value)}
            >
              {drivers.map((d) => (
                <MenuItem key={d.driverId} value={d.driverId}>
                  {d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.driverId.slice(0, 8)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="dense"
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button
            disabled={busy || !newDriverId}
            variant="contained"
            onClick={() => run(() => adminReassignDelivery(orderId, newDriverId, reason), 'Driver reassigned')}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'cancel'} onClose={close} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel delivery</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            This cancels the delivery order on the backend (audit + financial consequence handled server-side).
          </Typography>
          <TextField
            fullWidth
            margin="dense"
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button
            disabled={busy}
            variant="contained"
            color="error"
            onClick={() => run(() => adminCancelDelivery(orderId, reason), 'Delivery cancelled')}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(error)} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
      <Snackbar open={Boolean(success)} autoHideDuration={4000} onClose={() => setSuccess(null)}>
        <Alert severity="success" variant="filled">
          {success}
        </Alert>
      </Snackbar>
    </Card>
  );
}
