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
  Divider,
  Grid,
  Typography,
  Tabs,
  Tab,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LabelIcon from '@mui/icons-material/Label';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventIcon from '@mui/icons-material/Event';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import StatusBadge from '../components/StatusBadge';
import {
  getAdminDelivery,
  getAdminDeliveryPackages,
  downloadAdminLabelAsset,
  recordAdminLabelPrintEvent,
} from '../services/api/adminApi';
import type { AdminDeliveryOrderResponse, AdminDeliveryPackageView, AdminDeliveryEventResponse, AdminDeliveryLabelResponse } from '../services/api/adminApi';
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`delivery-tabpanel-${index}`} aria-labelledby={`delivery-tab-${index}`} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function LocationBlock({ title, contact, address }: { title: string; contact?: AdminDeliveryOrderResponse['sender']; address?: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
        {title}
      </Typography>
      <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon fontSize="small" color="action" />
          <Typography variant="body2">{contact?.name || 'N/A'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhoneIcon fontSize="small" color="action" />
          <Typography variant="body2">{contact?.phone || 'N/A'}</Typography>
        </Box>
        {contact?.email && (
          <Typography variant="caption" color="text.secondary">
            {contact.email}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <LocationOnIcon fontSize="small" color="action" sx={{ mt: 0.3 }} />
          <Typography variant="body2">{address || 'N/A'}</Typography>
        </Box>
      </Box>
    </Box>
  );
}

function LabelQrPreview({ labelId }: { labelId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Fetch the backend signed URL so the exact stored QR asset is shown (never generated client-side).
    downloadAdminLabelAsset(labelId, 'qr')
      .then((asset) => {
        if (!cancelled) setUrl(asset.downloadUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [labelId]);

  if (failed) {
    return (
      <Typography variant="caption" color="text.secondary">
        QR unavailable
      </Typography>
    );
  }
  if (!url) {
    return <CircularProgress size={20} />;
  }
  return (
    <Box
      component="img"
      src={url}
      alt="Label QR code"
      sx={{ width: 72, height: 72, borderRadius: 1, border: '1px solid', borderColor: 'divider', objectFit: 'contain' }}
    />
  );
}

function PackageCard({
  packageItem,
  onViewLabel,
  onDownloadLabel,
  onPrintLabel,
  actionLoading,
  canDownloadLabels,
  canPrintLabels,
}: {
  packageItem: AdminDeliveryPackageView;
  onViewLabel: (packageId: string) => void;
  onDownloadLabel: (label: AdminDeliveryLabelResponse, format: 'pdf' | 'png') => void;
  onPrintLabel: (label: AdminDeliveryLabelResponse) => void;
  actionLoading: boolean;
  canDownloadLabels: boolean;
  canPrintLabels: boolean;
}) {
  const label = (packageItem.activeLabel ?? null) as AdminDeliveryLabelResponse | null;
  const rawPrintCount = (label as Record<string, unknown> | null)?.printCount
    ?? (label as Record<string, unknown> | null)?.print_count;
  const printCount =
    typeof rawPrintCount === 'number' || typeof rawPrintCount === 'string'
      ? rawPrintCount
      : 'N/A';

  return (
    <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LocalShippingIcon color="primary" />
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {packageItem.packageIdentifier || `Package ${packageItem.packageNumber}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {packageItem.packageName || 'No name'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StatusBadge status={packageItem.status} />
            <IconButton size="small" onClick={() => onViewLabel(packageItem.id)}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Weight</Typography>
            <Typography variant="body2" fontWeight={600}>
              {packageItem.weightKg ? `${packageItem.weightKg} kg` : 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Dimensions</Typography>
            <Typography variant="body2" fontWeight={600}>
              {packageItem.dimensions
                ? `${packageItem.dimensions.lengthCm ?? 0}×${packageItem.dimensions.widthCm ?? 0}×${packageItem.dimensions.heightCm ?? 0} cm`
                : 'N/A'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {label ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 1.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Label status</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                <LabelIcon fontSize="small" color={label.status === 'active' ? 'success' : 'action'} />
                <Typography variant="body2" fontWeight={600}>
                  {label.status || 'pending'}
                </Typography>
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Label version</Typography>
              <Typography variant="body2" fontWeight={600}>
                v{label.version ?? 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Issued</Typography>
              <Typography variant="body2" fontWeight={600}>
                {label.generatedAt ? new Date(label.generatedAt).toLocaleString() : 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Print count</Typography>
              <Typography variant="body2" fontWeight={600}>
                {printCount}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">QR code</Typography>
              <Box sx={{ mt: 0.25 }}>
                <LabelQrPreview labelId={label.id} />
              </Box>
            </Box>
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 1.5 }}>
            No label generated yet.
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1 }}>
          {label && canDownloadLabels && (
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => onDownloadLabel(label, 'pdf')}
                disabled={actionLoading}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Download PDF
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => onDownloadLabel(label, 'png')}
                disabled={actionLoading}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Download PNG
              </Button>
            </>
          )}
          {label && canPrintLabels && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => onPrintLabel(label)}
              disabled={actionLoading}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Print label
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={<LabelIcon />}
            onClick={() => onViewLabel(packageItem.id)}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Manage Label
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

function EventTimeline({ events }: { events?: AdminDeliveryEventResponse[] }) {
  if (!events || events.length === 0) {
    return <Typography color="text.secondary">No events recorded yet.</Typography>;
  }

  const sorted = [...events].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  return (
    <List dense>
      {sorted.map((event) => (
        <ListItem key={event.id} alignItems="flex-start" sx={{ px: 0 }}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <EventIcon fontSize="small" color="action" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" fontWeight={600}>
                  {event.type}
                </Typography>
                {event.status && <Chip size="small" label={event.status} sx={{ height: 20, fontSize: 10 }} />}
              </Box>
            }
            secondary={
              <>
                <Typography variant="caption" component="span" color="text.secondary">
                  {event.description || 'No details'}
                </Typography>
                <br />
                <Typography variant="caption" component="span" color="text.disabled">
                  {new Date(event.occurredAt).toLocaleString()}
                </Typography>
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}

export default function DeliveryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<AdminDeliveryOrderResponse | null>(null);
  const [packages, setPackages] = useState<AdminDeliveryPackageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string; open: boolean }>({ message: '', open: false });

  const canDownloadLabels = hasAny(['view_delivery_labels']);
  const canPrintLabels = hasAny(['print_delivery_labels']);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [deliveryData, packagesData] = await Promise.all([
          getAdminDelivery(id),
          getAdminDeliveryPackages(id),
        ]);
        setDelivery(deliveryData);
        const packageList = Array.isArray(packagesData) ? packagesData : [];
        const fallbackPackages = Array.isArray(deliveryData?.packages) ? deliveryData.packages : [];
        setPackages(packageList.length > 0 ? packageList : fallbackPackages);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load delivery');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleViewLabel = (packageId: string) => {
    navigate(`/admin/delivery-packages/${packageId}/label`);
  };

  const handleDownloadLabel = async (label: AdminDeliveryLabelResponse, format: 'pdf' | 'png') => {
    try {
      const asset = await downloadAdminLabelAsset(label.id, format);
      openSignedUrl(asset.downloadUrl);
    } catch (e: any) {
      setSnackbar({ message: `Download failed: ${e?.message ?? 'Unknown error'}`, open: true });
    }
  };

  const handlePrintLabel = async (label: AdminDeliveryLabelResponse) => {
    setActionLoading(true);
    try {
      await recordAdminLabelPrintEvent(label.id, 'admin-portal');
      const asset = await downloadAdminLabelAsset(label.id, label.format === 'png' ? 'png' : 'pdf');
      openSignedUrl(asset.downloadUrl);
      setSnackbar({ message: 'Print event recorded and download opened.', open: true });
    } catch (e: any) {
      setSnackbar({ message: `Print failed: ${e?.message ?? 'Unknown error'}`, open: true });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !delivery) {
    return <Alert severity="error">{error || 'Delivery not found'}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/deliveries')} sx={{ color: 'text.secondary' }}>
          Back to Deliveries
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Left column: summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <LocalShippingIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {delivery.trackingCode || `Delivery ${delivery.id}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Origin: {delivery.originType || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                <StatusBadge status={delivery.status} />
                <StatusBadge status={delivery.readinessStatus || 'unknown'} />
              </Box>

              <Divider sx={{ my: 2 }} />

              <LocationBlock title="Sender" contact={delivery.sender} address={delivery.pickupAddress} />

              <Divider sx={{ my: 2 }} />

              <LocationBlock title="Recipient" contact={delivery.receiver} address={delivery.destinationAddress} />

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Route
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2">
                    Distance: {delivery.route && typeof delivery.route === 'object' && 'estimatedDistanceKm' in delivery.route && Number(delivery.route.estimatedDistanceKm) > 0 ? `${(Number(delivery.route.estimatedDistanceKm) / 1000).toFixed(1)} km` : 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Duration: {delivery.route && typeof delivery.route === 'object' && 'estimatedDurationMinutes' in delivery.route && Number(delivery.route.estimatedDurationMinutes) > 0 ? `${Math.round(Number(delivery.route.estimatedDurationMinutes))} min` : 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Driver: {delivery.driverName || delivery.driverId || 'Unassigned'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: packages and events */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                <Tab label={`Packages (${packages.length})`} />
                <Tab label={`Events (${delivery.events?.length ?? 0})`} />
              </Tabs>
            </Box>
            <CardContent>
              <CustomTabPanel value={tabValue} index={0}>
                {packages.length === 0 ? (
                  <Typography color="text.secondary">No packages for this delivery.</Typography>
                ) : (
                  packages.map((pkg) => (
                    <PackageCard
                      key={pkg.id}
                      packageItem={pkg}
                      onViewLabel={handleViewLabel}
                      onDownloadLabel={handleDownloadLabel}
                      onPrintLabel={handlePrintLabel}
                      actionLoading={actionLoading}
                      canDownloadLabels={canDownloadLabels}
                      canPrintLabels={canPrintLabels}
                    />
                  ))
                )}
              </CustomTabPanel>
              <CustomTabPanel value={tabValue} index={1}>
                <EventTimeline events={delivery.events} />
              </CustomTabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
