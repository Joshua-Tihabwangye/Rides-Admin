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
import StatusBadge from '../components/StatusBadge';
import {
  getAdminDelivery,
  getAdminDeliveryPackages,
} from '../services/api/adminApi';
import type { AdminDeliveryOrderResponse, AdminDeliveryPackageResponse, AdminDeliveryEventResponse } from '../services/api/adminApi';

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

function LocationBlock({ title, location }: { title: string; location?: AdminDeliveryOrderResponse['sender'] }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
        {title}
      </Typography>
      <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon fontSize="small" color="action" />
          <Typography variant="body2">{location?.contactName || 'N/A'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhoneIcon fontSize="small" color="action" />
          <Typography variant="body2">{location?.contactPhone || 'N/A'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <LocationOnIcon fontSize="small" color="action" sx={{ mt: 0.3 }} />
          <Typography variant="body2">{location?.address || 'N/A'}</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {location?.city && `${location.city}, `}{location?.country || ''}
        </Typography>
      </Box>
    </Box>
  );
}

function PackageCard({
  packageItem,
  onViewLabel,
}: {
  packageItem: AdminDeliveryPackageResponse;
  onViewLabel: (packageId: string) => void;
}) {
  return (
    <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LocalShippingIcon color="primary" />
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                Package {packageItem.trackingCode || packageItem.id}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {packageItem.description || 'No description'}
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
              {packageItem.weight ? `${packageItem.weight} ${packageItem.weightUnit || 'kg'}` : 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Dimensions</Typography>
            <Typography variant="body2" fontWeight={600}>
              {packageItem.dimensions
                ? `${packageItem.dimensions.length || 0}×${packageItem.dimensions.width || 0}×${packageItem.dimensions.height || 0} ${packageItem.dimensions.unit || 'cm'}`
                : 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Label status</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
              <LabelIcon fontSize="small" color={packageItem.labelStatus === 'generated' ? 'success' : 'action'} />
              <Typography variant="body2" fontWeight={600}>
                {packageItem.labelStatus || 'pending'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
  const [packages, setPackages] = useState<AdminDeliveryPackageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

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
        setPackages(packagesData.items);
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
                <StatusBadge status={delivery.labelStatus || 'pending'} />
              </Box>

              <Divider sx={{ my: 2 }} />

              <LocationBlock title="Sender" location={delivery.sender} />

              <Divider sx={{ my: 2 }} />

              <LocationBlock title="Recipient" location={delivery.recipient} />

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Route
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2">
                    Distance: {delivery.route?.estimatedDistanceMeters ? `${(delivery.route.estimatedDistanceMeters / 1000).toFixed(1)} km` : 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Duration: {delivery.route?.estimatedDurationSeconds ? `${Math.round(delivery.route.estimatedDurationSeconds / 60)} min` : 'N/A'}
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
                    <PackageCard key={pkg.id} packageItem={pkg} onViewLabel={handleViewLabel} />
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
    </Box>
  );
}
