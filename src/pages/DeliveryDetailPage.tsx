import React, { useCallback, useEffect, useState } from 'react';
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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LabelIcon from '@mui/icons-material/Label';
import LockIcon from '@mui/icons-material/Lock';
import RefreshIcon from '@mui/icons-material/Refresh';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventIcon from '@mui/icons-material/Event';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import GppBadIcon from '@mui/icons-material/GppBad';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StatusBadge from '../components/StatusBadge';
import AuditTrailViewer from '../components/AuditTrailViewer';
import {
  getAdminDelivery,
  getAdminDeliveryPackages,
  downloadAdminLabelAsset,
  recordAdminLabelPrintEvent,
  getAdminDeliveryDropoffCredential,
  revokeAdminDeliveryDropoffCredential,
  generateAdminDeliveryDropoffCredential,
  listAdminDeliveryDropoffCredentialHistory,
  listAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  getAdminOrderProducts,
  attachAdminOrderProducts,
  getAdminDeliveryLedger,
  listAdminDeliveryReconciliationAlerts,
  runAdminDeliveryReconciliation,
  resolveAdminDeliveryReconciliationAlert,
  dismissAdminDeliveryReconciliationAlert,
} from '../services/api/adminApi';
import type {
  AdminDeliveryOrderResponse,
  AdminDeliveryPackageView,
  AdminDeliveryEventResponse,
  AdminDeliveryLabelResponse,
  DeliveryLabelAttribute,
  AdminDropoffCredentialResponse,
  AdminDropoffCredentialHistoryItem,
  AdminDeliveryOrderProduct,
  AdminDeliveryProduct,
  AdminDeliveryLedgerEntry,
  AdminDeliveryLedgerView,
  AdminDeliveryReconciliationAlert,
} from '../services/api/adminApi';
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

async function downloadFile(url: string, filename: string) {
  if (!url) return;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
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

function formatDeliveryAttributeValue(attr: DeliveryLabelAttribute): string {
  const raw =
    attr.valueType === 'BOOLEAN'
      ? attr.value === true || attr.value === 'true'
        ? 'Yes'
        : 'No'
      : String(attr.value);
  return attr.unit ? `${raw} ${attr.unit}` : raw;
}

// Architecture §7.1: only PUBLIC_LABEL attributes with displayOnLabel=true may be printed.
function isDeliveryAttributePrinted(attr: DeliveryLabelAttribute): boolean {
  return attr.displayOnLabel === true && attr.visibility === 'PUBLIC_LABEL';
}

function deliveryAttributeOmissionReason(attr: DeliveryLabelAttribute): string {
  if (attr.visibility !== 'PUBLIC_LABEL') return `Not printable on label (${attr.visibility})`;
  return 'Hidden from label';
}

const ATTRIBUTE_PRIORITY_RANK: Record<string, number> = { REQUIRED: 0, HIGH: 1, NORMAL: 2 };

function sortDeliveryAttributes(attributes: DeliveryLabelAttribute[]): DeliveryLabelAttribute[] {
  return [...attributes].sort((a, b) => {
    const priorityDelta =
      (ATTRIBUTE_PRIORITY_RANK[a.priority] ?? 2) - (ATTRIBUTE_PRIORITY_RANK[b.priority] ?? 2);
    if (priorityDelta !== 0) return priorityDelta;
    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
    return a.label.localeCompare(b.label);
  });
}

function PackageAttributes({ attributes }: { attributes?: DeliveryLabelAttribute[] }) {
  if (!attributes || attributes.length === 0) return null;
  const sorted = sortDeliveryAttributes(attributes);
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
        Package attributes
      </Typography>
      <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {sorted.map((attr, index) => {
          const printed = isDeliveryAttributePrinted(attr);
          return (
            <Box component="li" key={`${attr.key}-${index}`} sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75 }}>
              <Typography variant="body2" fontWeight={600}>
                {attr.label}:
              </Typography>
              <Typography variant="body2">{formatDeliveryAttributeValue(attr)}</Typography>
              <Chip
                size="small"
                label={printed ? 'Printed' : 'Omitted'}
                color={printed ? 'success' : 'default'}
                variant={printed ? 'filled' : 'outlined'}
                sx={{ height: 20, fontSize: 10 }}
                title={printed ? 'Printed on the label' : deliveryAttributeOmissionReason(attr)}
              />
              <Chip size="small" label={attr.source} variant="outlined" sx={{ height: 20, fontSize: 10 }} title="Attribute source" />
              <Chip size="small" label={attr.visibility} variant="outlined" sx={{ height: 20, fontSize: 10 }} title="Attribute visibility" />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function PackageItemsAllocation({ items }: { items?: AdminDeliveryPackageView['items'] }) {
  if (!items || items.length === 0) return null;
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
        Allocated items
      </Typography>
      <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {items.map((item, index) => (
          <Box component="li" key={item.id ?? item.orderItemId ?? index} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography variant="body2">
              {item.productName || item.name || 'Item'} × {item.quantity}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function PackageCard({
  packageItem,
  originType,
  onViewLabel,
  onDownloadLabel,
  onPrintLabel,
  actionLoading,
  canDownloadLabels,
  canPrintLabels,
}: {
  packageItem: AdminDeliveryPackageView;
  originType?: string;
  onViewLabel: (packageId: string) => void;
  onDownloadLabel: (label: AdminDeliveryLabelResponse, format: 'pdf' | 'png') => void;
  onPrintLabel: (label: AdminDeliveryLabelResponse) => void;
  actionLoading: boolean;
  canDownloadLabels: boolean;
  canPrintLabels: boolean;
}) {
  const label = packageItem.activeLabel ?? null;
  // Newer backends return printCount; older ones may still return print_count.
  const rawPrintCount =
    label?.printCount ?? (label as Record<string, unknown> | null)?.print_count;
  const printCount =
    typeof rawPrintCount === 'number' || typeof rawPrintCount === 'string'
      ? rawPrintCount
      : 'N/A';
  const warningCount = label?.renderWarnings?.length ?? 0;
  const destinationRedacted =
    label?.preview?.privacyMode === 'DESTINATION_REDACTED' ||
    (!label?.preview && originType === 'MARKETPLACE');

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
          <Box>
            <Typography variant="caption" color="text.secondary">Handling</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25, flexWrap: 'wrap' }}>
              {packageItem.fragile && (
                <Chip size="small" color="warning" label="Fragile" sx={{ height: 20, fontSize: 10 }} />
              )}
              {(packageItem.attributes ?? [])
                .filter((attr) => attr.priority === 'REQUIRED')
                .map((attr, index) => (
                  <Chip
                    key={`${attr.key}-${index}`}
                    size="small"
                    color="warning"
                    variant="outlined"
                    label={`${attr.label}: ${formatDeliveryAttributeValue(attr)}`}
                    sx={{ height: 20, fontSize: 10 }}
                  />
                ))}
              {!packageItem.fragile && !(packageItem.attributes ?? []).some((attr) => attr.priority === 'REQUIRED') && (
                <Typography variant="body2" fontWeight={600}>None</Typography>
              )}
            </Box>
          </Box>
        </Box>

        <PackageAttributes attributes={packageItem.attributes} />
        <PackageItemsAllocation items={packageItem.items} />

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
            {label.templateVersion && (
              <Box>
                <Typography variant="caption" color="text.secondary">Template</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {label.templateVersion}
                </Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" color="text.secondary">Snapshot warnings</Typography>
              <Typography variant="body2" fontWeight={600} color={warningCount > 0 ? 'warning.main' : 'inherit'}>
                {warningCount}
              </Typography>
            </Box>
            {destinationRedacted && (
              <Box>
                <Typography variant="caption" color="text.secondary">Privacy</Typography>
                <Box sx={{ mt: 0.25 }}>
                  <Chip
                    size="small"
                    color="info"
                    label="Destination redacted (marketplace)"
                    sx={{ height: 20, fontSize: 10 }}
                  />
                </Box>
              </Box>
            )}
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

function DeliveryCredentialSection({ deliveryId }: { deliveryId: string }) {
  const [credential, setCredential] = useState<AdminDropoffCredentialResponse | null>(null);
  const [history, setHistory] = useState<AdminDropoffCredentialHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCredential = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cred, hist] = await Promise.all([
        getAdminDeliveryDropoffCredential(deliveryId),
        listAdminDeliveryDropoffCredentialHistory(deliveryId),
      ]);
      setCredential(cred);
      setHistory(hist);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load credential');
    } finally {
      setLoading(false);
    }
  }, [deliveryId]);

  useEffect(() => {
    void loadCredential();
  }, [loadCredential]);

  const handleRevoke = async () => {
    if (!credential) return;
    setActionLoading(true);
    try {
      await revokeAdminDeliveryDropoffCredential(deliveryId, credential.id, 'Revoked by admin');
      await loadCredential();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to revoke credential');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerate = async () => {
    setActionLoading(true);
    try {
      await generateAdminDeliveryDropoffCredential(deliveryId);
      await loadCredential();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to generate credential');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {credential ? (
        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LockIcon color="primary" />
              <Typography variant="subtitle2" fontWeight={600}>
                Active Credential
              </Typography>
              <Chip
                size="small"
                label={credential.status}
                color={credential.status === 'active' ? 'success' : 'default'}
                sx={{ height: 20, fontSize: 10 }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">PIN</Typography>
                <Typography variant="h5" fontWeight={700} fontFamily="monospace" letterSpacing={4}>
                  {credential.pin}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Expires</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {new Date(credential.expiresAt).toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Created</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {new Date(credential.createdAt).toLocaleString()}
                </Typography>
              </Box>
              {credential.revokedAt ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">Revoked</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {new Date(credential.revokedAt).toLocaleString()}
                  </Typography>
                </Box>
              ) : null}
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {credential.status === 'active' ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<LockIcon />}
                  onClick={handleRevoke}
                  disabled={actionLoading}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  Revoke credential
                </Button>
              ) : null}
              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleGenerate}
                disabled={actionLoading}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Generate new
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ mb: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            No active credential.
          </Alert>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleGenerate}
            disabled={actionLoading}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Generate credential
          </Button>
        </Box>
      )}

      {history.length > 0 ? (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <HistoryIcon fontSize="inherit" />
            Credential history
          </Typography>
          <List dense>
            {history.map((item) => (
              <ListItem key={item.id} sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {item.status}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    item.revokedAt ? `Revoked: ${new Date(item.revokedAt).toLocaleString()}` : null
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      ) : null}
    </Box>
  );
}

function formatLedgerMoney(value: number | undefined, currency: string): string {
  const numeric = Number(value ?? 0);
  return `${currency} ${numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function LedgerEntryRow({ entry, currency }: { entry: AdminDeliveryLedgerEntry; currency: string }) {
  const isCredit = Number(entry.credit) > 0;
  return (
    <ListItem key={entry.id} sx={{ px: 0 }}>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" fontWeight={600} fontFamily="monospace">
              {entry.entryType}
            </Typography>
            <Chip
              size="small"
              label={isCredit ? 'CREDIT' : 'DEBIT'}
              color={isCredit ? 'success' : 'warning'}
              sx={{ height: 20, fontSize: 10 }}
            />
            <Typography variant="caption" color="text.secondary">
              {new Date(entry.createdAt).toLocaleString()}
            </Typography>
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mt: 0.25 }}>
            <Typography variant="caption" component="span" color="text.secondary" fontFamily="monospace">
              {entry.accountCode}
            </Typography>
            <Typography variant="caption" component="span" color="text.secondary">
              Amount: {formatLedgerMoney(isCredit ? entry.credit : entry.debit, entry.currency || currency)}
              {entry.grossAmount ? ` · Gross: ${formatLedgerMoney(entry.grossAmount, entry.currency || currency)}` : ''}
            </Typography>
            {entry.reason ? (
              <Typography variant="caption" component="span" color="text.secondary" fontStyle="italic">
                {entry.reason}
              </Typography>
            ) : null}
            {entry.refs?.providerTransactionId ? (
              <Typography variant="caption" component="span" color="text.disabled">
                Provider txn: {entry.refs.providerTransactionId}
              </Typography>
            ) : null}
            {entry.refs?.sourceEntryId ? (
              <Typography variant="caption" component="span" color="text.disabled">
                Compensates original entry: {entry.refs.sourceEntryId}
              </Typography>
            ) : null}
          </Box>
        }
      />
    </ListItem>
  );
}

function DeliveryLedgerSection({ orderId }: { orderId: string }) {
  const [ledger, setLedger] = useState<AdminDeliveryLedgerView | null>(null);
  const [alerts, setAlerts] = useState<AdminDeliveryReconciliationAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; open: boolean }>({ message: '', open: false });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ledgerData, allAlerts] = await Promise.all([
        getAdminDeliveryLedger(orderId),
        listAdminDeliveryReconciliationAlerts(),
      ]);
      setLedger(ledgerData);
      setAlerts((allAlerts ?? []).filter((alert) => alert.orderId === orderId));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load ledger');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleRunReconciliation = async () => {
    setActionLoading(true);
    try {
      const created = await runAdminDeliveryReconciliation();
      setSnackbar({
        message: `Reconciliation run complete — ${created?.length ?? 0} alert(s) created/updated.`,
        open: true,
      });
      await loadAll();
    } catch (e: any) {
      setSnackbar({ message: `Reconciliation failed: ${e?.message ?? 'Unknown error'}`, open: true });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    setActionLoading(true);
    try {
      await resolveAdminDeliveryReconciliationAlert(alertId);
      setSnackbar({ message: 'Alert resolved.', open: true });
      await loadAll();
    } catch (e: any) {
      setSnackbar({ message: `Failed to resolve alert: ${e?.message ?? 'Unknown error'}`, open: true });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    setActionLoading(true);
    try {
      await dismissAdminDeliveryReconciliationAlert(alertId);
      setSnackbar({ message: 'Alert dismissed.', open: true });
      await loadAll();
    } catch (e: any) {
      setSnackbar({ message: `Failed to dismiss alert: ${e?.message ?? 'Unknown error'}`, open: true });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  const currency = ledger?.entries?.[0]?.currency ?? 'UGX';
  const openAlerts = alerts.filter((alert) => alert.status === 'OPEN');

  return (
    <Box>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRunReconciliation}
          disabled={actionLoading}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Run reconciliation
        </Button>
      </Box>

      {ledger ? (
        <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AccountBalanceIcon color="primary" />
              <Typography variant="subtitle2" fontWeight={600}>
                Ledger entries
              </Typography>
              <Chip
                size="small"
                label={ledger.balanced ? 'Balanced' : 'UNBALANCED'}
                color={ledger.balanced ? 'success' : 'error'}
                sx={{ height: 20, fontSize: 10 }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Total debits</Typography>
                <Typography variant="body2" fontWeight={700}>
                  {formatLedgerMoney(ledger.debits, currency)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Total credits</Typography>
                <Typography variant="body2" fontWeight={700}>
                  {formatLedgerMoney(ledger.credits, currency)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Entries</Typography>
                <Typography variant="body2" fontWeight={700}>{ledger.entries.length}</Typography>
              </Box>
            </Box>

            {ledger.entries.length === 0 ? (
              <Alert severity="info">No ledger entries for this order yet.</Alert>
            ) : (
              <List dense>
                {ledger.entries.map((entry) => (
                  <LedgerEntryRow key={entry.id} entry={entry} currency={currency} />
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <GppBadIcon color={openAlerts.length > 0 ? 'error' : 'success'} />
            <Typography variant="subtitle2" fontWeight={600}>
              Reconciliation alerts
            </Typography>
            {openAlerts.length > 0 ? (
              <Chip size="small" label={`${openAlerts.length} open`} color="error" sx={{ height: 20, fontSize: 10 }} />
            ) : (
              <Chip size="small" label="None open" color="success" sx={{ height: 20, fontSize: 10 }} />
            )}
          </Box>

          {alerts.length === 0 ? (
            <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />}>
              No reconciliation alerts for this order.
            </Alert>
          ) : (
            <List dense>
              {alerts.map((alert) => (
                <ListItem key={alert.id} sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                          {alert.kind}
                        </Typography>
                        <Chip
                          size="small"
                          label={alert.status}
                          color={alert.status === 'OPEN' ? 'warning' : alert.status === 'RESOLVED' ? 'success' : 'default'}
                          sx={{ height: 20, fontSize: 10 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        <Typography variant="caption" component="span" color="text.secondary">
                          Expected {formatLedgerMoney(alert.expectedAmount, alert.currency)} · Actual{' '}
                          {formatLedgerMoney(alert.actualAmount, alert.currency)} · Mismatch{' '}
                          {formatLedgerMoney(alert.mismatchAmount, alert.currency)}
                        </Typography>
                        <Typography variant="caption" component="span" color="text.disabled">
                          {new Date(alert.createdAt).toLocaleString()}
                          {alert.resolvedAt ? ` · Resolved ${new Date(alert.resolvedAt).toLocaleString()}` : ''}
                        </Typography>
                      </Box>
                    }
                  />
                  {alert.status === 'OPEN' ? (
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleResolveAlert(alert.id)}
                        disabled={actionLoading}
                        sx={{ textTransform: 'none', borderRadius: 2, fontSize: 11 }}
                      >
                        Resolve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        onClick={() => handleDismissAlert(alert.id)}
                        disabled={actionLoading}
                        sx={{ textTransform: 'none', borderRadius: 2, fontSize: 11 }}
                      >
                        Dismiss
                      </Button>
                    </Box>
                  ) : null}
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

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
  const [orderProducts, setOrderProducts] = useState<AdminDeliveryOrderProduct[]>([]);
  const [orderProductsLoading, setOrderProductsLoading] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<AdminDeliveryProduct[]>([]);
  const [catalogProductsLoading, setCatalogProductsLoading] = useState(false);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [attachProducts, setAttachProducts] = useState<Array<{ productId?: string; name: string; quantity: number; unitPrice: number; notes?: string }>>([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminDeliveryProduct | null>(null);
  const [productForm, setProductForm] = useState({ name: '', description: '', category: '', sku: '', unitPrice: 0, currency: 'KES' });
  const [productSaving, setProductSaving] = useState(false);

  const canDownloadLabels = hasAny(['view_delivery_labels']);
  const canPrintLabels = hasAny(['print_delivery_labels']);

  const loadOrderProducts = React.useCallback(async () => {
    if (!id) return;
    setOrderProductsLoading(true);
    try {
      const products = await getAdminOrderProducts(id);
      setOrderProducts(Array.isArray(products) ? products : []);
    } catch {
      setOrderProducts([]);
    } finally {
      setOrderProductsLoading(false);
    }
  }, [id]);

  const loadCatalogProducts = React.useCallback(async () => {
    setCatalogProductsLoading(true);
    try {
      const products = await listAdminProducts();
      setCatalogProducts(Array.isArray(products) ? products : []);
    } catch {
      setCatalogProducts([]);
    } finally {
      setCatalogProductsLoading(false);
    }
  }, []);

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
    loadOrderProducts();
    loadCatalogProducts();
  }, [id, loadOrderProducts, loadCatalogProducts]);

  const handleSaveProduct = async () => {
    setProductSaving(true);
    try {
      if (editingProduct) {
        await updateAdminProduct(editingProduct.id, productForm);
      } else {
        await createAdminProduct(productForm);
      }
      setProductDialogOpen(false);
      setEditingProduct(null);
      setProductForm({ name: '', description: '', category: '', sku: '', unitPrice: 0, currency: 'KES' });
      await loadCatalogProducts();
      setSnackbar({ message: `Product ${editingProduct ? 'updated' : 'created'} successfully.`, open: true });
    } catch (e: any) {
      setSnackbar({ message: `Failed to save product: ${e?.message ?? 'Unknown error'}`, open: true });
    } finally {
      setProductSaving(false);
    }
  };

  const handleOpenProductDialog = (product?: AdminDeliveryProduct) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description ?? '',
        category: product.category ?? '',
        sku: product.sku ?? '',
        unitPrice: product.unitPrice,
        currency: product.currency,
      });
    } else {
      setEditingProduct(null);
      setProductForm({ name: '', description: '', category: '', sku: '', unitPrice: 0, currency: 'KES' });
    }
    setProductDialogOpen(true);
  };

  const handleAttachProducts = async () => {
    if (!id || attachProducts.length === 0) return;
    setActionLoading(true);
    try {
      await attachAdminOrderProducts(id, attachProducts);
      setAttachDialogOpen(false);
      setAttachProducts([]);
      await loadOrderProducts();
      setSnackbar({ message: 'Products attached to order.', open: true });
    } catch (e: any) {
      setSnackbar({ message: `Failed to attach products: ${e?.message ?? 'Unknown error'}`, open: true });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddAttachRow = () => {
    setAttachProducts([...attachProducts, { name: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleUpdateAttachRow = (index: number, field: string, value: string | number) => {
    const updated = [...attachProducts];
    (updated[index] as any)[field] = value;
    if (field === 'productId' && value) {
      const catalog = catalogProducts.find((p) => p.id === value);
      if (catalog) {
        updated[index].name = catalog.name;
        updated[index].unitPrice = catalog.unitPrice;
      }
    }
    setAttachProducts(updated);
  };

  const handleRemoveAttachRow = (index: number) => {
    setAttachProducts(attachProducts.filter((_, i) => i !== index));
  };

  const handleViewLabel = (packageId: string) => {
    navigate(`/admin/delivery-packages/${packageId}/label`);
  };

  const handleDownloadLabel = async (label: AdminDeliveryLabelResponse, format: 'pdf' | 'png') => {
    try {
      const asset = await downloadAdminLabelAsset(label.id, format);
      const extension = format === 'pdf' ? 'pdf' : 'png';
      const filename = asset.fileName || `label-${label.id}.${extension}`;
      await downloadFile(asset.downloadUrl, filename);
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
                    Distance: {delivery.route && typeof delivery.route === 'object' && 'distanceKm' in delivery.route && Number((delivery.route as Record<string, unknown>).distanceKm) > 0 ? `${Number((delivery.route as Record<string, unknown>).distanceKm).toFixed(1)} km` : 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Duration: {delivery.route && typeof delivery.route === 'object' && 'durationMinutes' in delivery.route && Number((delivery.route as Record<string, unknown>).durationMinutes) > 0 ? `${Math.round(Number((delivery.route as Record<string, unknown>).durationMinutes))} min` : 'N/A'}
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
                <Tab label={`Products (${orderProducts.length})`} />
                <Tab label={`Events (${delivery.events?.length ?? 0})`} />
                <Tab label="Credentials" />
                <Tab label="Audit Trail" />
                <Tab label="Ledger & Alerts" />
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
                      originType={delivery.originType}
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Order Products
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="contained" onClick={() => setAttachDialogOpen(true)} sx={{ textTransform: 'none', borderRadius: 2 }}>
                      Attach Products
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => handleOpenProductDialog()} sx={{ textTransform: 'none', borderRadius: 2 }}>
                      New Product
                    </Button>
                  </Box>
                </Box>
                {orderProductsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : orderProducts.length === 0 ? (
                  <Typography color="text.secondary">No products attached to this order.</Typography>
                ) : (
                  <List dense>
                    {orderProducts.map((product) => (
                      <ListItem key={product.id} sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="body2" fontWeight={600}>
                                {product.name}
                              </Typography>
                              <Chip size="small" label={`×${product.quantity}`} sx={{ height: 20, fontSize: 10 }} />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                              <Typography variant="caption" color="text.secondary">
                                Unit price: {product.currency} {product.unitPrice.toLocaleString()} · Line total: {product.currency} {product.lineTotal.toLocaleString()}
                              </Typography>
                              {product.notes ? (
                                <Typography variant="caption" color="text.secondary" fontStyle="italic">
                                  Notes: {product.notes}
                                </Typography>
                              ) : null}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                    <Divider sx={{ my: 1 }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={700}>
                            Total: {orderProducts[0]?.currency ?? 'KES'} {orderProducts.reduce((sum, p) => sum + p.lineTotal, 0).toLocaleString()}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </List>
                )}
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button size="small" variant="outlined" onClick={() => handleOpenProductDialog()} sx={{ textTransform: 'none', borderRadius: 2 }}>
                    Manage Product Catalog
                  </Button>
                </Box>
              </CustomTabPanel>
              <CustomTabPanel value={tabValue} index={2}>
                <EventTimeline events={delivery.events} />
              </CustomTabPanel>
              <CustomTabPanel value={tabValue} index={3}>
                <DeliveryCredentialSection deliveryId={id!} />
              </CustomTabPanel>
              <CustomTabPanel value={tabValue} index={4}>
                <AuditTrailViewer orderId={id!} />
              </CustomTabPanel>
              <CustomTabPanel value={tabValue} index={5}>
                <DeliveryLedgerSection orderId={id!} />
              </CustomTabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Product Management Dialog */}
      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProduct ? 'Edit Product' : 'Create Product'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Name" size="small" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
            <TextField label="Description" size="small" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} multiline rows={2} />
            <TextField label="Category" size="small" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
            <TextField label="SKU" size="small" value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} />
            <TextField label="Unit Price" size="small" type="number" value={productForm.unitPrice} onChange={(e) => setProductForm({ ...productForm, unitPrice: Number(e.target.value) })} required />
            <TextField label="Currency" size="small" value={productForm.currency} onChange={(e) => setProductForm({ ...productForm, currency: e.target.value })} />
          </Box>
          {editingProduct && catalogProducts.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Other products in catalog:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {catalogProducts.filter((p) => p.id !== editingProduct.id).map((p) => (
                  <Chip key={p.id} size="small" label={`${p.name} (${p.currency} ${p.unitPrice})`} variant="outlined" sx={{ height: 20, fontSize: 10 }} onClick={() => handleOpenProductDialog(p)} />
                ))}
              </Box>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleSaveProduct} variant="contained" disabled={!productForm.name || productSaving} sx={{ textTransform: 'none' }}>
            {productSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Attach Products Dialog */}
      <Dialog open={attachDialogOpen} onClose={() => setAttachDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Attach Products to Order</DialogTitle>
        <DialogContent>
          {attachProducts.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No products added yet.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
              {attachProducts.map((row, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <TextField
                      size="small"
                      label="Product"
                      value={row.productId ?? ''}
                      onChange={(e) => handleUpdateAttachRow(index, 'productId', e.target.value)}
                      select
                      SelectProps={{ native: true }}
                    >
                      <option value="">Custom</option>
                      {catalogProducts.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.currency} {p.unitPrice})</option>
                      ))}
                    </TextField>
                    {!row.productId ? (
                      <TextField size="small" label="Name" value={row.name} onChange={(e) => handleUpdateAttachRow(index, 'name', e.target.value)} />
                    ) : null}
                  </Box>
                  <TextField size="small" label="Qty" type="number" value={row.quantity} onChange={(e) => handleUpdateAttachRow(index, 'quantity', Number(e.target.value))} sx={{ width: 80 }} />
                  <TextField size="small" label="Price" type="number" value={row.unitPrice} onChange={(e) => handleUpdateAttachRow(index, 'unitPrice', Number(e.target.value))} sx={{ width: 100 }} />
                  <IconButton size="small" onClick={() => handleRemoveAttachRow(index)} color="error" sx={{ mt: 0.5 }}>
                    <Typography variant="caption" fontWeight={700}>✕</Typography>
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
          <Button size="small" onClick={handleAddAttachRow} sx={{ mt: 1, textTransform: 'none' }}>
            + Add Product
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttachDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleAttachProducts} variant="contained" disabled={attachProducts.length === 0 || actionLoading} sx={{ textTransform: 'none' }}>
            {actionLoading ? 'Attaching…' : 'Attach'}
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
