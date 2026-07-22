import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LabelIcon from '@mui/icons-material/Label';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PreviewIcon from '@mui/icons-material/Preview';
import {
  getAdminPackageLabels,
  downloadAdminLabelAsset,
  recordAdminLabelPrintEvent,
  regenerateAdminPackageLabel,
  markAdminLabelAttached,
} from '../services/api/adminApi';
import type { AdminDeliveryLabelResponse } from '../services/api/adminApi';
import { getAuthUser } from '../auth/auth';
import { hasAnyPermission } from '../auth/permissions';
import type { AdminPermission } from '../auth/permissions';

function hasAny(permissions: AdminPermission[]) {
  const user = getAuthUser();
  if (!user) return false;
  return hasAnyPermission(user, permissions);
}

function openSignedUrl(url: string) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function LabelHistory({ labels }: { labels: AdminDeliveryLabelResponse[] }) {
  if (labels.length === 0) {
    return <Typography color="text.secondary">No label history yet.</Typography>;
  }

  const sorted = [...labels].sort(
    (a, b) => new Date(b.generatedAt || 0).getTime() - new Date(a.generatedAt || 0).getTime()
  );

  return (
    <List dense>
      {sorted.map((label) => (
        <ListItem key={label.id} sx={{ px: 0, flexDirection: 'column', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <LabelIcon fontSize="small" color={label.status === 'active' ? 'success' : 'action'} />
            <Typography variant="body2" fontWeight={600}>
              Version {label.version}
            </Typography>
            <Chip size="small" label={label.status} sx={{ height: 20, fontSize: 10 }} />
            <Chip size="small" label={label.format.toUpperCase()} sx={{ height: 20, fontSize: 10 }} />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ pl: 4 }}>
            Generated: {label.generatedAt ? new Date(label.generatedAt).toLocaleString() : 'N/A'}
            {label.revokedAt && ` · Revoked: ${new Date(label.revokedAt).toLocaleString()}`}
            {label.revokeReason && ` · Reason: ${label.revokeReason}`}
          </Typography>
          <Divider sx={{ width: '100%', my: 1 }} />
        </ListItem>
      ))}
    </List>
  );
}

export default function PackageLabelPage() {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const [labels, setLabels] = useState<AdminDeliveryLabelResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [regenerateReason, setRegenerateReason] = useState('');
  const [regenerateNote, setRegenerateNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string; open: boolean }>({ message: '', open: false });

  const activeLabel = labels.find((l) => l.status === 'active');

  const fetchLabels = async () => {
    if (!packageId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminPackageLabels(packageId);
      setLabels(data.items);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load labels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId]);

  const handleDownload = async (format: 'pdf' | 'png') => {
    if (!activeLabel) return;
    try {
      const asset = await downloadAdminLabelAsset(activeLabel.id, format);
      openSignedUrl(asset.downloadUrl);
    } catch (e: any) {
      setSnackbar({ message: `Download failed: ${e?.message ?? 'Unknown error'}`, open: true });
    }
  };

  const handlePreview = async () => {
    if (!activeLabel) return;
    try {
      const asset = await downloadAdminLabelAsset(activeLabel.id, activeLabel.format === 'png' ? 'png' : 'pdf');
      openSignedUrl(asset.downloadUrl);
    } catch (e: any) {
      setSnackbar({ message: `Preview failed: ${e?.message ?? 'Unknown error'}`, open: true });
    }
  };

  const handlePrint = async () => {
    if (!activeLabel) return;
    setActionLoading(true);
    try {
      const user = getAuthUser();
      await recordAdminLabelPrintEvent(activeLabel.id, 'admin-portal');
      const asset = await downloadAdminLabelAsset(activeLabel.id, activeLabel.format === 'png' ? 'png' : 'pdf');
      openSignedUrl(asset.downloadUrl);
      setSnackbar({ message: 'Print event recorded and download opened.', open: true });
    } catch (e: any) {
      setSnackbar({ message: `Print failed: ${e?.message ?? 'Unknown error'}`, open: true });
    } finally {
      setActionLoading(false);
    }
  };

  const openRegenerateDialog = () => {
    setRegenerateReason('');
    setRegenerateNote('');
    setRegenerateDialogOpen(true);
  };

  const handleRegenerate = async () => {
    if (!packageId || !regenerateReason.trim()) return;
    setActionLoading(true);
    try {
      await regenerateAdminPackageLabel(packageId, regenerateReason.trim(), regenerateNote.trim() || undefined);
      setRegenerateDialogOpen(false);
      setSnackbar({ message: 'Label regenerated successfully.', open: true });
      await fetchLabels();
    } catch (e: any) {
      setSnackbar({ message: `Regenerate failed: ${e?.message ?? 'Unknown error'}`, open: true });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAttached = async () => {
    if (!packageId) return;
    setActionLoading(true);
    try {
      await markAdminLabelAttached(packageId, undefined, 'admin-portal');
      setSnackbar({ message: 'Label marked as attached.', open: true });
    } catch (e: any) {
      setSnackbar({ message: `Mark attached failed: ${e?.message ?? 'Unknown error'}`, open: true });
    } finally {
      setActionLoading(false);
    }
  };

  const canRegenerate = hasAny(['regenerate_delivery_labels']);
  const canPrint = hasAny(['print_delivery_labels']);

  if (!packageId) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>
            Package Labels
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a package from a delivery to view, print, or regenerate its label.
          </Typography>
        </Box>
        <Card>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <LabelIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No package selected
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Go to a delivery detail page and choose a package to manage its label.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/admin/deliveries')} sx={{ textTransform: 'none', borderRadius: 2 }}>
              View Deliveries
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (loading && labels.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}>
          Back
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Package Label
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Package ID: <span style={{ fontFamily: 'monospace' }}>{packageId}</span>
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Active label actions */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Active Label
              </Typography>

              {!activeLabel ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No active label. Generate one by regenerating the label.
                </Alert>
              ) : (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip size="small" label={activeLabel.status} color="success" sx={{ height: 24 }} />
                    <Chip size="small" label={activeLabel.format.toUpperCase()} sx={{ height: 24 }} />
                    <Typography variant="body2" color="text.secondary">
                      Version {activeLabel.version}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Generated: {activeLabel.generatedAt ? new Date(activeLabel.generatedAt).toLocaleString() : 'N/A'}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PreviewIcon />}
                  onClick={handlePreview}
                  disabled={!activeLabel || actionLoading}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  Preview
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownload('pdf')}
                  disabled={!activeLabel || actionLoading}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  PDF
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownload('png')}
                  disabled={!activeLabel || actionLoading}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  PNG
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  disabled={!activeLabel || actionLoading || !canPrint}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  Print
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  startIcon={<RefreshIcon />}
                  onClick={openRegenerateDialog}
                  disabled={actionLoading || !canRegenerate}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  Regenerate
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AttachFileIcon />}
                  onClick={handleMarkAttached}
                  disabled={actionLoading}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  Mark Attached
                </Button>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Previews and downloads use backend-generated signed URLs. No QR or PDF is generated locally.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Label history */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Label History
              </Typography>
              <LabelHistory labels={labels} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Regenerate confirmation dialog */}
      <Dialog open={regenerateDialogOpen} onClose={() => setRegenerateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Regenerate Label</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Regenerating will create a new label version and revoke the current active label. A reason is required.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Reason"
            fullWidth
            required
            value={regenerateReason}
            onChange={(e) => setRegenerateReason(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Note (optional)"
            fullWidth
            multiline
            rows={3}
            value={regenerateNote}
            onChange={(e) => setRegenerateNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegenerateDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleRegenerate}
            variant="contained"
            disabled={!regenerateReason.trim() || actionLoading}
            sx={{ textTransform: 'none' }}
          >
            Regenerate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: (theme) => theme.zIndex.snackbar,
        }}
      >
        {snackbar.open && (
          <Alert severity="info" onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        )}
      </Box>
    </Box>
  );
}
